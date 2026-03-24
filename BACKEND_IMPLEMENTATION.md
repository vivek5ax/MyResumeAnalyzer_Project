# Backend Implementation Guide - Template Engine

**Status:** Implementation Ready  
**Language:** Python  
**Framework:** FastAPI  
**LLM:** Groq llama-3.1-8b-instant

---

## Architecture Overview

```
User Request
    ↓
[Template Auto-Detection]
    ↓
[Template Selection]
    ↓
[Prompt Generator] → Builds strict prompt
    ↓
[Groq LLM] → Sends structured prompt
    ↓
[Response Validator] → Validates structure
    ↓
[Styling Mapper] → Adds colors/styling
    ↓
[Response Builder] → Creates response JSON
    ↓
[Return to Frontend]
```

---

## Implementation Steps

### Step 1: Create Template Engine Class

**File:** `backend/services/template_engine.py`

```python
from typing import Dict, List, Any, Tuple
from enum import Enum
import re
from dataclasses import dataclass

class TemplateType(Enum):
    MATCHED_SKILLS = "matched_skills"
    MISSING_SKILLS = "missing_skills"
    PROJECTS = "projects"
    INTERVIEW_TIPS = "interview_tips"
    RESUME_IMPROVEMENTS = "resume_improvements"
    GENERAL = "general"

@dataclass
class TemplateSection:
    title: str
    content: str
    section_type: str  # "text", "bullets", "data-points", "table"
    style: Dict[str, str]
    data: Dict[str, Any] = None
    
    def to_dict(self):
        return {
            "title": self.title,
            "content": self.content,
            "type": self.section_type,
            "style": self.style,
            "data": self.data or {}
        }

class TemplateEngine:
    """Manages template-based response generation with strict structure."""
    
    # Color scheme per template
    TEMPLATE_COLORS = {
        "matched_skills": {
            "Direct Answer": {"bg": "#f0f4ff", "border": "#4a90e2"},
            "Skill Alignment Overview": {"bg": "#e8f5e9", "border": "#4caf50"},
            "7-Day Revision Plan": {"bg": "#fff3e0", "border": "#ff9800"},
            "Free Resources": {"bg": "#f3e5f5", "border": "#9c27b0"},
            "Resume Context": {"bg": "#e3f2fd", "border": "#2196f3"},
        },
        "missing_skills": {
            "Direct Answer": {"bg": "#f0f4ff", "border": "#4a90e2"},
            "Priority Analysis": {"bg": "#ffebee", "border": "#f44336"},
            "Learning Roadmap": {"bg": "#e8f5e9", "border": "#4caf50"},
            "Mini Projects": {"bg": "#fff3e0", "border": "#ff9800"},
            "Resume Context": {"bg": "#e3f2fd", "border": "#2196f3"},
        },
        "projects": {
            "Direct Answer": {"bg": "#f0f4ff", "border": "#4a90e2"},
            "STAR/PAR Method": {"bg": "#fff3e0", "border": "#ff9800"},
            "Your Projects Mapped": {"bg": "#f3e5f5", "border": "#9c27b0"},
            "Sample Pitches": {"bg": "#e0f2f1", "border": "#009688"},
            "Resume Context": {"bg": "#e3f2fd", "border": "#2196f3"},
        },
        "interview_tips": {
            "Direct Answer": {"bg": "#f0f4ff", "border": "#4a90e2"},
            "Strength Areas": {"bg": "#e8f5e9", "border": "#4caf50"},
            "Interview Talking Points": {"bg": "#fff3e0", "border": "#ff9800"},
            "Practice Routine": {"bg": "#f3e5f5", "border": "#9c27b0"},
            "Resume Context": {"bg": "#e3f2fd", "border": "#2196f3"},
        },
        "resume_improvements": {
            "Direct Answer": {"bg": "#f0f4ff", "border": "#4a90e2"},
            "Score Analysis": {"bg": "#ffebee", "border": "#f44336"},
            "ATS Fixes": {"bg": "#fff3e0", "border": "#ff9800"},
            "Before/After Examples": {"bg": "#e0f2f1", "border": "#009688"},
            "Resume Context": {"bg": "#e3f2fd", "border": "#2196f3"},
        }
    }
    
    # Expected sections per template
    TEMPLATE_SECTIONS = {
        "matched_skills": [
            "Direct Answer",
            "Skill Alignment Overview",
            "7-Day Revision Plan",
            "Free Resources",
            "Resume Context",
        ],
        "missing_skills": [
            "Direct Answer",
            "Priority Analysis",
            "Learning Roadmap",
            "Mini Projects",
            "Resume Context",
        ],
        "projects": [
            "Direct Answer",
            "STAR/PAR Method",
            "Your Projects Mapped",
            "Sample Pitches",
            "Resume Context",
        ],
        "interview_tips": [
            "Direct Answer",
            "Strength Areas",
            "Interview Talking Points",
            "Practice Routine",
            "Resume Context",
        ],
        "resume_improvements": [
            "Direct Answer",
            "Score Analysis",
            "ATS Fixes",
            "Before/After Examples",
            "Resume Context",
        ],
        "general": [
            "Direct Answer",
            "Practical Steps",
            "Related Resources",
        ]
    }
    
    def __init__(self):
        """Initialize template engine."""
        self.template_matchers = self._build_matchers()
    
    def _build_matchers(self) -> Dict[str, List]:
        """Build regex matchers for template auto-detection."""
        return {
            "matched_skills": [
                r"how.*prepare.*skill",
                r"revise.*skill",
                r"deepen.*skill",
                r"strengthen.*skill",
                r"matched.*skill",
                r"already.*possess",
                r"existing.*skill",
            ],
            "missing_skills": [
                r"missing.*skill",
                r"gap.*skill",
                r"learn.*skill",
                r"cover.*skill",
                r"improve.*skill",
                r"what.*missing",
                r"not.*have",
                r"need.*learn",
            ],
            "projects": [
                r"showcase.*project",
                r"present.*project",
                r"project.*interview",
                r"project.*resume",
                r"portfolio",
                r"how.*talk.*project",
            ],
            "interview_tips": [
                r"interview",
                r"confident.*interview",
                r"prepare.*interview",
                r"tell.*resume",
                r"confidence",
                r"nervous",
            ],
            "resume_improvements": [
                r"resume.*improve",
                r"ats.*score",
                r"keyword",
                r"resume.*format",
                r"improve.*resume",
                r"format.*resume",
            ]
        }
    
    def detect_template(self, question: str) -> str:
        """Auto-detect template from user question."""
        question_lower = question.lower()
        
        for template, patterns in self.template_matchers.items():
            for pattern in patterns:
                if re.search(pattern, question_lower, re.IGNORECASE):
                    return template
        
        return "general"
    
    def generate_prompt(self, template: str, resume_context: Dict[str, Any]) -> str:
        """Generate strict prompt for template."""
        
        if template == "matched_skills":
            return self._prompt_matched_skills(resume_context)
        elif template == "missing_skills":
            return self._prompt_missing_skills(resume_context)
        elif template == "projects":
            return self._prompt_projects(resume_context)
        elif template == "interview_tips":
            return self._prompt_interview_tips(resume_context)
        elif template == "resume_improvements":
            return self._prompt_resume_improvements(resume_context)
        else:
            return ""
    
    def _prompt_matched_skills(self, context: Dict[str, Any]) -> str:
        """Prompt for matched skills template."""
        
        findings = context.get("key_findings", {})
        summary = context.get("summary", {})
        inventory = context.get("skills_inventory", {})
        
        matched = findings.get("exact_matches", [])[:5]
        alignment = summary.get("overall_alignment_score", 0)
        
        return f"""You are an expert career coach providing MATCHED_SKILLS guidance.

## INPUT DATA:
Matched Skills: {', '.join(matched)}
Total Matched: {len(matched)}
Alignment Score: {alignment}%
Resume Context: Available from provided data

## OUTPUT STRUCTURE (STRICT - Follow exactly):

### Section 1: Direct Answer
Write 2-3 sentences answering: "How to quickly prepare the skills I already possess?"
- Practical and encouraging
- NO jargon
- NO resume context here

### Section 2: Skill Alignment Overview
Create 4 bullet points EXACTLY:
1. **Exact Matched Skills:** {len(matched)} core technical requirements
2. **Top 5 Skills:** {', '.join(matched)}
3. **Overall Alignment Score:** {alignment}%
4. **Key Strength Area:** [Identify one key area]

### Section 3: 7-Day Revision Plan
Format EXACTLY as:
- **Day 1-2:** [specific activity with platform name]
- **Day 3-4:** [specific activity with platform name]
- **Day 5-6:** [specific activity with platform name]
- **Day 7:** [review activity]

USE SPECIFIC PLATFORMS: LeetCode, Coursera, GitHub, etc.
REFERENCE ACTUAL SKILLS: {', '.join(matched)}

### Section 4: Free Resources
Format EXACTLY as:
- **[Skill Name]:** [Resource Title](URL)
- **[Skill Name]:** [Resource Title](URL)
...

REQUIREMENTS:
- 3-6 resources
- Use actual skill names from: {', '.join(matched)}
- Include valid URLs
- One resource per line

### Section 5: Resume Context
Provide 4-5 bullets:
- **Matched Skills Count:** [NUMBER] exact matches
- **Top Matched:** [Skill] (confidence), [Skill] (confidence)
- **Alignment Score:** {alignment}%
- **Strategy:** [How to leverage in interviews]
- **Focus Area:** [One deepening area]

## CRITICAL RULES (MUST FOLLOW):
✓ ALL 5 sections present
✓ NO fabricated data
✓ Use inputs values provided
✓ NO placeholder text
✓ Format exact as shown
✓ Markdown bold for headers

Return clean markdown ready for rendering."""

    def _prompt_missing_skills(self, context: Dict[str, Any]) -> str:
        """Prompt for missing skills template."""
        
        findings = context.get("key_findings", {})
        missing = findings.get("missing_skills", [])[:6]
        
        return f"""You are an expert career strategist providing MISSING_SKILLS learning guidance.

## INPUT DATA:
Missing Skills: {', '.join(missing)}
Total Missing: {len(missing)}

## OUTPUT STRUCTURE (STRICT - Follow exactly):

### Section 1: Direct Answer
2-3 sentences answering: "What skills am I missing? How to cover them?"
- Strategic perspective
- NO jargon
- Encouraging tone

### Section 2: Priority Analysis
Create EXACTLY as:
- **Missing Skills Count:** {len(missing)} areas
- **Priority 1 (High Impact):** [2 skills] - 2-3 weeks each
- **Priority 2 (Medium Impact):** [2 skills] - 3-4 weeks each  
- **Priority 3 (Building):** [2 skills] - 4-6 weeks each
- **Current Impact:** Estimated +[%] with Priority 1 skills

RANK BY JOB RELEVANCE. USE ACTUAL SKILLS FROM: {', '.join(missing)}

### Section 3: Learning Roadmap
Create three subsections:

#### Days 1-30: [Foundation Phase Name]
- Week 1: [Skill focus] - [specific action]
- Week 2: [Skill focus] - [specific action]
- Week 3-4: [Skill focus] - [complete action]

#### Days 31-60: [Design Phase Name]
- Week 5-6: [Skill focus] - [action]
- Week 7: [Skill focus] - [action]
- Week 8: [Skill focus] - [action]

#### Days 61-90: [Advanced Phase Name]
- Week 9-10: [Skill focus] - [action]
- Week 11: [Skill focus] - [action]
- Week 12: [Final integration project]

### Section 4: Mini Projects
Provide 2 projects:

1. **Project Name** ([Duration])
   - Learn: [Skill], [Skill], [Skill]
   - Tech Stack: [Tech], [Tech], [Tech]
   - Impact: [What this teaches]

2. **Project Name** ([Duration])
   - Learn: [Skill], [Skill]
   - Tech Stack: [Tech], [Tech], [Tech]
   - Impact: [What this teaches]

### Section 5: Resume Context
4-5 bullets:
- **Missing Skills Count:** {len(missing)} areas identified
- **Priority Ranking:** [Which to learn first based on role]
- **Learning Timeline:** [estimated total time]
- **Expected Impact:** [Alignment improvement estimate]
- **Start Recommendation:** [Priority 1 skill to start now]

## CRITICAL RULES:
✓ ALL 5 sections present
✓ REALISTIC time estimates (2-6 weeks)
✓ USE ACTUAL SKILLS from: {', '.join(missing)}
✓ SPECIFIC project ideas (not generic)
✓ WEEKLY breakdown (not just Days/Weeks)
✓ Markdown formatting exact

Return clean markdown ready for rendering."""

    def _prompt_projects(self, context: Dict[str, Any]) -> str:
        """Prompt for projects template."""
        
        profile = context.get("candidate_profile", {})
        projects = profile.get("projects", [])[:4]
        
        project_list = ", ".join([p.get("name", "Project") for p in projects if p])
        
        return f"""You are an expert project storytelling coach.

## INPUT DATA:
User's Projects: {project_list}
Total Projects: {len(projects)}

## OUTPUT STRUCTURE (STRICT):

### Section 1: Direct Answer
2-3 sentences answering: "How to showcase my projects?"

### Section 2: STAR/PAR Method
Explain S.T.A.R. format (Situation, Task, Action, Result) with brief examples.

### Section 3: Your Projects Mapped
For EACH project:
**[Project Name]**
- **Tech Stack:** [Tech1, Tech2]
- **Problem Solved:** [Description]
- **Solution:** [Your involvement]
- **Skills Demonstrated:** [Skill1, Skill2, Skill3]

USE ACTUAL PROJECT NAMES AND TECHNOLOGIES FROM USER DATA.

### Section 4: Sample Pitches
Provide 60-second pitch template:
"[Situation] → [Task I had] → [Action I took] → [Result/Impact]"

### Section 5: Resume Context
- **Total Projects:** {len(projects)}
- **Recommended to Highlight:** [Project name]
- **Key Skills to Emphasize:** [Skills from projects]
- **Interview Story:** [How to tell project story]

ALL 5 SECTIONS REQUIRED."""

    def _prompt_interview_tips(self, context: Dict[str, Any]) -> str:
        """Prompt for interview tips template."""
        
        inventory = context.get("skills_inventory", {})
        soft_skills = inventory.get("resume_soft", [])[:5]
        
        return f"""You are an interview confidence coach.

## INPUT DATA:
Soft Skills Detected: {', '.join(soft_skills)}

## OUTPUT STRUCTURE (STRICT):

### Section 1: Direct Answer
2-3 sentences on building interview confidence.

### Section 2: Strength Areas
List 3-5 soft skills to emphasize:
- **[Skill]:** [How to demonstrate]

USE ACTUAL SKILLS FROM USER PROFILE.

### Section 3: Interview Talking Points
Provide 60-second and 2-minute versions:

**60-Second Version:**
[Situation] - [Action] - [Result]

**2-Minute Version:**
[Expanded version with more detail]

### Section 4: Practice Routine
5 confidence-building exercises:
1. [Exercise] - [expected benefit]
2. [Exercise] - [expected benefit]
...

### Section 5: Resume Context
- **Key Soft Skills:** [Skill] (strong), [Skill] (strong)
- **Projects to Discuss:** [Project name]
- **Interview Focus:** [What to emphasize]

ALL 5 SECTIONS REQUIRED."""

    def _prompt_resume_improvements(self, context: Dict[str, Any]) -> str:
        """Prompt for resume improvements template."""
        
        findings = context.get("key_findings", {})
        missing = findings.get("missing_skills", [])[:3]
        summary = context.get("summary", {})
        score = summary.get("overall_alignment_score", 0)
        
        return f"""You are an ATS optimization expert.

## INPUT DATA:
Alignment Score: {score}%
Missing Keywords: {', '.join(missing)}

## OUTPUT STRUCTURE (STRICT):

### Section 1: Direct Answer
2-3 sentences on resume optimization.

### Section 2: Score Analysis
- **Current Alignment:** {score}%
- **Missing Keywords:** {missing}
- **Priority Areas:** [Top 3 gaps]

### Section 3: ATS Fixes
5-7 specific improvements:
1. [Specific action] → [Impact]
2. [Specific action] → [Impact]
...

### Section 4: Before/After Examples
Show BEFORE and AFTER for 2-3 bullets:

**BEFORE:** [Current bullet]
**AFTER:** [Improved bullet with keywords]

### Section 5: Resume Context
- **Current Score:** {score}%
- **Key Missing Keywords:** {missing}
- **ATS Issues:** [Specific problems]
- **Expected Improvement:** [Estimated +%]

ALL 5 SECTIONS REQUIRED."""
    
    def parse_response(self, response_text: str, template: str) -> List[TemplateSection]:
        """Parse LLM response into structured sections."""
        
        expected_sections = self.TEMPLATE_SECTIONS.get(template, [])
        colors = self.TEMPLATE_COLORS.get(template, {})
        
        sections = []
        
        # Extract sections using regex
        pattern = r"^###?\s+(.+?)$"
        lines = response_text.split("\n")
        
        current_section = None
        current_content = []
        
        for line in lines:
            match = re.match(pattern, line, re.MULTILINE)
            
            if match:
                # Save previous section
                if current_section:
                    sections.append(TemplateSection(
                        title=current_section,
                        content="\n".join(current_content).strip(),
                        section_type="text",
                        style=self._get_section_style(current_section, colors)
                    ))
                
                # Start new section
                current_section = match.group(1).strip()
                current_content = []
            else:
                current_content.append(line)
        
        # Add last section
        if current_section:
            sections.append(TemplateSection(
                title=current_section,
                content="\n".join(current_content).strip(),
                section_type="text",
                style=self._get_section_style(current_section, colors)
            ))
        
        return sections
    
    def _get_section_style(self, section_title: str, colors: Dict) -> Dict[str, str]:
        """Get style for section."""
        
        if section_title in colors:
            color_info = colors[section_title]
            return {
                "background_color": color_info.get("bg", "#f5f5f5"),
                "border_color": color_info.get("border", "#999"),
                "text_color": "#000",
                "border_width": "2px"
            }
        
        # Fallback
        return {
            "background_color": "#f5f5f5",
            "border_color": "#999",
            "text_color": "#000",
            "border_width": "2px"
        }
    
    def validate_response(self, sections: List[TemplateSection], template: str) -> Dict[str, Any]:
        """Validate response structure and completeness."""
        
        expected = self.TEMPLATE_SECTIONS.get(template, [])
        found = [s.title for s in sections]
        
        # Check structure
        is_valid = len(sections) >= len(expected) - 1  # Allow 1 missing
        quality_score = self._calculate_quality_score(sections, expected, found)
        
        return {
            "is_valid": is_valid,
            "quality_score": quality_score,
            "sections_found": len(sections),
            "expected_sections": expected,
            "found_sections": found,
            "missing_sections": [s for s in expected if s not in found],
            "structure_compliant": len(found) >= len(expected)
        }
    
    def _calculate_quality_score(self, sections: List, expected: List, found: List) -> float:
        """Calculate quality score 0-1."""
        
        # Base score: 0.5
        score = 0.5
        
        # +0.1 per expected section found (max 0.5)
        found_count = sum(1 for s in expected if s in found)
        score += (found_count / len(expected)) * 0.5
        
        # +0.2 for having actual content
        has_content = all(
            len(s.content.strip()) > 10 for s in sections if s.content
        )
        if has_content:
            score += 0.2
        
        # Cap at 1.0
        score = min(1.0, score)
        
        # Reduce for missing sections
        missing = len(expected) - found_count
        score -= (missing * 0.05)
        
        return max(0.0, min(1.0, score))


# Usage example:
# engine = TemplateEngine()
# template = engine.detect_template("How to prepare my skills?")
# prompt = engine.generate_prompt(template, resume_context)
# response = groq_api.chat(prompt)  # Get LLM response
# sections = engine.parse_response(response, template)
# validation = engine.validate_response(sections, template)
```

---

### Step 2: Update Chat Route

**File:** `backend/routes/chat.py` (new endpoint)

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.services.template_engine import TemplateEngine
from backend.services.chatbot_groq import ask_contextual_chat

router = APIRouter()
template_engine = TemplateEngine()

class TemplateRequest(BaseModel):
    session_id: str
    template: Optional[str] = None  # Can be auto-detected
    user_question: Optional[str] = None  # For general template
    resume_context: Dict[str, Any]

class TemplateResponse(BaseModel):
    status: str
    template_used: str
    answer: Dict[str, Any]
    metadata: Dict[str, Any]

@router.post("/api/chat/template", response_model=TemplateResponse)
async def chat_template(request: TemplateRequest):
    """
    Template-based chatbot response with strict structure.
    
    Templates:
    - matched_skills
    - missing_skills
    - projects
    - interview_tips
    - resume_improvements
    - general (free-form Q&A)
    """
    
    try:
        # Detect/validate template
        template = request.template or "general"
        
        if not request.user_question and template == "general":
            raise HTTPException(status_code=400, detail="user_question required for general template")
        
        # If no template provided, auto-detect from question
        if not request.template and request.user_question:
            template = template_engine.detect_template(request.user_question)
        
        # Generate strict prompt
        prompt = template_engine.generate_prompt(template, request.resume_context)
        
        # Get LLM response
        llm_response = ask_contextual_chat(
            question=request.user_question or f"[{template}]",
            context=request.resume_context,
            intent=template,
            mode="template"  # NEW mode
        )
        
        if llm_response.get("status") != "success":
            raise HTTPException(status_code=500, detail=llm_response.get("answer"))
        
        response_text = llm_response.get("answer", "")
        
        # Parse response into sections
        sections = template_engine.parse_response(response_text, template)
        
        # Validate structure
        validation = template_engine.validate_response(sections, template)
        
        # Build final response
        return TemplateResponse(
            status="success",
            template_used=template,
            answer={
                "text": response_text,
                "sections": [s.to_dict() for s in sections]
            },
            metadata={
                "response_time_ms": llm_response.get("response_time_ms", 0),
                "model_used": llm_response.get("model", "llama-3.1-8b-instant"),
                "validation": validation
            }
        )
    
    except Exception as e:
        return TemplateResponse(
            status="error",
            template_used=request.template or "unknown",
            answer={"text": f"Error: {str(e)}", "sections": []},
            metadata={"validation": {"is_valid": False}}
        )
```

---

### Step 3: Update Main App

**File:** `backend/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import extract, chat

app = FastAPI()

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(extract.router)
app.include_router(chat.router)

# NEW: Template-based chat endpoint
from backend.routes.chat import router as template_router
app.include_router(template_router)

@app.get("/")
def read_root():
    return {"message": "Resume Analyzer API"}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

---

### Step 4: Response Example

**API Call:**
```bash
curl -X POST http://localhost:8000/api/chat/template \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "sess-123",
    "template": "matched_skills",
    "resume_context": {...}
  }'
```

**Response:**
```json
{
  "status": "success",
  "template_used": "matched_skills",
  "answer": {
    "text": "## Direct Answer\n...",
    "sections": [
      {
        "title": "Direct Answer",
        "content": "Your matched skills provide...",
        "type": "text",
        "style": {
          "background_color": "#f0f4ff",
          "border_color": "#4a90e2",
          "text_color": "#000",
          "border_width": "2px"
        }
      },
      ... (4 more sections)
    ]
  },
  "metadata": {
    "response_time_ms": 1450,
    "model_used": "llama-3.1-8b-instant",
    "validation": {
      "is_valid": true,
      "quality_score": 0.94,
      "sections_found": 5,
      "structure_compliant": true
    }
  }
}
```

---

## Summary

This implementation provides:

✅ **Template Engine** - Strict prompt generation  
✅ **Auto-Detection** - Matches questions to templates  
✅ **Response Parsing** - Extracts structured sections  
✅ **Validation** - Quality scoring  
✅ **Styling** - Colors per template  
✅ **API Endpoint** - `/api/chat/template`

**Next:** Implement frontend to consume this API response

---

**Prepared:** March 19, 2026  
**Status:** Ready for Implementation
