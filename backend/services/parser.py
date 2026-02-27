import pdfplumber
import docx2txt
from fastapi import UploadFile, HTTPException
from io import BytesIO


#PDF TEXT EXTRACTION (pdfplumber)
async def extract_text_from_pdf(file: UploadFile) -> str:
    try:
        content = await file.read()

        text = ""

        with pdfplumber.open(BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        return text.strip()

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error parsing PDF file: {str(e)}"
        )


#DOCX TEXT EXTRACTION (docx2txt)
async def extract_text_from_docx(file: UploadFile) -> str:
    try:
        content = await file.read()

        text = docx2txt.process(BytesIO(content))

        return text.strip()

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error parsing DOCX file: {str(e)}"
        )


#TXT TEXT EXTRACTION
async def extract_text_from_txt(file: UploadFile) -> str:
    try:
        content = await file.read()
        return content.decode("utf-8").strip()

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error parsing TXT file: {str(e)}"
        )


#MAIN PARSER FUNCTION
async def parse_text(file: UploadFile) -> str:

    if not file.filename:
        raise HTTPException(status_code=400, detail="File must have a filename.")

    filename = file.filename.lower()

    await file.seek(0)

    if filename.endswith(".pdf"):
        return await extract_text_from_pdf(file)

    elif filename.endswith(".docx"):
        return await extract_text_from_docx(file)

    elif filename.endswith(".txt"):
        return await extract_text_from_txt(file)

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only PDF, DOCX, and TXT are allowed."
        )
