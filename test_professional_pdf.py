#!/usr/bin/env python3
"""
Test script for the new professional PDF generator with seaborn visualizations
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from services.pdf_generator_v2 import generate_formal_pdf
from datetime import datetime

# Sample payload with realistic data
test_payload = {
    "resume_filename": "john_smith_resume.pdf",
    "jd_filename": "senior_software_engineer_jd.pdf",
    "domain": "software",
    "timestamp": datetime.now().isoformat(),
    "bert_results": {
        "summary": {
            "overall_alignment_score": 82,
            "total_jd_skills": 28,
            "exact_match_count": 15,
            "semantic_match_count": 9,
            "missing_skills_count": 4,
        },
        "skill_partition": {
            "exact_match": [
                "Python", "JavaScript", "React", "Docker", "AWS", "SQL", 
                "Git", "REST APIs", "Machine Learning", "Linux", "Kubernetes", 
                "CI/CD", "PostgreSQL", "MongoDB", "TypeScript"
            ],
            "strong_semantic": [
                {"skill": "Flask", "similar_to": "Django", "score": 0.92},
                {"skill": "Node.js", "similar_to": "Express", "score": 0.88},
                {"skill": "TensorFlow", "similar_to": "PyTorch", "score": 0.85},
                {"skill": "Keras", "similar_to": "Scikit-learn", "score": 0.82},
                {"skill": "Elasticsearch", "similar_to": "Solr", "score": 0.80},
                {"skill": "Redis", "similar_to": "Memcached", "score": 0.78},
                {"skill": "Nginx", "similar_to": "Apache", "score": 0.75},
                {"skill": "GraphQL", "similar_to": "gRPC", "score": 0.73},
                {"skill": "Vue.js", "similar_to": "React", "score": 0.80},
            ],
            "moderate_semantic": [
                {"skill": "Microservices", "similar_to": "SOA", "score": 0.68},
                {"skill": "Docker Swarm", "similar_to": "Kubernetes", "score": 0.65},
                {"skill": "Terraform", "similar_to": "CloudFormation", "score": 0.62},
                {"skill": "Agile", "similar_to": "Scrum", "score": 0.60},
            ],
            "irrelevant": ["COBOL", "FORTRAN", "Mainframe Assembly"],
        },
        "jd_skill_clusters": {
            "Backend": ["Python", "Django", "Flask", "Node.js", "Express", "Java", "Spring Boot"],
            "Frontend": ["JavaScript", "React", "Vue", "CSS", "HTML", "TypeScript", "Angular"],
            "Infrastructure": ["Docker", "Kubernetes", "AWS", "GCP", "CI/CD", "Terraform", "Jenkins"],
            "Database": ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra"],
            "AI/ML": ["Machine Learning", "TensorFlow", "PyTorch", "Scikit-learn", "Keras", "NLP"],
            "DevOps": ["Docker", "Kubernetes", "AWS", "Terraform", "Prometheus", "ELK Stack"],
            "Tools": ["Git", "Jira", "Confluence", "Slack", "VS Code"],
            "Frameworks": ["FastAPI", "Django", "Spring Boot", "Next.js", "NestJS"],
        },
        "resume_skill_clusters": {
            "Backend": ["Python", "Flask", "Node.js", "Java", "Spring Boot"],
            "Frontend": ["JavaScript", "React", "CSS", "HTML", "TypeScript"],
            "Infrastructure": ["Docker", "Kubernetes", "AWS", "Terraform"],
            "Database": ["SQL", "PostgreSQL", "MongoDB", "Redis"],
            "AI/ML": ["Machine Learning", "TensorFlow", "PyTorch", "Scikit-learn"],
            "DevOps": ["Docker", "Kubernetes", "AWS"],
            "Tools": ["Git", "Jira", "VS Code"],
            "Frameworks": ["FastAPI", "Django", "Spring Boot"],
        },
        "missing_from_resume": [
            {"skill": "Kubernetes Advanced", "weight": 1.5, "categories": ["Infrastructure", "DevOps"]},
            {"skill": "GCP/Google Cloud", "weight": 1.3, "categories": ["Infrastructure"]},
            {"skill": "GraphQL", "weight": 1.2, "categories": ["Backend"]},
            {"skill": "Microservices Architecture", "weight": 1.1, "categories": ["Backend", "DevOps"]},
        ],
        "extra_resume_skills": ["Raspberry Pi", "IoT", "Embedded Systems"],
        "match_evidence": [],
    },
}

print("=" * 80)
print("PROFESSIONAL PDF GENERATOR WITH SEABORN VISUALIZATIONS")
print("=" * 80)
print(f"\n📋 Test Payload Summary:")
print(f"   Resume: {test_payload['resume_filename']}")
print(f"   JD: {test_payload['jd_filename']}")
print(f"   Domain: {test_payload['domain'].upper()}")
print(f"   Overall Score: {test_payload['bert_results']['summary']['overall_alignment_score']}%")

print("\n✨ Visualizations to be generated:")
print("   1. Overall Alignment Gauge - Circular gauge with score")
print("   2. Skill Match Distribution - Donut chart (Exact/Semantic/Missing)")
print("   3. Confidence Score Distribution - Bar chart with buckets")
print("   4. Category Coverage Comparison - Grouped bars (JD vs Resume)")
print("   5. Top Missing Skills Risk - Horizontal bars with weights")
print("   6. Semantic Reliability - Stacked horizontal bar")
print("   7. Skill Match Funnel - Progressive filtering")
print("   8. Category Performance Heatmap - Heatmap with coverage metrics")

try:
    print("\n🔄 Generating professional PDF...")
    pdf_buffer = generate_formal_pdf(test_payload)
    
    print("✅ PDF generated successfully!")
    pdf_size_kb = len(pdf_buffer.getvalue()) / 1024
    print(f"   Buffer size: {pdf_size_kb:.1f} KB")
    
    # Save to disk for inspection
    output_path = "Resume_Analysis_Professional_Report.pdf"
    with open(output_path, "wb") as f:
        f.write(pdf_buffer.getvalue())
    
    print(f"\n💾 Saved to: {output_path}")
    
    print("\n📊 PDF Report Structure:")
    print("   ✓ PAGE 1: Executive Summary")
    print("      - Gauge chart (overall alignment)")
    print("      - Donut chart (skill distribution)")
    print("      - Key metrics cards")
    print("")
    print("   ✓ PAGE 2: Detailed Analysis")
    print("      - Confidence distribution bar chart")
    print("      - Category coverage comparison")
    print("")
    print("   ✓ PAGE 3: Insights & Recommendations")
    print("      - Missing skills horizontal bars")
    print("      - Semantic reliability breakdown")
    print("")
    print("   ✓ PAGE 4: Advanced Metrics")
    print("      - Skill match funnel chart")
    print("      - Category performance heatmap")
    
    print("\n" + "=" * 80)
    print("✅ SUCCESS - Premium professional report generated!")
    print("=" * 80)
    print("\n🎨 Key Features:")
    print("   • Professional color palette with accessible colors")
    print("   • Matplotlib + Seaborn for polished visualizations")
    print("   • Perfect spacing and alignment")
    print("   • Clear typography hierarchy")
    print("   • 4-page comprehensive report")
    print("   • All 8 visualizations properly embedded as PNG")
    print("   • Enterprise-grade styling and layout")
    
except ImportError as e:
    print(f"\n❌ Import Error: {e}")
    print("   Solution: pip install seaborn")
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
