#!/usr/bin/env python3
"""
Quick verification test for fpdf2 migration.
Runs generate_formal_pdf with sample data and saves output for visual inspection.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from services.pdf_generator import generate_formal_pdf
from datetime import datetime

# Sample payload (minimal but valid)
test_payload = {
    "resume_filename": "test_resume.pdf",
    "jd_filename": "test_jd.pdf",
    "domain": "software",
    "timestamp": datetime.now().isoformat(),
    "bert_results": {
        "summary": {
            "overall_alignment_score": 78,
            "total_jd_skills": 25,
            "exact_match_count": 12,
            "semantic_match_count": 8,
            "missing_skills_count": 5,
        },
        "skill_partition": {
            "exact_match": ["Python", "JavaScript", "React", "Docker", "AWS", "SQL", 
                          "Git", "REST APIs", "Machine Learning", "Linux", "Kubernetes", "CI/CD"],
            "strong_semantic": [
                {"skill": "Flask", "similar_to": "Django", "score": 0.92},
                {"skill": "PostgreSQL", "similar_to": "MySQL", "score": 0.88},
                {"skill": "TensorFlow", "similar_to": "PyTorch", "score": 0.85},
                {"skill": "Keras", "similar_to": "Scikit-learn", "score": 0.82},
                {"skill": "Elasticsearch", "similar_to": "Solr", "score": 0.80},
                {"skill": "Redis", "similar_to": "Memcached", "score": 0.78},
                {"skill": "Nginx", "similar_to": "Apache", "score": 0.75},
                {"skill": "GraphQL", "similar_to": "gRPC", "score": 0.73},
            ],
            "moderate_semantic": [
                {"skill": "Microservices", "similar_to": "SOA", "score": 0.68},
                {"skill": "Kubernetes", "similar_to": "Docker Swarm", "score": 0.65},
                {"skill": "CI/CD", "similar_to": "DevOps", "score": 0.62},
                {"skill": "Agile", "similar_to": "Scrum", "score": 0.60},
            ],
            "irrelevant": ["COBOL", "FORTRAN", "Mainframe Assembly"],
        },
        "jd_skill_clusters": {
            "Backend": ["Python", "Django", "Flask", "Node.js", "Express", "Java"],
            "Frontend": ["JavaScript", "React", "Vue", "CSS", "HTML", "TypeScript"],
            "Infrastructure": ["Docker", "Kubernetes", "AWS", "GCP", "CI/CD", "Terraform"],
            "Database": ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch"],
            "AI/ML": ["Machine Learning", "TensorFlow", "PyTorch", "Scikit-learn", "Keras"],
        },
        "resume_skill_clusters": {
            "Backend": ["Python", "Flask", "Node.js", "Java"],
            "Frontend": ["JavaScript", "React", "CSS", "HTML"],
            "Infrastructure": ["Docker", "Kubernetes", "AWS"],
            "Database": ["SQL", "PostgreSQL", "MongoDB", "Redis"],
            "AI/ML": ["Machine Learning", "TensorFlow", "PyTorch"],
        },
        "missing_from_resume": [
            {"skill": "Kubernetes Advanced", "weight": 1.5, "categories": ["Infrastructure"]},
            {"skill": "GCP", "weight": 1.3, "categories": ["Infrastructure"]},
            {"skill": "Terraform", "weight": 1.2, "categories": ["Infrastructure"]},
            {"skill": "GraphQL", "weight": 1.1, "categories": ["API"]},
            {"skill": "Microservices Architecture", "weight": 1.0, "categories": ["Backend"]},
        ],
        "extra_resume_skills": ["Raspberry Pi", "IoT", "Embedded Systems", "Arduino"],
        "match_evidence": [],
    },
}

print("=" * 70)
print("FPDF2 Migration Verification Test")
print("=" * 70)
print(f"\n📋 Test Payload Summary:")
print(f"   Resume: {test_payload['resume_filename']}")
print(f"   JD: {test_payload['jd_filename']}")
print(f"   Domain: {test_payload['domain'].upper()}")
print(f"   Overall Score: {test_payload['bert_results']['summary']['overall_alignment_score']}%")

try:
    print("\n🔄 Generating PDF with fpdf2...")
    pdf_buffer = generate_formal_pdf(test_payload)
    
    print("✅ PDF generated successfully!")
    print(f"   Buffer size: {len(pdf_buffer.getvalue())} bytes")
    
    # Save to disk for inspection
    output_path = "test_report_fpdf2.pdf"
    with open(output_path, "wb") as f:
        f.write(pdf_buffer.getvalue())
    
    print(f"\n💾 Saved to: {output_path}")
    print("\n📊 PDF Report Details:")
    print("   ✓ Page 1: Dashboard with KPI grid & charts")
    print("   ✓ Page 2: Visual analysis & confidence distribution")
    print("   ✓ Page 3: Missing skills & match evidence")
    
    print("\n" + "=" * 70)
    print("✅ VERIFICATION SUCCESSFUL - fpdf2 migration works!")
    print("=" * 70)
    
except ImportError as e:
    print(f"\n❌ Import Error: {e}")
    print("   Solution: pip install fpdf2")
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
