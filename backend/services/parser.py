import io
import logging
import pdfplumber
import docx
from fastapi import UploadFile, HTTPException

logger = logging.getLogger(__name__)

# Attempt to load OCR libraries, but don't crash if missing/not configured
try:
    import pytesseract
    from pdf2image import convert_from_bytes
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    logger.warning("OCR libraries (pytesseract, pdf2image) not found. PDF OCR fallback will be disabled. "
                   "To enable, install pytesseract and pdf2image, and ensure Tesseract/Poppler binaries are installed.")

# PDF TEXT EXTRACTION
def extract_text_from_pdf(content: bytes) -> str:
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        text = text.strip()
        
        # OCR Fallback if pdfplumber extracts nothing
        if not text and OCR_AVAILABLE:
            logger.info("Standard PDF extraction yielded no text. Attempting OCR fallback...")
            try:
                images = convert_from_bytes(content)
                ocr_text = ""
                for image in images:
                    ocr_text += pytesseract.image_to_string(image) + "\n"
                
                text = ocr_text.strip()
            except Exception as ocr_e:
                logger.error(f"OCR fallback failed: {str(ocr_e)}")
        
        return text

    except Exception as e:
        logger.error(f"Error parsing PDF file: {str(e)}")
        raise HTTPException(status_code=400, detail="Error parsing PDF file.")

# DOCX TEXT EXTRACTION (python-docx)
def extract_text_from_docx(content: bytes) -> str:
    try:
        doc = docx.Document(io.BytesIO(content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()

    except Exception as e:
        logger.error(f"Error parsing DOCX file: {str(e)}")
        raise HTTPException(status_code=400, detail="Error parsing DOCX file.")


# TXT TEXT EXTRACTION
def extract_text_from_txt(content: bytes) -> str:
    try:
        return content.decode("utf-8").strip()
    except Exception as e:
        logger.error(f"Error parsing TXT file: {str(e)}")
        raise HTTPException(status_code=400, detail="Error parsing TXT file.")


# MAIN PARSER FUNCTION
async def parse_text(file: UploadFile) -> str:
    if not file.filename:
        logger.error("Parser received file with no filename.")
        raise HTTPException(status_code=400, detail="File must have a filename.")

    filename = file.filename.lower()
    
    # 1. Read content once managing file pointer
    content = await file.read()
    await file.seek(0)  # Reset pointer for any potential downstream usage

    # 2. Extract Text based on type
    text = ""
    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(content)
    elif filename.endswith(".docx"):
        text = extract_text_from_docx(content)
    elif filename.endswith(".txt"):
        text = extract_text_from_txt(content)
    else:
        logger.error(f"Unsupported file type parsed: {filename}")
        raise HTTPException(status_code=400, detail="Unsupported file type. Only PDF, DOCX, and TXT are allowed.")

    # 3. Critical Empty Text Check
    if not text.strip():
        logger.error(f"Extracted text is empty for file: {filename}")
        raise HTTPException(status_code=400, detail="No readable text found in the document.")

    return text
