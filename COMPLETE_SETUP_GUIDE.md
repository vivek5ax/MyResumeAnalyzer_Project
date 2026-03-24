# Complete Project Setup & Integration Guide

**Resume Analyzer with Template-Based Chatbot**

---

## 📋 Project Overview

This guide provides a complete, step-by-step setup for the Resume Analyzer application with the new template-based chatbot system.

### What's Included

1. **Backend API** (`/api/chat/template`) - Structured response generation
2. **Frontend UI** - Template selection and response display
3. **Database Schema** - Session management
4. **Configuration** - Environment setup
5. **Deployment** - Production-ready setup

---

## 1️⃣ Backend Setup

### 1.1 Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Required packages (ensure in requirements.txt):**
- fastapi==0.104.1
- uvicorn==0.24.0
- python-dotenv==1.0.0
- pydantic==2.5.0
- sqlalchemy==2.0.23

### 1.2 Environment Configuration

**File:** `backend/.env`

```env
# Database
DATABASE_URL=sqlite:///./resume_analyzer.db
ECHO_SQL=false

# API
DEBUG=true
LOG_LEVEL=INFO
MAX_WORKERS=4

# LLM
OPENAI_API_KEY=your_key_here
MODEL=gpt-4
TEMPERATURE=0.7

# Session
SESSION_TIMEOUT_MINUTES=60
MAX_SESSIONS=1000

# API Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=3600
```

### 1.3 Database Setup

**File:** `backend/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, DateTime, JSON, Text, Integer
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./resume_analyzer.db")

engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("ECHO_SQL", "false").lower() == "true",
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ChatSession(Base):
    """Store chat session data for history and analytics"""
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    template_used = Column(String)
    user_question = Column(Text, nullable=True)
    response_json = Column(JSON)
    quality_score = Column(Integer)  # 0-100
    tokens_used = Column(Integer)
    processing_time_ms = Column(Integer)

class ChatMessage(Base):
    """Store individual messages in conversation"""
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True)
    session_id = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    role = Column(String)  # "user" or "assistant"
    content = Column(Text)
    message_type = Column(String)  # "template_response" or "custom_qa"

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 1.4 Add Chat Template Route

**File:** `backend/routes/chat.py`

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import time
import uuid
from database import ChatSession, get_db
from services.template_handler import TemplateHandler

router = APIRouter(prefix="/api/chat", tags=["chat"])

class TemplateRequest(BaseModel):
    session_id: str
    template: str  # matched_skills, missing_skills, projects, interview_tips, etc.
    user_question: Optional[str] = None
    resume_context: Dict[str, Any]

class TemplateResponse(BaseModel):
    session_id: str
    answer: Dict[str, Any]
    metadata: Dict[str, Any]

template_handler = TemplateHandler()

@router.post("/template", response_model=TemplateResponse)
async def handle_template_request(
    request: TemplateRequest,
    db: Session = Depends(get_db)
):
    """
    Handle template-based chat requests with structured responses
    """
    try:
        start_time = time.time()
        
        # Generate response using template
        response_data = template_handler.generate_response(
            template=request.template,
            user_question=request.user_question,
            resume_context=request.resume_context
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Store session
        session = ChatSession(
            id=request.session_id,
            template_used=request.template,
            user_question=request.user_question,
            response_json=response_data,
            quality_score=response_data['metadata']['validation']['quality_score'],
            tokens_used=response_data['metadata']['tokens_used'],
            processing_time_ms=processing_time
        )
        db.add(session)
        db.commit()
        
        return TemplateResponse(
            session_id=request.session_id,
            answer=response_data['answer'],
            metadata={
                **response_data['metadata'],
                'response_time_ms': processing_time
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 1.5 Update Main API

**File:** `backend/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZIPMiddleware
import os
from dotenv import load_dotenv
from routes.chat import router as chat_router
from routes.extract import router as extract_router

load_dotenv()

app = FastAPI(
    title="Resume Analyzer API",
    description="Analyze resumes with template-based chatbot",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compression
app.add_middleware(GZIPMiddleware, minimum_size=1000)

# Include routers
app.include_router(chat_router)
app.include_router(extract_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "chat": "active",
            "extract": "active"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "true").lower() == "true"
    )
```

---

## 2️⃣ Frontend Setup

### 2.1 Install Dependencies

```bash
cd frontend
npm install
npm install react-markdown axios
```

### 2.2 Frontend Configuration

**File:** `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=development
VITE_ENABLE_ANALYTICS=true
```

### 2.3 Vite Configuration

**File:** `frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})
```

### 2.4 Create React Components

Copy the component files from `FRONTEND_IMPLEMENTATION.md`:

```bash
# Create component files
touch frontend/src/components/ChatWithTemplates.jsx
touch frontend/src/components/QuestionGrid.jsx
touch frontend/src/components/ResponseDisplay.jsx
touch frontend/src/components/ResponseSection.jsx
touch frontend/src/components/CustomQuestionInput.jsx
touch frontend/src/components/ValidationBadge.jsx
touch frontend/src/components/LoadingSpinner.jsx
```

### 2.5 LoadingSpinner Component

**File:** `frontend/src/components/LoadingSpinner.jsx`

```jsx
import React from 'react';
import '../styles/loading-spinner.css';

export function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Generating personalized insights...</p>
    </div>
  );
}
```

**File:** `frontend/src/styles/loading-spinner.css`

```css
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner p {
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}
```

---

## 3️⃣ Running the Application

### Option A: Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access:** http://localhost:5173

### Option B: Using Batch Script

**File:** `run_dev.bat`

```batch
@echo off
echo Starting Resume Analyzer in development mode...

REM Start backend in new window
start "Backend - Resume Analyzer" cmd /k "cd backend && python main.py"

REM Start frontend in new window
start "Frontend - Resume Analyzer" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Backend: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo ========================================
echo.
pause
```

---

## 4️⃣ Production Build

### 4.1 Frontend Build

```bash
cd frontend
npm run build
```

Output: `frontend/dist/` - Ready for hosting on any static server.

### 4.2 Backend Production

```bash
cd backend
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

Or using Docker:

**Dockerfile:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 5️⃣ API Documentation

### Template Endpoint

**POST** `/api/chat/template`

**Request:**
```json
{
  "session_id": "session-1234567890",
  "template": "matched_skills",
  "user_question": null,
  "resume_context": {
    "summary": { ... },
    "key_findings": { ... },
    "skills_inventory": { ... },
    "candidate_profile": { ... },
    "decision_layers": { ... }
  }
}
```

**Response:**
```json
{
  "session_id": "session-1234567890",
  "answer": {
    "sections": [
      {
        "title": "Section Title",
        "content": "Markdown content...",
        "style": {
          "border_color": "#4caf50",
          "background_color": "#f1f8e9",
          "border_width": "4px"
        },
        "data": { ... }
      }
    ]
  },
  "metadata": {
    "model_used": "gpt-4",
    "tokens_used": 1250,
    "response_time_ms": 2840,
    "validation": {
      "structure_compliant": true,
      "quality_score": 0.92,
      "sections_found": 5
    }
  }
}
```

---

## 6️⃣ Testing

### Backend Tests

**File:** `backend/tests/test_chat.py`

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_template_request():
    payload = {
        "session_id": "test-session",
        "template": "matched_skills",
        "user_question": None,
        "resume_context": {
            "summary": {},
            "key_findings": {},
            "skills_inventory": {},
            "candidate_profile": {},
            "decision_layers": {}
        }
    }
    
    response = client.post("/api/chat/template", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "answer" in data
    assert "metadata" in data
    
def test_invalid_template():
    payload = {
        "session_id": "test-session",
        "template": "invalid_template",
        "user_question": None,
        "resume_context": {}
    }
    
    response = client.post("/api/chat/template", json=payload)
    assert response.status_code == 400
```

**Run tests:**
```bash
pytest backend/tests/ -v
```

---

## 7️⃣ Deployment Checklist

- [ ] Environment variables configured (`.env`)
- [ ] Database initialized and migrated
- [ ] Frontend built (`npm run build`)
- [ ] Backend dependencies installed
- [ ] API health check passing
- [ ] CORS configured properly
- [ ] Rate limiting configured
- [ ] Logging configured
- [ ] Error handling tested
- [ ] Load testing completed
- [ ] Security scan completed
- [ ] SSL certificates (production)

---

## 8️⃣ Troubleshooting

### Backend Issues

**Port Already in Use:**
```bash
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Database Lock Error:**
```bash
# Delete database and reinitialize
rm backend/resume_analyzer.db
python backend/main.py
```

### Frontend Issues

**Module Not Found:**
```bash
rm -rf frontend/node_modules
npm install
```

**Port Already in Use:**
```bash
# Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## 9️⃣ Performance Optimization

### Frontend
- Enable lazy loading for components
- Use React.memo for pure components
- Implement virtualization for long lists
- Optimize images and assets

### Backend
- Use connection pooling
- Implement caching for frequent queries
- Add database indexing
- Use async/await for I/O operations

### Example Cache Configuration

```python
from functools import lru_cache
from datetime import datetime, timedelta

class CachedTemplateHandler:
    def __init__(self, ttl_minutes=5):
        self.ttl = timedelta(minutes=ttl_minutes)
        self.cache = {}
    
    def get_template_response(self, template_id, resume_context):
        cache_key = f"{template_id}:{hash(str(resume_context))}"
        
        if cache_key in self.cache:
            cached_at, cached_response = self.cache[cache_key]
            if datetime.now() - cached_at < self.ttl:
                return cached_response
        
        response = self._generate_response(template_id, resume_context)
        self.cache[cache_key] = (datetime.now(), response)
        return response
```

---

## 🔟 Monitoring & Logging

### Backend Logging

```python
import logging
from logging.handlers import RotatingFileHandler

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# File handler
file_handler = RotatingFileHandler(
    'backend.log',
    maxBytes=10485760,
    backupCount=10
)
logger.addHandler(file_handler)
```

### Frontend Error Tracking

```javascript
// Add to App.jsx
window.addEventListener('error', (event) => {
  console.error('Frontend error:', event.error);
  // Send to error tracking service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Send to error tracking service
});
```

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/en/20/)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Last Updated:** March 19, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
