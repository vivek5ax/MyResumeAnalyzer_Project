import re
import os
import json
from datetime import datetime
from pathlib import Path

def generate_versions(text: str) -> dict:
    """
    Generates three specialized versions of the input text for different NLP tasks.
    """
    if not text:
        return {
            "raw_text": "",
            "light_clean_text": "",
            "normalized_text": ""
        }
    
    # ---------------------------------------------------------
    # VERSION A: Raw Text (Used for BERT Embeddings, spaCy NER)
    # ---------------------------------------------------------
    # Only normalizes whitespace/newlines to avoid parsing crashes
    # Preserves stopwords, punctuation, casing, sentences.
    text_raw = text.strip()
    
    # ---------------------------------------------------------
    # VERSION B: Light Clean (Used for spaCy PhraseMatcher)
    # ---------------------------------------------------------
    # Lowercases, removes noise, keeps letters/numbers and tech punctuation (. + # / -)
    text_light = text_raw.lower()
    # Remove PDF extraction bullet heuristic (' o ')
    text_light = re.sub(r'\s+o\s+', ' ', text_light)
    # explicitly preserve a-z, 0-9, \s, and technically important characters: . + # / -
    text_light = re.sub(r'[^a-z0-9\s.\+#/\-]', ' ', text_light)
    # Normalize intermediate whitespace
    text_light = ' '.join(text_light.split())
    
    # ---------------------------------------------------------
    # VERSION C: Normalized (Used for Keyword Frequency)
    # ---------------------------------------------------------
    # Same as B, but completely strips stopwords
    text_norm = text_light
    stop_words = {
        'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'up', 'about', 'into', 
        'over', 'after', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 
        'did', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 
        'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 
        'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'i', 'me', 'my', 'myself', 'we', 'our', 
        'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 
        'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 'its', 'itself', 
        'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', "that'll", 
        'these', 'those', 'am', 'because', 'as', 'until', 'while', 'of', 'against', 'between', 'through', 'during', 
        'before', 'again', 'further', 'once', 'here', 'there'
    }
    words = text_norm.split()
    text_norm = ' '.join([word for word in words if word not in stop_words])
    
    return {
        "raw_text": text_raw,
        "light_clean_text": text_light,
        "normalized_text": text_norm
    }


def save_data(resume_versions: dict, jd_versions: dict, resume_name: str, jd_name: str, resume_skills: dict = None, jd_skills: dict = None, bert_results: dict = None) -> str:
    """
    Saves extraction metadata maintaining all text versions.
    """
    session_id = f"ext_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    base_dir = Path(__file__).parent.parent / "data" / "sessions" / session_id
    base_dir.mkdir(parents=True, exist_ok=True)
    
    # Save a convenient clean human readable text just for file reference (Version B)
    with open(base_dir / "resume_light_clean.txt", "w", encoding="utf-8") as f:
        f.write(resume_versions["light_clean_text"])
        
    with open(base_dir / "jd_light_clean.txt", "w", encoding="utf-8") as f:
        f.write(jd_versions["light_clean_text"])
    
    # Save Metadata, Cleaned Content Versions, and Skills in JSON
    metadata = {
        "session_id": session_id,
        "timestamp": datetime.now().isoformat(),
        "resume_filename": resume_name,
        "jd_filename": jd_name,
        
        # Save all formats explicitly 
        "resume_versions": resume_versions,
        "jd_versions": jd_versions,
        
        "resume_skills": resume_skills or {"technical_skills": [], "soft_skills": []},
        "jd_skills": jd_skills or {"technical_skills": [], "soft_skills": []},
        "overall_alignment_score": bert_results.get("summary", {}).get("overall_alignment_score", 0.0) if bert_results else 0.0,
        "bert_results": bert_results or {"jd_bert_skills": [], "resume_bert_skills": [], "matched_bert_skills": []},
        
        # Maintain Auditability Rules
        "char_counts": {
            "resume_raw": len(resume_versions["raw_text"]),
            "resume_light_clean": len(resume_versions["light_clean_text"]),
            "resume_normalized": len(resume_versions["normalized_text"]),
            "jd_raw": len(jd_versions["raw_text"]),
            "jd_light_clean": len(jd_versions["light_clean_text"]),
            "jd_normalized": len(jd_versions["normalized_text"])
        }
    }
    
    with open(base_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)
        
    return session_id

