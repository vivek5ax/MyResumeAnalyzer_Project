import json
import os
import glob
from datetime import datetime

base_path = r"d:\1_RESUME_ANALYSER_INFOSYS\Resume_Analyzer\backend\taxonomies"
json_files = glob.glob(os.path.join(base_path, "*.json"))

for file_path in json_files:
    file_name = os.path.basename(file_path)
    domain_name = file_name.replace('.json', '')
    
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    # Skip if already migrated
    if "_meta" in data:
        print(f"Skipping {file_name}, already migrated.")
        continue
        
    new_data = {
        "_meta": {
            "domain": domain_name,
            "version": "1.0",
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        "categories": data
    }
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(new_data, f, indent=4)
        
    print(f"Migrated {file_name}")
