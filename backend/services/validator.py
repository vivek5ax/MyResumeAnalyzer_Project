import struct
from fastapi import UploadFile, HTTPException

# Magic numbers for file types
PDF_SIGNATURE = b'%PDF'
DOCX_SIGNATURE = b'PK\x03\x04'

async def validate_file(file: UploadFile):
    """
    Validates the uploaded file based on magic numbers and file size.
    """
    # 1. Check file size (Max 5MB)
    MAX_SIZE = 5 * 1024 * 1024
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_SIZE:
        raise HTTPException(status_code=400, detail=f"File size exceeds 5MB limit. Your file is {file_size / (1024 * 1024):.2f}MB.")
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    # 2. Check Magic Numbers
    header = file.file.read(4)
    file.file.seek(0)
    
    filename = file.filename.lower()
    
    if filename.endswith('.pdf'):
        if not header.startswith(PDF_SIGNATURE):
             raise HTTPException(status_code=400, detail="Invalid PDF file. Magic number check failed.")
    elif filename.endswith('.docx'):
        if not header.startswith(DOCX_SIGNATURE):
             raise HTTPException(status_code=400, detail="Invalid DOCX file. Magic number check failed.")
    elif filename.endswith('.txt'):
        # TXT files don't have a specific magic number, but we can check if it's readable as text
        try:
            content = file.file.read(1024)
            file.file.seek(0)
            content.decode('utf-8')
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="Invalid TXT file. Must be UTF-8 encoded.")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Only PDF, DOCX, and TXT are allowed.")

    return True
