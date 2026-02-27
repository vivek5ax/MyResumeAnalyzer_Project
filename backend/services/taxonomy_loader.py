import json
import os

BASE_PATH = os.path.join(os.path.dirname(__file__), "..", "taxonomies")

def load_taxonomy(domain):
    """
    Dynamically loads domain-specific taxonomy and merges it with soft skills.
    Args:
        domain (str): The job domain (e.g., 'software', 'data_science')
    Returns:
        dict: Merged taxonomy dictionary
    """
    domain_file = f"{domain.lower().replace(' ', '_')}.json"
    domain_path = os.path.join(BASE_PATH, domain_file)
    soft_path = os.path.join(BASE_PATH, "soft_skills.json")

    taxonomy = {}

    # Load Domain Taxonomy
    if os.path.exists(domain_path):
        with open(domain_path, "r") as f:
            taxonomy.update(json.load(f))
    else:
        print(f"⚠️ Domain file not found: {domain_path}")

    # Load Soft Skills Taxonomy (Always included)
    if os.path.exists(soft_path):
        with open(soft_path, "r") as f:
            taxonomy.update(json.load(f))
    else:
        print(f"⚠️ Soft skills file not found: {soft_path}")

    return taxonomy
