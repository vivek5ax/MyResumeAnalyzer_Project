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