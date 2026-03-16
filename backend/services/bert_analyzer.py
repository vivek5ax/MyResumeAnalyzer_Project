import spacy
import re
from sentence_transformers import SentenceTransformer, util
import torch
import os
from .taxonomy_loader import load_taxonomy, BASE_PATH

# Load spaCy strictly for semantic sentence splitting boundaries
nlp = spacy.load("en_core_web_sm", disable=["ner", "tagger", "lemmatizer", "textcat"]) # Parser needed for sentence segmenting

# Hardware Acceleration Setup
device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
print(f"🚀 Initializing BERT Model on DEVICE: {device.upper()}")
model = SentenceTransformer('all-MiniLM-L6-v2', device=device)

# Global Performance Caches
DOMAIN_SKILL_EMBEDDINGS = {}
DOMAIN_SKILL_LIST = {}
JD_EMBEDDING_CACHE = {}
DOMAIN_MTIME = {}

# Tunable thresholds
DETECTION_THRESHOLD = 0.55
STRONG_SIMILARITY_THRESHOLD = 0.72
MODERATE_SIMILARITY_THRESHOLD = 0.60

DOMAIN_SIMILARITY_THRESHOLDS = {
    "software": {"strong": 0.72, "moderate": 0.60},
    "medical": {"strong": 0.74, "moderate": 0.62},
    "finance": {"strong": 0.74, "moderate": 0.62},
    "marketing": {"strong": 0.70, "moderate": 0.58},
    "human_resources": {"strong": 0.70, "moderate": 0.58},
    "hr": {"strong": 0.70, "moderate": 0.58},
    "electrical": {"strong": 0.73, "moderate": 0.61},
}


def _normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def _extract_snippet(text: str, needle: str, radius: int = 100) -> str:
    """Return a short context snippet around first skill occurrence."""
    source = text or ""
    if not source.strip() or not needle:
        return ""

    pattern = re.compile(rf"\b{re.escape(needle)}\b", re.IGNORECASE)
    match = pattern.search(source)
    if not match:
        return ""

    start = max(0, match.start() - radius)
    end = min(len(source), match.end() + radius)
    snippet = source[start:end]
    snippet = _normalize_spaces(snippet)

    return snippet


def _build_match_evidence(partition: dict, missing: list, jd_text: str, resume_text: str, limit: int = 24) -> list:
    evidence = []

    for skill in partition.get("exact_match", []):
        evidence.append({
            "skill": skill,
            "match_type": "exact",
            "confidence": 1.0,
            "jd_skill": skill,
            "resume_skill": skill,
            "jd_snippet": _extract_snippet(jd_text, skill),
            "resume_snippet": _extract_snippet(resume_text, skill),
        })

    for item in partition.get("strong_semantic", []):
        evidence.append({
            "skill": item.get("similar_to"),
            "match_type": "strong_semantic",
            "confidence": float(item.get("score", 0.0)),
            "jd_skill": item.get("similar_to"),
            "resume_skill": item.get("skill"),
            "jd_snippet": _extract_snippet(jd_text, item.get("similar_to", "")),
            "resume_snippet": _extract_snippet(resume_text, item.get("skill", "")),
        })

    for item in partition.get("moderate_semantic", []):
        evidence.append({
            "skill": item.get("similar_to"),
            "match_type": "moderate_semantic",
            "confidence": float(item.get("score", 0.0)),
            "jd_skill": item.get("similar_to"),
            "resume_skill": item.get("skill"),
            "jd_snippet": _extract_snippet(jd_text, item.get("similar_to", "")),
            "resume_snippet": _extract_snippet(resume_text, item.get("skill", "")),
        })

    for item in missing:
        evidence.append({
            "skill": item.get("skill"),
            "match_type": "missing",
            "confidence": 0.0,
            "jd_skill": item.get("skill"),
            "resume_skill": None,
            "jd_snippet": _extract_snippet(jd_text, item.get("skill", "")),
            "resume_snippet": "",
            "weight": item.get("weight", 1.0),
        })

    evidence.sort(key=lambda item: item.get("confidence", 0), reverse=True)
    return evidence[:limit]


def get_domain_embeddings(domain: str):
    """
    Computes and caches Canonical Taxonomy embeddings massively improving runtime.
    Auto-invalidates if taxonomy JSON files are modified.
    """
    domain_clean = re.sub(r'[^a-z0-9_]', '', domain.lower().replace(' ', '_'))
    domain_path = os.path.join(BASE_PATH, f"{domain_clean}.json")
    soft_path = os.path.join(BASE_PATH, "soft_skills.json")
    
    current_mtime = 0
    if os.path.exists(domain_path):
        current_mtime += os.path.getmtime(domain_path)
    if os.path.exists(soft_path):
        current_mtime += os.path.getmtime(soft_path)
        
    if domain in DOMAIN_SKILL_EMBEDDINGS and DOMAIN_MTIME.get(domain) == current_mtime:
        return DOMAIN_SKILL_LIST[domain], DOMAIN_SKILL_EMBEDDINGS[domain]
        
    print(f"⚙️ Building Vector Embeddings for Taxonomy Domain: {domain}")
    
    # 1. Load taxonomy and rely entirely on structured skills_flat
    taxonomy_data = load_taxonomy(domain)
    skills_flat = taxonomy_data["skills_flat"]
    
    # Generate canonical list
    canonical_skills = sorted(list(skills_flat.keys()))
    
    # Batch Encode
    embeddings = model.encode(canonical_skills, convert_to_tensor=True, normalize_embeddings=True, device=device)
    
    # Cache
    DOMAIN_SKILL_LIST[domain] = canonical_skills
    DOMAIN_SKILL_EMBEDDINGS[domain] = embeddings
    DOMAIN_MTIME[domain] = current_mtime
    
    return canonical_skills, embeddings


def sanitize_resume_text(text: str) -> str:
    """
    Prevents BERT Fallback from parsing contaminated JD extraction blocks.
    """
    leakage_markers = [
        "expected skill extraction",
        "jd skills detected",
        "extracted jd skills",
        "resume analyzer results"
    ]
    
    lower_text = text.lower()
    for marker in leakage_markers:
        if marker in lower_text:
            split_index = lower_text.index(marker)
            return text[:split_index]
    return text


def analyze_semantic_matching(raw_jd_displays: list, raw_resume_displays: list, resume_text: str, domain: str = "software", threshold: float = 0.50, jd_text: str = ""):
    """
    Advanced semantic partitioning analysis comparing JD Requirements vs Resume Profile.
    Outputs strict analytical categorization for UI consumption.
    """
    print(f"\n--- Starting Advanced Semantic BERT Classification [Domain: {domain}] ---")
    
    resume_text = sanitize_resume_text(resume_text)
    
    taxonomy_data = load_taxonomy(domain)
    skills_flat = taxonomy_data["skills_flat"]

    domain_key = domain.lower().replace(" ", "_")
    threshold_profile = DOMAIN_SIMILARITY_THRESHOLDS.get(domain_key, {
        "strong": STRONG_SIMILARITY_THRESHOLD,
        "moderate": MODERATE_SIMILARITY_THRESHOLD,
    })
    strong_base = threshold_profile["strong"]
    moderate_base = max(threshold_profile["moderate"], float(threshold))
    
    jd_skills = [s.lower() for s in raw_jd_displays]
    jd_embeddings = model.encode(jd_skills, convert_to_tensor=True, normalize_embeddings=True, device=device) if jd_skills else None
    
    resume_skills = [s.lower() for s in raw_resume_displays]
    
    # Output structure
    partition = {
        "exact_match": [],
        "strong_semantic": [],
        "moderate_semantic": [],
        "irrelevant": []
    }
    
    missing_from_resume = []
    
    # Short circuit if JD is literally empty of skills
    if jd_embeddings is None or len(jd_skills) == 0:
        partition["irrelevant"] = raw_resume_displays
        return {
             "summary": {
                "total_jd_skills": 0,
                "resume_detected_skills": len(resume_skills),
                "exact_match_count": 0,
                "semantic_match_count": 0,
                "missing_skills_count": 0,
                "overall_alignment_score": 0.0
            },
            "skill_partition": partition,
            "missing_from_resume": [],
            "extra_resume_skills": raw_resume_displays,
            "jd_skill_clusters": {},
            "resume_skill_clusters": {},
            "match_evidence": []
        }

    # Evaluate Extracted Resume Skills
    resume_embeddings = model.encode(resume_skills, convert_to_tensor=True, normalize_embeddings=True, device=device) if resume_skills else None
    
    if resume_embeddings is not None and len(resume_skills) > 0:
        similarity_matrix = util.cos_sim(resume_embeddings, jd_embeddings)
        
        for i, r_skill in enumerate(resume_skills):
            display_r = raw_resume_displays[i]
            
            # Exact match short circuit WITH explicit raw text validation
            if r_skill in jd_skills:
                if re.search(rf'\b{re.escape(r_skill)}\b', resume_text.lower()):
                    partition["exact_match"].append(display_r)
                    continue
                
            # Semantic Thresholding
            max_sim_val, max_sim_idx = torch.max(similarity_matrix[i], dim=0)
            max_sim = max_sim_val.item()
            best_jd_match_display = raw_jd_displays[max_sim_idx.item()]
            
            token_len = len(r_skill.split())
            if token_len <= 2:
                strong_adj = strong_base - 0.05
                moderate_adj = moderate_base - 0.05
            else:
                strong_adj = strong_base
                moderate_adj = moderate_base
                
            aliases_map = taxonomy_data.get("aliases_map", {})
            if r_skill in aliases_map:
                max_sim += 0.05
            
            if max_sim >= strong_adj:
                partition["strong_semantic"].append({
                    "skill": display_r,
                    "similar_to": best_jd_match_display,
                    "score": round(max_sim, 2)
                })
            elif max_sim >= moderate_adj:
                partition["moderate_semantic"].append({
                     "skill": display_r,
                     "similar_to": best_jd_match_display,
                     "score": round(max_sim, 2)
                })
            else:
                partition["irrelevant"].append(display_r)
    
    matched_jd_lowered = set([s.lower() for s in partition["exact_match"]])
    for d in partition["strong_semantic"]:
        matched_jd_lowered.add(d["similar_to"].lower())
    for d in partition["moderate_semantic"]:
        matched_jd_lowered.add(d["similar_to"].lower())

    # Fallback to Raw Text Analysis for Missing JD Skills
    missing_candidates = [display for display in raw_jd_displays if display.lower() not in matched_jd_lowered]
    
    if missing_candidates:
        resume_segments = []
        if resume_text.strip():
            doc = nlp(resume_text)
            for sent in doc.sents:
                segment = sent.text.strip()
                if 3 <= len(segment.split()) <= 40:
                    resume_segments.append(segment)
                    
        if resume_segments:
            segment_embeddings = model.encode(resume_segments, convert_to_tensor=True, normalize_embeddings=True, device=device)
            candidate_embeddings = model.encode([c.lower() for c in missing_candidates], convert_to_tensor=True, normalize_embeddings=True, device=device)
            
            sim_matrix = util.cos_sim(segment_embeddings, candidate_embeddings)
            
            for i, candidate in enumerate(missing_candidates):
                candidate_lower = candidate.lower()
                
                # Regex Check
                has_exact = False
                skill_info = skills_flat.get(candidate_lower, {})
                canonical_display = skill_info.get("display", candidate).lower()
                if len(canonical_display) <= 3:
                    if re.search(rf'\b{re.escape(canonical_display)}\b', resume_text.lower()):
                        has_exact = True
                else:
                    if canonical_display in resume_text.lower():
                        has_exact = True
                
                max_sim_val, _ = torch.max(sim_matrix[:, i], dim=0)
                max_sim = max_sim_val.item()
                
                if has_exact:
                    partition["exact_match"].append(candidate)
                    matched_jd_lowered.add(candidate_lower)
                elif max_sim >= strong_base:
                    partition["strong_semantic"].append({
                        "skill": candidate,
                        "similar_to": candidate,
                        "score": round(max_sim, 2)
                    })
                    matched_jd_lowered.add(candidate_lower)

    # Compute Missing Skills correctly
    for j_display in raw_jd_displays:
        if j_display.lower() not in matched_jd_lowered:
            canon_j = j_display.lower()
            info = skills_flat.get(canon_j, {})
            missing_from_resume.append({
                "skill": j_display,
                "weight": info.get("max_weight", 1.0),
                "categories": info.get("categories", ["Unknown"])
            })
            
    missing_from_resume.sort(key=lambda x: x["weight"], reverse=True)
    
    def rebuild_clusters(skill_displays):
        clusters = {}
        for display in skill_displays:
            canon = display.lower()
            cats = skills_flat.get(canon, {}).get("categories", ["Unknown"])
            for c in cats:
                if c not in clusters: clusters[c] = []
                clusters[c].append(display)
        return clusters
        
    jd_clusters = rebuild_clusters(raw_jd_displays)
    resume_clusters = rebuild_clusters(raw_resume_displays)
    
    total_weight = sum([skills_flat.get(s.lower(), {}).get("max_weight", 1.0) for s in raw_jd_displays])
    
    if total_weight > 0:
        matched_jd_weight = 0.0
        counted = set()

        for match in partition["exact_match"]:
            key = match.lower()
            if key not in counted:
                matched_jd_weight += skills_flat.get(key, {}).get("max_weight", 1.0)
                counted.add(key)

        for strong in partition["strong_semantic"]:
            key = strong["similar_to"].lower()
            if key not in counted:
                matched_jd_weight += skills_flat.get(key, {}).get("max_weight", 1.0) * 0.6
                counted.add(key)

        for mod in partition["moderate_semantic"]:
            key = mod["similar_to"].lower()
            if key not in counted:
                matched_jd_weight += skills_flat.get(key, {}).get("max_weight", 1.0) * 0.4
                counted.add(key)

        overall_score = round((matched_jd_weight / total_weight) * 100, 1)
    else:
        overall_score = 0.0

    evidence_items = _build_match_evidence(partition, missing_from_resume, jd_text, resume_text)

    return {
         "summary": {
            "total_jd_skills": len(raw_jd_displays),
            "resume_detected_skills": len(raw_resume_displays),
            "exact_match_count": len(partition["exact_match"]),
            "semantic_match_count": len(partition["strong_semantic"]) + len(partition["moderate_semantic"]),
            "missing_skills_count": len(missing_from_resume),
            "overall_alignment_score": overall_score
        },
        "skill_partition": partition,
        "missing_from_resume": missing_from_resume,
        "extra_resume_skills": partition["irrelevant"],
        "jd_skill_clusters": jd_clusters,
        "resume_skill_clusters": resume_clusters,
        "match_evidence": evidence_items
    }
