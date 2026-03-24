#!/usr/bin/env python3
"""
Minimal test server to verify PDF generation endpoint is working
"""
import sys
import os

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
from typing import Dict, Any

# Import only the PDF generator
try:
    from services.pdf_generator_v3 import generate_formal_pdf
    print("✅ pdf_generator_v3 imported successfully")
except Exception as e:
    print(f"❌ Failed to import pdf_generator_v3: {e}")
    sys.exit(1)

app = FastAPI(title="Resume Analyzer API - Test")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Resume Analyzer API - Test Mode (V3 PDF Generator)"}

@app.post("/export-pdf")
async def export_pdf(payload: Dict[str, Any] = Body(...)):
    """Generate PDF using pdf_generator_v3"""
    try:
        print("📄 Generating PDF with V3...")
        pdf_buffer = generate_formal_pdf(payload)
        
        print("✅ PDF generated successfully")
        
        headers = {
            'Content-Disposition': 'attachment; filename="Resume_Analysis_Report.pdf"'
        }
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf", 
            headers=headers
        )
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}, 500

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "pdf_generator": "v3",
        "version": "test-mode"
    }

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting Resume Analyzer API - Test Server")
    print("📊 PDF Generator: V3 (Production)")
    print("🌐 Server: http://127.0.0.1:8001")
    
    uvicorn.run(app, host="127.0.0.1", port=8001)
