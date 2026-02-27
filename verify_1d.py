import requests
import json
import os
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"

def test_skill_extraction():
    print("Testing /extract with Skill Extraction...")
    
    # Create dummy files
    resume_path = "test_resume.txt"
    with open(resume_path, "w") as f:
        f.write("I am a Python developer with experience in React and AWS. I have lead teams using Agile and Scrum. My communication skills are excellent.")
        
    jd_path = "test_jd.txt"
    with open(jd_path, "w") as f:
        f.write("Looking for a Java developer comfortable with Spring Boot and Docker. Must have strong leadership and problem solving skills.")
        
    files = {
        'resume': open(resume_path, 'rb'),
        'job_description_file': open(jd_path, 'rb')
    }
    
    response = requests.post(f"{BASE_URL}/extract", files=files)
    
    # Close and remove temp files
    files['resume'].close()
    files['job_description_file'].close()
    os.remove(resume_path)
    os.remove(jd_path)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Session ID: {data['session_id']}")
        
        print("\nExtracted Skills (Resume):")
        print(f"Technical: {data['resume_skills']['technical_skills']}")
        print(f"Soft: {data['resume_skills']['soft_skills']}")
        
        print("\nExtracted Skills (JD):")
        print(f"Technical: {data['jd_skills']['technical_skills']}")
        print(f"Soft: {data['jd_skills']['soft_skills']}")
        
        # Verify metadata storage
        session_folder = Path(f"backend/data/sessions/{data['session_id']}")
        metadata_path = session_folder / "metadata.json"
        
        if metadata_path.exists():
            print(f"\nMetadata file found at {metadata_path}")
            with open(metadata_path, "r") as f:
                metadata = json.load(f)
                if "resume_skills" in metadata and "jd_skills" in metadata:
                    print("PASSED: Skills found in metadata.json")
                else:
                    print("FAILED: Skills missing from metadata.json")
        else:
            print(f"FAILED: Metadata file not found at {metadata_path}")
            
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_skill_extraction()
