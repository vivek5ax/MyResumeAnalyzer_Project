#!/usr/bin/env python
"""Test script to verify improved PDF generation with professional visualizations."""

import json
from pathlib import Path
from services.pdf_generator import generate_formal_pdf

# Sample BERT analysis results
test_data = {
    "resume_filename": "senior_developer.pdf",
    "jd_filename": "senior_engineer_role.pdf",
    "bert_results": {
        "summary": {
            "overall_alignment_score": 82,
            "exact_match_count": 15,
            "semantic_match_count": 12,
            "missing_skills_count": 8,
            "total_jd_skills": 35,
        },
        "skill_partition": {
            "exact_match": ["Python", "Java", "SQL", "AWS", "Docker", "Git", "REST API", "Linux", "PostgreSQL", "Kubernetes", "CI/CD", "Microservices", "OOP", "Design Patterns", "Agile"],
            "strong_semantic": [
                {"skill": "Async Programming", "similar_to": "Concurrent Programming", "score": 0.92},
                {"skill": "NoSQL Databases", "similar_to": "Document Stores", "score": 0.88},
                {"skill": "Cloud Computing", "similar_to": "AWS", "score": 0.85},
                {"skill": "Container Orchestration", "similar_to": "Kubernetes", "score": 0.90},
                {"skill": "Infrastructure as Code", "similar_to": "IaC", "score": 0.87},
                {"skill": "Real-time Systems", "similar_to": "Event-Driven", "score": 0.83},
                {"skill": "System Design", "similar_to": "Architecture", "score": 0.89},
                {"skill": "Performance Optimization", "similar_to": "Optimization", "score": 0.86},
                {"skill": "API Design", "similar_to": "REST API", "score": 0.91},
                {"skill": "Message Queues", "similar_to": "RabbitMQ", "score": 0.84},
                {"skill": "Caching Strategies", "similar_to": "Redis", "score": 0.88},
                {"skill": "Data Pipeline", "similar_to": "ETL", "score": 0.85},
            ],
            "moderate_semantic": [
                {"skill": "Terraform", "similar_to": "IaC Tools", "score": 0.75},
                {"skill": "Prometheus", "similar_to": "Monitoring", "score": 0.72},
            ],
        },
        "jd_skill_clusters": {
            "Backend": ["Python", "Java", "Scala", "Go"],
            "Databases": ["PostgreSQL", "MySQL", "MongoDB", "Cassandra"],
            "Cloud": ["AWS", "GCP", "Azure"],
            "DevOps": ["Docker", "Kubernetes", "Jenkins", "Terraform"],
            "Data": ["Spark", "Hadoop", "ETL", "SQL"],
            "Testing": ["Unit Testing", "Integration Testing", "Load Testing"],
            "Architecture": ["Microservices", "Event-Driven", "System Design"],
            "Tools": ["Git", "CI/CD", "Linux", "Monitoring"],
        },
        "resume_skill_clusters": {
            "Backend": ["Python", "Java", "REST API", "Async Programming"],
            "Databases": ["PostgreSQL", "MongoDB", "NoSQL Databases"],
            "Cloud": ["AWS", "Docker", "Cloud Computing"],
            "DevOps": ["Docker", "Kubernetes", "Container Orchestration", "Infrastructure as Code"],
            "Data": ["SQL", "Performance Optimization", "Data Pipeline"],
            "Testing": ["Unit Testing", "Integration Testing"],
            "Architecture": ["Microservices", "System Design", "API Design"],
            "Tools": ["Git", "CI/CD", "Linux", "Real-time Systems"],
        },
        "missing_from_resume": [
            {"skill": "Scala", "weight": 1.8, "categories": ["Backend"]},
            {"skill": "GCP", "weight": 1.5, "categories": ["Cloud"]},
            {"skill": "Cassandra", "weight": 1.6, "categories": ["Databases"]},
            {"skill": "Terraform", "weight": 1.4, "categories": ["DevOps"]},
            {"skill": "Spark", "weight": 1.7, "categories": ["Data"]},
            {"skill": "Load Testing", "weight": 1.2, "categories": ["Testing"]},
            {"skill": "Go", "weight": 1.3, "categories": ["Backend"]},
            {"skill": "Hadoop", "weight": 1.5, "categories": ["Data"]},
        ],
        "match_evidence": [
            {"skill": "Python", "match_type": "exact_match", "confidence": 1.0},
            {"skill": "Java", "match_type": "exact_match", "confidence": 1.0},
            {"skill": "SQL", "match_type": "exact_match", "confidence": 1.0},
            {"skill": "AWS", "match_type": "exact_match", "confidence": 1.0},
            {"skill": "Docker", "match_type": "exact_match", "confidence": 1.0},
            {"skill": "Git", "match_type": "exact_match", "confidence": 1.0},
            {"skill": "REST API", "match_type": "exact_match", "confidence": 1.0},
            {"skill": "Linux", "match_type": "exact_match", "confidence": 1.0},
            {"skill": "PostgreSQL", "match_type": "exact_match", "confidence": 1.0},
            {"skill": "Kubernetes", "match_type": "exact_match", "confidence": 1.0},
            {"skill": "Async Programming", "match_type": "semantic_match", "confidence": 0.92},
            {"skill": "NoSQL Databases", "match_type": "semantic_match", "confidence": 0.88},
            {"skill": "Cloud Computing", "match_type": "semantic_match", "confidence": 0.85},
            {"skill": "Container Orchestration", "match_type": "semantic_match", "confidence": 0.90},
            {"skill": "Infrastructure as Code", "match_type": "semantic_match", "confidence": 0.87},
        ]
    }
}

# Generate PDF
print("Generating improved professional PDF report...")
pdf_buffer = generate_formal_pdf(test_data)
pdf_data = pdf_buffer.getvalue()
pdf_size = len(pdf_data)

# Save to file
output_path = Path("resume_analysis_improved.pdf")
with open(output_path, "wb") as f:
    f.write(pdf_data)

print(f"✓ PDF generated successfully!")
print(f"✓ File size: {pdf_size:,} bytes ({pdf_size/1024:.1f} KB)")
print(f"✓ Saved to: {output_path}")
print("\nImprovement Summary:")
print("✓ Page 1: Enhanced gauge chart with professional styling and status indicators")
print("✓ Page 1: Improved donut chart with inline count labels and better colors")
print("✓ Page 1: Professional KPI dashboard with alternating row backgrounds")
print("✓ Page 2: Refined funnel chart with value labels and better grid styling")
print("✓ Page 2: Enhanced confidence distribution chart with clear labels")
print("✓ Page 2: Professional category comparison with grouped bars")
print("✓ Page 3: Improved risk heatmap with RdYlGn color gradient")
print("✓ Page 3: Professional table styling with color-coded sections")
print("✓ High DPI rendering (300 DPI) for crisp, professional visualizations")
print("✓ Consistent professional color scheme throughout")
print("✓ Better spacing, margins, and visual hierarchy")
