import spacy
from spacy.pipeline import EntityRuler
import json
import os
from .taxonomy_loader import load_taxonomy

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

def extract_skills(text: str, domain: str = "software"):
    """
    Extracts technical and soft skills from text using spaCy and a domain-specific taxonomy.
    Features:
    - Strict whitelisting: Only includes labels defined in our taxonomy.
    - Prevents misclassification: Overwrites default spaCy labels for technical terms.
    """
    if not text:
        return {"technical_skills": [], "soft_skills": [], "categorized_skills": {}}
    
    # Load the taxonomy for the selected domain
    taxonomy = load_taxonomy(domain)
    
    # 1. Prepare dynamic whitelist and patterns
    # We include category names as labels for our entities
    valid_labels = set()
    patterns = []
    
    for category, details in taxonomy.items():
        # Soft skills are standardized as SOFT_SKILL for UI consistency
        label = "SOFT_SKILL" if category == "Soft Skills" else category
        valid_labels.add(label)
        
        for skill in details.get("skills", []):
            patterns.append({"label": label, "pattern": skill.lower()})
            # Also add common variations like "nodeJS" for "Node.js" if needed
            # but primary relies on exact matches in lowercase
            
    # 2. Dynamic Pipeline Management
    # Clear any previous rulers to maintain isolation between requests
    for pipe_name in [n for n, p in nlp.pipeline if "ruler" in n]:
        nlp.remove_pipe(pipe_name)
    
    # Add the EntityRuler WITH overwrite_ents=True
    # This is CRITICAL to prevent 'matplotlib' being caught by spaCy's NER as 'PERSON'
    ruler = nlp.add_pipe("entity_ruler", before="ner")
    ruler.add_patterns(patterns)
    
    # 3. Process Text
    doc = nlp(text)
    
    technical_skills = set()
    soft_skills = set()
    categorized_skills = {}
    
    # 4. Filter Entities (STRICT WHITELISTING)
    for ent in doc.ents:
        # Only process entities that match our taxonomy labels
        if ent.label_ in valid_labels:
            if ent.label_ == "SOFT_SKILL":
                soft_skills.add(ent.text)
            else:
                technical_skills.add(ent.text)
                if ent.label_ not in categorized_skills:
                    categorized_skills[ent.label_] = set()
                categorized_skills[ent.label_].add(ent.text)
            
    # Clean up pipeline for next request
    nlp.remove_pipe("entity_ruler")
            
    return {
        "technical_skills": sorted(list(technical_skills)),
        "soft_skills": sorted(list(soft_skills)),
        "categorized_skills": {cat: sorted(list(skills)) for cat, skills in categorized_skills.items()}
    }
