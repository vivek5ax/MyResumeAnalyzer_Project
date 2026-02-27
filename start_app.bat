@echo off
echo Starting Backend...
start cmd /k "cd backend && uvicorn main:app --reload"
echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"
echo Application started!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8000/docs
