import re
import os
import json
from datetime import datetime
from pathlib import Path

def clean_text(text: str) -> str:
    if not text:
        return ""
    
    # 1. Strip and lowercase
    text = text.strip().lower()
    
    # 2. Heuristic: Remove bullet points represented as 'o' (space + o + space)
    # Common issue in PDF extraction where bullets are parsed as lowercase 'o'
    text = re.sub(r'\s+o\s+', ' ', text)
    
    # 3. Remove special characters (preserving essential ones)
    # Preserving: a-z, 0-9, and . ! ? - @ /
    # (Removed comma manually)
    text = re.sub(r'[^a-z0-9\s.!?\-@/]', '', text)
    
    # 4. Heuristic: Remove sentence-ending dots
    # Removes dots followed by spaces or dots at the end of the string.
    # This preserves dots in the middle of words (like gmail.com).
    text = re.sub(r'\.(?=\s|$)', ' ', text)
    
    # 5. Remove Stop Words
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
        'before', 'again', 'further', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 
        'other', 'some', 'such', 'nor', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 
        'just', 'don', "don't", 'should', "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', 
        "aren't", 'couldn', "couldn't", 'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 
        'haven', "haven't", 'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 
        'shan', "shan't", 'shouldn', "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"
    }
    words = text.split()
    text = ' '.join([word for word in words if word not in stop_words])
    
    # 6. Normalize whitespace (convert multiple spaces/newlines to single space)
    text = ' '.join(text.split())
    
    return text

def save_data(resume_text: str, jd_text: str, resume_name: str, jd_name: str, resume_skills: dict = None, jd_skills: dict = None, bert_results: dict = None) -> str:
    # ... (session setup) ...
    session_id = f"ext_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    base_dir = Path(__file__).parent.parent / "data" / "sessions" / session_id
    base_dir.mkdir(parents=True, exist_ok=True)
    
    cleaned_resume = clean_text(resume_text)
    cleaned_jd = clean_text(jd_text)
    
    with open(base_dir / "resume_clean.txt", "w", encoding="utf-8") as f:
        f.write(cleaned_resume)
    with open(base_dir / "jd_clean.txt", "w", encoding="utf-8") as f:
        f.write(cleaned_jd)
    
    # 5. Save Metadata, Cleaned Content, and Skills in JSON
    metadata = {
        "session_id": session_id,
        "timestamp": datetime.now().isoformat(),
        "resume_filename": resume_name,
        "jd_filename": jd_name,
        "resume_clean": cleaned_resume,
        "jd_clean": cleaned_jd,
        "resume_skills": resume_skills or {"technical_skills": [], "soft_skills": []},
        "jd_skills": jd_skills or {"technical_skills": [], "soft_skills": []},
        "bert_results": bert_results or {"jd_bert_skills": [], "resume_bert_skills": [], "matched_bert_skills": []},
        "raw_counts": {
            "resume": len(resume_text),
            "jd": len(jd_text)
        },
        "clean_counts": {
            "resume": len(cleaned_resume),
            "jd": len(cleaned_jd)
        }
    }
    
    with open(base_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)
        
    return session_id
