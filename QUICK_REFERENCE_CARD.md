# Quick Reference Card

**Template-Based Chatbot System - Developer Quick Reference**

---

## 🚀 Quick Start

```bash
# Terminal 1: Backend
cd backend && python main.py
# Backend: http://localhost:8000

# Terminal 2: Frontend  
cd frontend && npm run dev
# Frontend: http://localhost:5173

# Terminal 3: Test API
curl -X POST http://localhost:8000/api/chat/template \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-123",
    "template": "matched_skills",
    "user_question": null,
    "resume_context": {}
  }'
```

---

## 📁 Key Files Location

**Backend:**
- Main app: `backend/main.py`
- Chat API: `backend/routes/chat.py` (CREATE NEW)
- Templates: `backend/services/template_handler.py` (CREATE NEW)
- Database: `backend/database.py` (CREATE NEW)
- Config: `backend/.env` (CREATE NEW)

**Frontend:**
- Main: `frontend/src/App.jsx`
- Components: `frontend/src/components/` (CREATE 7 FILES)
- Styles: `frontend/src/styles/` (CREATE 7 CSS FILES)
- Config: `frontend/.env` (CREATE NEW)

---

## 🔌 API Endpoint

**URL:** `POST /api/chat/template`

**Request:**
```json
{
  "session_id": "string",
  "template": "matched_skills|missing_skills|projects|interview_tips|resume_improvements|general",
  "user_question": "string|null",
  "resume_context": {
    "summary": {},
    "key_findings": {},
    "skills_inventory": {},
    "candidate_profile": {},
    "decision_layers": {}
  }
}
```

**Response:**
```json
{
  "session_id": "string",
  "answer": {
    "sections": [
      {
        "title": "string",
        "content": "markdown",
        "style": {
          "border_color": "#hex",
          "background_color": "#hex",
          "border_width": "4px"
        },
        "data": {}
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

## 🎨 Template Colors & Icons

| Template | Icon | Color | Hex |
|----------|------|-------|-----|
| Matched Skills | ✓ | Green | #4caf50 |
| Missing Skills | ? | Red | #f44336 |
| Projects | 📁 | Purple | #9c27b0 |
| Interview Tips | 💬 | Orange | #ff9800 |
| Resume Optimization | 📄 | Blue | #2196f3 |
| General Q&A | 💡 | Gray | #757575 |

---

## 📝 Component Structure

### Backend (Python/FastAPI)

**Template Handler:**
```python
class TemplateHandler:
    def generate_response(self, template, user_question, resume_context):
        if template == "matched_skills":
            return self.matched_skills(resume_context)
        elif template == "missing_skills":
            return self.missing_skills(resume_context)
        # ... other templates
        
    def matched_skills(self, resume_context):
        return {
            'sections': [
                {
                    'title': '...',
                    'content': '# markdown...',
                    'style': {'border_color': '#4caf50', ...},
                    'data': {...}
                }
            ]
        }
```

### Frontend (React)

**Component Hierarchy:**
```
ChatWithTemplates (Main container)
├── QuestionGrid
│   ├── QuestionCard (×6)
├── ResponseDisplay
│   ├── ValidationBadge
│   ├── ResponseSection (×N)
│       ├── Data visualization
│       ├── Markdown content
├── CustomQuestionInput
├── LoadingSpinner
```

---

## 🛠️ Installation Commands

```bash
# Backend dependencies
pip install fastapi uvicorn sqlalchemy python-dotenv pydantic

# Frontend dependencies
npm install
npm install react-markdown axios

# Testing
pip install pytest pytest-cov
npm install --save-dev @testing-library/react
```

---

## 🧪 Testing Commands

```bash
# Backend unit tests
pytest backend/tests/test_chat.py -v

# Backend coverage
pytest --cov=backend backend/tests/

# Frontend tests
npm test

# API manual test
curl -X POST http://localhost:8000/api/chat/template \
  --header "Content-Type: application/json" \
  --data '@test_payload.json'
```

---

## 🚀 Build & Deploy

```bash
# Frontend production build
npm run build
# Output: frontend/dist/

# Backend production serving
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker

# Docker (optional)
docker build -t resume-analyzer:1.0 .
docker run -p 8000:8000 resume-analyzer:1.0
```

---

## 🔍 Debugging Tips

**Backend Issues:**
```python
# Enable SQL logging in .env
ECHO_SQL=true

# Check database
python -c "from database import SessionLocal; db = SessionLocal(); print(db.query(ChatSession).all())"

# Full error traceback
import traceback
try:
    # code
except Exception as e:
    traceback.print_exc()
```

**Frontend Issues:**
```javascript
// DevTools console
console.log('Request:', request);
console.log('Response:', response);
console.log('State:', { selectedTemplate, response, loading });

// Network tab
// Check: Status 200, Headers, Response body
```

---

## 📊 Response Example

```json
{
  "session_id": "session-1710820000",
  "answer": {
    "sections": [
      {
        "title": "Your Strongest Technical Skills",
        "content": "# Top 5 Skills\n\n1. **Python** - 8 years\n2. **React** - 5 years\n3. **SQL** - 7 years",
        "style": {
          "border_color": "#4caf50",
          "background_color": "#f1f8e9",
          "border_width": "4px"
        },
        "data": {
          "top_skills": ["Python", "React", "SQL"],
          "experience_years": 7.5
        }
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

## 🔐 Environment Variables

**Backend (.env):**
```
DATABASE_URL=sqlite:///./resume_analyzer.db
DEBUG=true
PORT=8000
OPENAI_API_KEY=your_key
MODEL=gpt-4
TEMPERATURE=0.7
```

**Frontend (.env):**
```
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=development
```

---

## 💻 Code Snippets

### API Call (Frontend)

```javascript
const response = await fetch('/api/chat/template', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: `session-${Date.now()}`,
    template: 'matched_skills',
    user_question: null,
    resume_context: resumeContext
  })
});

const data = await response.json();
setResponse(data);
```

### Response Handler (Backend)

```python
@router.post("/template")
async def handle_template_request(request: TemplateRequest, db: Session):
    response_data = template_handler.generate_response(
        template=request.template,
        user_question=request.user_question,
        resume_context=request.resume_context
    )
    
    session = ChatSession(
        id=request.session_id,
        template_used=request.template,
        response_json=response_data
    )
    db.add(session)
    db.commit()
    
    return TemplateResponse(
        session_id=request.session_id,
        answer=response_data['answer'],
        metadata=response_data['metadata']
    )
```

---

## 📋 Pre-Launch Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] API responding < 3 seconds
- [ ] Frontend loads < 2 seconds
- [ ] Database persisting correctly
- [ ] CORS configured
- [ ] All 6 templates working
- [ ] Custom Q&A working
- [ ] Validation badge showing
- [ ] Responsive on mobile
- [ ] Error handling working
- [ ] Logging configured

---

## 🆘 Emergency Fixes

**API not responding?**
```bash
# Check backend running
curl http://localhost:8000/api/health

# Restart
pkill -f "python main.py"
cd backend && python main.py
```

**Frontend stuck loading?**
```bash
# Check frontend running
open http://localhost:5173

# Clear cache & restart
Ctrl+Shift+Delete  # Clear browser cache
npm run dev
```

**Database locked?**
```bash
# Remove & recreate
rm backend/resume_analyzer.db
python -c "from database import Base, engine; Base.metadata.create_all(engine)"
```

---

## 📞 Useful Commands

```bash
# View logs in real-time
tail -f backend.log

# Monitor port usage
netstat -tlnp | grep LISTEN

# Kill hanging process
pkill -f uvicorn

# Check Python version
python --version

# Check Node version
node --version

# Install specific package version
pip install fastapi==0.104.1
npm install react@18.2.0
```

---

## 🎓 File References

**Template Details:** TEMPLATE_SYSTEM_DESIGN.md  
**API Contract:** API_SPECIFICATION.md  
**Component Code:** FRONTEND_IMPLEMENTATION.md  
**Full Setup:** COMPLETE_SETUP_GUIDE.md  
**Implementation Plan:** IMPLEMENTATION_ROADMAP.md  
**Project Overview:** PROJECT_SUMMARY.md  

---

## ✅ Daily Standup Template

```
Yesterday:
- Completed: [task]
- Blockers: [if any]

Today:
- Will complete: [task]
- Expected to unblock: [blocker]

Questions:
- [any clarifications needed]
```

---

**Quick Reference Version:** 1.0.0  
**Last Updated:** March 19, 2026  
**Keep this handy while developing! → Print or pin in IDE** 📌
