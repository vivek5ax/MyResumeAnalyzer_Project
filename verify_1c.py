import requests
import os
from pathlib import Path

def test_extraction():
    url = "http://127.0.0.1:8000/extract"
    files = {
        'resume': ('test_resume.txt', 'This is a test resume content with!! special characters @@ and extra   spaces.'),
    }
    data = {
        'job_description_text': 'Looking for a Software Engineer with Python skills. Hiring now!!!'
    }
    
    print("Sending request to /extract...")
    try:
        response = requests.post(url, files=files, data=data)
        response.raise_for_status()
        result = response.json()
        
        session_id = result.get("session_id")
        print(f"Success! Session ID: {session_id}")
        
        # Verify directory creation
        session_path = Path("backend/data/sessions") / session_id
        if session_path.exists():
            print(f"Directory exists: {session_path}")
            
            # Check files
            files_to_check = ["resume_clean.txt", "jd_clean.txt", "metadata.json"]
            for f in files_to_check:
                if (session_path / f).exists():
                    print(f" - {f} found.")
                else:
                    print(f" - Error: {f} NOT found.")
        else:
            print(f"Error: Session directory {session_path} was NOT created.")
            
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_extraction()
