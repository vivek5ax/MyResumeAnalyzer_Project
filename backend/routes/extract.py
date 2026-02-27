from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.validator import validate_file
from services.parser import parse_text
from services.preprocessor import clean_text, save_data
from services.analyzer import extract_skills
from services.bert_analyzer import analyze_semantic_matching

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

    # Clean text for extraction
    resume_clean = clean_text(resume_raw)
    jd_clean = clean_text(jd_raw)
    
    # 1. spaCy-based extraction (Keyword-like / NER) with Domain Awareness
    resume_skills = extract_skills(resume_clean, domain=domain)
    jd_skills = extract_skills(jd_clean, domain=domain)

    # 2. BERT-based semantic analysis with Domain Awareness
    bert_results = analyze_semantic_matching(jd_raw, resume_raw, domain=domain, threshold=0.50)

    # Save Data (Persistence)
    resume_name = resume.filename
    jd_name = job_description_file.filename if job_description_file else "Manual Input"
    
    # Pass bert_results to save_data (need to update save_data signature if needed)
    session_id = save_data(resume_raw, jd_raw, resume_name, jd_name, resume_skills, jd_skills, bert_results)
    
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
