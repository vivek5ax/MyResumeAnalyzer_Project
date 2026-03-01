import os
import zipfile
import io
import logging
from fastapi import UploadFile, HTTPException

logger = logging.getLogger(__name__)

# Magic numbers for file types
# Reading first few bytes from memory is sufficient
PDF_SIGNATURE = b'%PDF'
DOCX_SIGNATURE = b'PK\x03\x04'

# Configurable max size via env variable (default 5MB)
MAX_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", 5 * 1024 * 1024))

ALLOWED_MIME_TYPES = {
    ".pdf": ["application/pdf"],
    ".docx": [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
        "application/zip", 
        "application/octet-stream"
    ],
    ".txt": ["text/plain"]
}

async def validate_size(file_size: int):
    if file_size > MAX_SIZE:
        logger.error(f"Validation failed: File size {file_size} exceeds {MAX_SIZE}")
        raise HTTPException(status_code=400, detail=f"File size exceeds limit. Your file is {file_size / (1024 * 1024):.2f}MB.")
    if file_size == 0:
        logger.error("Validation failed: File is empty.")
        raise HTTPException(status_code=400, detail="File is empty.")

async def validate_mime_type(content_type: str, ext: str):
    if content_type and content_type not in ALLOWED_MIME_TYPES.get(ext, []):
        logger.warning(f"Validation failed: MIME type {content_type} not strictly allowed for {ext}")
        raise HTTPException(status_code=400, detail=f"Invalid MIME type for {ext} file.")

async def validate_pdf(content: bytes):
    if not content.startswith(PDF_SIGNATURE):
        logger.error("Validation failed: Invalid PDF magic number")
        raise HTTPException(status_code=400, detail="Invalid PDF file. Magic number check failed.")

async def validate_docx(content: bytes):
    if not content.startswith(DOCX_SIGNATURE):
        logger.error("Validation failed: Invalid DOCX magic number")
        raise HTTPException(status_code=400, detail="Invalid DOCX file. Magic number check failed.")
    
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            # Zip Bomb Protection
            uncompressed_size = sum(file.file_size for file in zf.infolist())
            if uncompressed_size > 50 * 1024 * 1024: # 50 MB max expanded
                logger.error("Validation failed: Potential zip bomb detected.")
                raise HTTPException(status_code=400, detail="File is too large when uncompressed (possible zip bomb).")
            
            if 'word/document.xml' not in zf.namelist():
                logger.error("Validation failed: Missing word/document.xml")
                raise HTTPException(status_code=400, detail="Invalid DOCX file. 'word/document.xml' not found in archive.")
    except zipfile.BadZipFile:
        logger.error("Validation failed: Bad zip file.")
        raise HTTPException(status_code=400, detail="Invalid or corrupted DOCX archive.")

async def validate_txt(content: bytes):
    # Read a chunk for detection handling
    chunk = content[:1024]
    try:
        chunk.decode('utf-8')
    except UnicodeDecodeError:
        logger.error("Validation failed: TXT file not valid UTF-8.")
        raise HTTPException(status_code=400, detail="Invalid TXT file. Must be UTF-8 encoded.")

async def validate_file(file: UploadFile):
    """
    Validates the uploaded file with robust security checks.
    """
    if not file.filename:
        logger.error("Validation failed: Missing filename.")
        raise HTTPException(status_code=400, detail="File must have a filename.")

    # Read entirely in-memory using async I/O
    content = await file.read()
    
    # Needs to be reset for further processing operations (e.g. parser)
    await file.seek(0)
    
    ext = os.path.splitext(file.filename.lower())[1]
    
    await validate_size(len(content))
    await validate_mime_type(file.content_type, ext)

    if ext == '.pdf':
        await validate_pdf(content)
    elif ext == '.docx':
        await validate_docx(content)
    elif ext == '.txt':
        await validate_txt(content)
    else:
        logger.error(f"Validation failed: Unsupported extension {ext}")
        raise HTTPException(status_code=400, detail="Unsupported file type. Only PDF, DOCX, and TXT are allowed.")

    return {
        "status": "success",
        "file_type": ext,
        "size": len(content)
    }
