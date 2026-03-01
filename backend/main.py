from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import extract

app = FastAPI(title="Resume Analyzer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routes
app.include_router(extract.router)

@app.get("/")
def read_root():
    return {"message": "Resume Analyzer API is running"}

#uvicorn main:app --reload

#.\venv\Scripts\python.exe -c "import uvicorn; uvicorn.run('main:app', host='127.0.0.1', port=8000, reload=True)"