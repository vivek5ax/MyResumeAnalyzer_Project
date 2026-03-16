from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Body
from fastapi.responses import StreamingResponse
from typing import Dict, Any
from services.validator import validate_file
from services.parser import parse_text
from services.preprocessor import generate_versions, save_data
from services.analyzer import extract_skills
from services.bert_analyzer import analyze_semantic_matching
from services.pdf_generator import generate_formal_pdf

router = APIRouter()

@router.post("/extract")
async def extract_content(
    resume: UploadFile = File(...),
    job_description_file: UploadFile = File(None),
    job_description_text: str = Form(None),
    domain: str = Form("software")
):
    # Match frontend validation logic
    await validate_file(resume)
    if not job_description_file and not job_description_text:
        raise HTTPException(status_code=400, detail="Please provide either a Job Description file or text.")
    if job_description_file:
        await validate_file(job_description_file)

    # Extract Raw Text
    resume_raw = await parse_text(resume)
    jd_raw = job_description_text
    if job_description_file:
        jd_raw = await parse_text(job_description_file)

    # Preprocessing: Generate Multiple Text Versions
    resume_versions = generate_versions(resume_raw)
    jd_versions = generate_versions(jd_raw)
    
    # 1. spaCy-based extraction (Keyword-like / NER) with Domain Awareness
    # SPA-CY NEEDS VERSION B (Light Clean)
    resume_skills = extract_skills(resume_versions["light_clean_text"], domain=domain)
    jd_skills = extract_skills(jd_versions["light_clean_text"], domain=domain)

    # 2. BERT-based semantic analysis with Domain Awareness
    jd_flat_skills = jd_skills.get("technical_skills", []) + jd_skills.get("soft_skills", [])
    resume_flat_skills = resume_skills.get("technical_skills", []) + resume_skills.get("soft_skills", [])

    bert_results = analyze_semantic_matching(
        jd_flat_skills, 
        resume_flat_skills,
        resume_versions["raw_text"], 
        domain=domain,
        threshold=0.50,
        jd_text=jd_versions["raw_text"]
    )

    # Save Data (Persistence)
    resume_name = resume.filename
    jd_name = job_description_file.filename if job_description_file else "Manual Input"
    
    # Pass version dictionaries to save_data
    session_id = save_data(resume_versions, jd_versions, resume_name, jd_name, resume_skills, jd_skills, bert_results)
    
    return {
        "status": "success",
        "session_id": session_id,
        "resume_text": resume_raw,
        "job_description_text": jd_raw,
        "resume_filename": resume_name,
        "jd_filename": jd_name,
        "resume_skills": resume_skills,
        "jd_skills": jd_skills,
        "bert_results": bert_results
    }

@router.post("/export-pdf")
async def export_pdf(payload: Dict[str, Any] = Body(...)):
    """
    Receives JSON data from the frontend and generates a native PDF using ReportLab & Matplotlib.
    Returns the PDF as a streaming response.
    """
    try:
        pdf_buffer = generate_formal_pdf(payload)
        
        headers = {
            'Content-Disposition': 'attachment; filename="Resume_Analysis_Report.pdf"'
        }
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf", 
            headers=headers
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
