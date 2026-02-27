import spacy
import re
from sentence_transformers import SentenceTransformer, util
import torch
from .taxonomy_loader import load_taxonomy

# Load spaCy for sentence splitting
nlp = spacy.load("en_core_web_sm")

# Load BERT model
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_taxonomy_flat(domain):
    """
    Loads taxonomy and flattens it for BERT embedding generation.
    """
    taxonomy = load_taxonomy(domain)
    flat_skills = []
    for category_details in taxonomy.values():
        flat_skills.extend(category_details.get("skills", []))
    
    return sorted(list(set(flat_skills)))

def extract_bert_skills(text, domain="software", threshold=0.50):
    """
    Extracts skills by comparing segments of text to a domain-specific taxonomy using BERT.
    """
    if not text:
        return []

    # 1. Load domain-specific taxonomy
    flat_taxonomy = get_taxonomy_flat(domain)
    if not flat_taxonomy:
        return []
    
    skill_embeddings = model.encode(flat_taxonomy, convert_to_tensor=True, normalize_embeddings=True)
    
    # 2. Split into segments
    raw_segments = []
    doc = nlp(text)
    for sent in doc.sents:
        # Split by comma, bullet points, pipes, etc.
        sub_segments = re.split(r'[,|•\n\t]|(?<=\s)-(?=\s)', sent.text)
        raw_segments.extend([s.strip() for s in sub_segments if len(s.strip()) > 1])
    
    # Filter out long sentences, keep only potential skill phrases
    segments = sorted(list(set(s for s in raw_segments if len(s) < 100)))
    
    if not segments:
        return []
        
    # 3. Encode segments
    segment_embeddings = model.encode(segments, convert_to_tensor=True, normalize_embeddings=True)
    
    # 4. Compute Cosine Similarity
    cosine_scores = util.cos_sim(segment_embeddings, skill_embeddings)
    
    matched_skills = set()
    
    # 5. Find matches exceeding threshold
    for i, segment in enumerate(segments):
        scores = cosine_scores[i]
        match_indices = torch.where(scores >= threshold)[0]
        for idx in match_indices:
            skill = flat_taxonomy[idx.item()]
            matched_skills.add(skill)
            
    return sorted(list(matched_skills))

def verify_skill_presence(skill_name, text):
    """
    Sub-utility to check if a skill or its obvious variants exist as text in the content.
    This prevents BERT from 'hallucinating' skills based on related concepts.
    """
    text_lower = text.lower()
    skill_lower = skill_name.lower()
    
    # Direct check with word boundaries for short strings (e.g., "C", "SQL")
    if len(skill_lower) <= 3:
        if re.search(rf'\b{re.escape(skill_lower)}\b', text_lower):
            return True
    else:
        # For longer strings, check for substring but be wary of nested words
        if skill_lower in text_lower:
            return True
            
    # Comprehensive alias mapping for common technical terms
    aliases = {
        "C#": ["csharp", "c-sharp", ".net"],
        "C++": ["cpp", "c plus plus"],
        "React": ["reactjs", "react.js"],
        "Node.js": ["nodejs", "node.js"],
        "Next.js": ["nextjs", "next.js"],
        "Vue.js": ["vuejs", "vue.js"],
        "JavaScript": ["js", "es6", "javascript"],
        "TypeScript": ["ts", "typescript"],
        "Machine Learning": ["ml", "machine learning"],
        "Natural Language Processing": ["nlp", "natural language processing"],
        "Large Language Models": ["llm", "llms"],
        "Artificial Intelligence": ["ai"],
        "AWS": ["amazon web services", "aws"],
        "GCP": ["google cloud", "gcp"],
        "Azure": ["microsoft azure", "azure"],
        "CI/CD": ["cicd", "continuous integration", "continuous deployment"],
        "Docker": ["containerization", "docker"],
        "Kubernetes": ["k8s", "kubernetes"],
        "SQL": ["database", "mysql", "postgresql", "sql"],
        "REST API": ["restful", "api integration", "rest api"]
    }
    
    if skill_name in aliases:
        for alias in aliases[skill_name]:
            if alias.lower() in text_lower:
                return True
                
    return False

def analyze_semantic_matching(jd_text, resume_text, domain="software", threshold=0.50):
    """
    Performs domain-aware semantic analysis between Resume and JD.
    """
    print(f"\n--- Starting BERT Skill Classification [Domain: {domain}] ---")
    
    # Step 1: Extract skills from both (Taxonomy-based extraction)
    raw_jd_skills = extract_bert_skills(jd_text, domain, threshold)
    raw_resume_skills = extract_bert_skills(resume_text, domain, threshold)
    
    # Step 2: Strict textual verification to eliminate hallucinations
    jd_skills = [s for s in raw_jd_skills if verify_skill_presence(s, jd_text)]
    resume_skills = [s for s in raw_resume_skills if verify_skill_presence(s, resume_text)]
    
    if not jd_skills:
        print("⚠️ No JD skills identified.")
        return {
            "exact_match": [],
            "partial_match": [],
            "irrelevant": resume_skills,
            "jd_bert_skills": [],
            "resume_bert_skills": resume_skills
        }

    # Step 3: Compare Resume Skills against JD Skills using BERT
    jd_embeddings = model.encode(jd_skills, convert_to_tensor=True, normalize_embeddings=True)
    resume_embeddings = model.encode(resume_skills, convert_to_tensor=True, normalize_embeddings=True)
    
    similarity_matrix = util.cos_sim(resume_embeddings, jd_embeddings)
    
    exact_match = []
    partial_match = []
    irrelevant = []
    
    # Step 4: Logic-based Classification
    for i, r_skill in enumerate(resume_skills):
        # 1. Exact Match Check (case-insensitive)
        found_exact = False
        for j, j_skill in enumerate(jd_skills):
            if r_skill.lower() == j_skill.lower():
                exact_match.append(r_skill)
                found_exact = True
                break
        
        if found_exact:
            continue
            
        # 2. Partial Match Check (Conceptual Similarity)
        max_sim = torch.max(similarity_matrix[i]).item()
        
        if max_sim >= 0.65: # Threshold for semantic overlap
            partial_match.append(r_skill)
        else:
            irrelevant.append(r_skill)
            
    print(f"✅ Classification logic applied successfully.")
    
    return {
        "exact_match": sorted(exact_match),
        "partial_match": sorted(partial_match),
        "irrelevant": sorted(irrelevant),
        "jd_bert_skills": sorted(jd_skills),
        "resume_bert_skills": sorted(resume_skills)
    }
