# Chatbot Architecture v2 - Template-Based Design
**Author:** GitHub Copilot  
**Date:** March 19, 2026  
**Status:** Architecture Planning  
**Approach:** Predefined Templates + Strict Responses + Proper Styling

---

## Executive Summary

**Problem with Current Approach:**
- Flexible context-aware responses are hard to validate
- Resume context integration is complex and error-prone
- Responses lack consistent structure
- Multiple attempts to get quality responses

**New Approach:**
- ✅ Predefined question templates (5 core questions)
- ✅ Strict response structures (3-5 fixed sections per template)
- ✅ Very tight prompts (enforce output contracts)
- ✅ Proper styling/coloring in responses
- ✅ Separate generalized Q&A handler
- ✅ 100% success rate with proper formatting

**Expected Outcomes:**
- Higher quality responses (struct validated)
- Faster response generation (templates optimize prompts)
- Better UX (consistent sections + styling)
- Easier frontend rendering (known structure)
- User satisfaction (covers 90% of use cases)

---

## Part 1: Predefined Question Templates

### Template 1: Matched Skills (Revision Routine)
**Template Name:** `matched_skills`  
**User Question:** "How to quickly prepare/revise the skills that I already possess?"

**Key Data Points to Extract:**
- Exact matched skills count
- Top 5 matched skills with confidence
- Overall alignment score
- Key strength area

**Response Sections (5):**
1. **Direct Answer** (2-3 sentences) - Direct response
2. **Skill Overview** (bulleted stats) - Skills count + top skills + alignment %
3. **7-Day Revision Plan** (daily actions) - Concrete daily activities
4. **Free Learning Resources** (links) - 3-6 resources per skill
5. **Resume Context** (evidence) - How these map to resume

---

### Template 2: Missing Skills (Learning Roadmap)
**Template Name:** `missing_skills`  
**User Question:** "What skills am I missing? How to cover them?"

**Key Data Points to Extract:**
- Total missing skills count
- Top 6 missing skills ranked by job relevance
- Learning time estimates (weeks)
- Expected alignment impact

**Response Sections (5):**
1. **Direct Answer** (2-3 sentences) - Strategic overview
2. **Priority Analysis** (ranked 1/2/3) - Skills by job relevance + time
3. **Learning Roadmap** (30/60/90 weeks) - Weekly breakdown
4. **Mini Projects** (hands-on) - 2 projects with tech stacks
5. **Resume Context** (evidence) - Missing skills from JD analysis

---

### Template 3: Projects Presentation
**Template Name:** `projects`  
**User Question:** "How to showcase my projects in resume and interviews?"

**Key Data Points to Extract:**
- List of actual projects (from resume)
- Technologies per project
- Soft skills demonstrated

**Response Sections (5):**
1. **Direct Answer** (2-3 sentences) - Framework intro
2. **STAR/PAR Method** (explained) - Storytelling structure
3. **Your Projects Mapped** (Skill mapping) - Actual projects + skills
4. **Sample 60-Second Pitches** (examples) - How to tell story
5. **Resume Context** (evidence) - Project evidence from resume

---

### Template 4: Interview Confidence
**Template Name:** `interview_tips`  
**User Question:** "How to feel confident in interviews about my resume?"

**Key Data Points to Extract:**
- Soft skills identified
- Key projects to discuss
- Technical strengths
- Weaknesses to address

**Response Sections (5):**
1. **Direct Answer** (2-3 sentences) - Confidence building intro
2. **Your Strength Areas** (bulleted) - Soft skills + projects to highlight
3. **Interview Talking Points** (60-sec/2-min) - Prepared answers
4. **Practice Routine** (drills) - 5 confidence-building exercises
5. **Resume Context** (evidence) - Skills to emphasize

---

### Template 5: Resume Improvement
**Template Name:** `resume_improvements`  
**User Question:** "How to improve my resume for better ATS score and impact?"

**Key Data Points to Extract:**
- Current alignment score
- Missing keywords from JD
- ATS issues
- Tool/format recommendations

**Response Sections (5):**
1. **Direct Answer** (2-3 sentences) - ATS optimization overview
2. **Current Score Analysis** (metrics) - Alignment % + missing keywords
3. **ATS Fixes** (actionable) - 5-7 specific improvements
4. **Before/After Examples** (bullets) - Resume text improvements
5. **Resume Context** (evidence) - Specific gaps to address

---

### Template 6: General Q&A (Free-Form)
**Template Name:** `general`  
**User Question:** Any job/resume/skill related question

**Key Data Points:**
- Question topic (auto-detect)
- Can use resume context if relevant
- No strict structure required

**Response Sections:**
1. **Direct Answer** - Clear, practical response
2. **Practical Steps** (optional) - Actionable guidance
3. **Related Resources** (optional) - Learning materials

---

## Part 2: Strict Response Structure

### General Response JSON Schema

```json
{
  "status": "success",
  "template_used": "matched_skills",
  "answer": {
    "text": "full markdown response with sections and styling",
    "sections": [
      {
        "title": "Direct Answer",
        "content": "2-3 sentences",
        "style": {
          "background_color": "#f0f4ff",
          "text_color": "#000",
          "border_color": "#4a90e2",
          "border_width": "2px"
        }
      },
      {
        "title": "Skill Alignment Overview",
        "content": "bulleted list with data",
        "style": {
          "background_color": "#e8f5e9",
          "text_color": "#000",
          "border_color": "#4caf50",
          "border_width": "2px"
        },
        "data_points": {
          "matched_count": 9,
          "top_skills": ["Java", "JavaScript", "Python"],
          "alignment_score": 44,
          "confidence_level": "Strong"
        }
      },
      {
        "title": "7-Day Revision Plan",
        "content": "daily breakdown",
        "style": {
          "background_color": "#fff3e0",
          "text_color": "#000",
          "border_color": "#ff9800",
          "border_width": "2px"
        },
        "days": [
          {"day": "1-2", "activity": "[specific action]"},
          {"day": "3-4", "activity": "[specific action]"}
        ]
      },
      {
        "title": "Free Resources",
        "content": "resource links",
        "style": {
          "background_color": "#f3e5f5",
          "text_color": "#000",
          "border_color": "#9c27b0",
          "border_width": "2px"
        },
        "resources": [
          {
            "skill": "Java",
            "title": "FreeCodeCamp Java Course",
            "url": "https://www.freecodecamp.org/learn/java/",
            "type": "video"
          }
        ]
      },
      {
        "title": "Resume Context",
        "content": "evidence mapping",
        "style": {
          "background_color": "#e3f2fd",
          "text_color": "#000",
          "border_color": "#2196f3",
          "border_width": "2px"
        },
        "evidence": [
          {"claim": "9 exact matches", "source": "resume_analysis"},
          {"claim": "Top skills: Java", "source": "skills_inventory"}
        ]
      }
    ]
  },
  "metadata": {
    "response_time_ms": 1234,
    "model_used": "llama-3.1-8b-instant",
    "validation": {
      "is_valid": true,
      "quality_score": 0.92,
      "sections_found": 5,
      "structure_compliant": true
    }
  }
}
```

---

## Part 3: Strict Prompt Engineering

### Matched Skills Prompt Template

```
You are an expert career coach. Your task is to provide a MATCHED_SKILLS revision plan.

## INPUT DATA:
{
  "matched_skills": [list of exact skill matches],
  "alignment_score": [percentage],
  "top_skills": [top 5 skills],
  "resume_context": [relevant resume data],
  "session_id": "[session identifier]"
}

## OUTPUT STRUCTURE (MANDATORY - Must follow exactly):

### Section 1: Direct Answer
Write 2-3 sentences directly answering: "How to quickly prepare the skills I already possess?"
- Keep it practical and encouraging
- Do NOT include technical jargon
- Do NOT reference resume context here

### Section 2: Skill Alignment Overview
Create a bulleted list with EXACTLY these 4 points:
1. **Exact Matched Skills:** [NUMBER] core technical requirements
2. **Top 5 Skills:** [Skill1], [Skill2], [Skill3], [Skill4], [Skill5]
3. **Overall Alignment Score:** [SCORE]%
4. **Key Strength Area:** [one area they excel in]

REQUIRED FORMAT:
- Use **bold** for section headers
- Use bullet points with proper markdown
- Include numbers/percentages from input data

### Section 3: 7-Day Revision Plan
Create a daily breakdown:
- **Day 1-2:** [specific activity using a matched skill]
- **Day 3-4:** [specific activity using a matched skill]
- **Day 5-6:** [specific activity using a matched skill]
- **Day 7:** [review/consolidation activity]

REQUIRED FORMAT:
- Use specific platform names (LeetCode, Coursera, etc.)
- Include exact skill names
- Make activities concrete and measurable

### Section 4: Free Resources
List 3-6 relevant resources in format:
- **[Skill Name]:** [Resource Title](URL)

REQUIRED FORMAT:
- Use exact skill names from matched skills list
- Include clickable markdown links
- One resource per skill

### Section 5: Resume Context
Map matched skills to resume evidence:
- **Matched Skills Count:** [NUMBER] exact matches detected
- **Top Matched:** [Skill1] ([confidence]), [Skill2] ([confidence])...
- **Alignment Score:** [SCORE]%
- **How to Leverage:** [Strategy for interviews/resume]
- **Recommended Focus:** [One deep-dive area]

REQUIRED FORMAT:
- Use data from resume_context input
- Be specific (not generic)
- Include confidence levels if available

## OUTPUT VALIDATION:
✓ All 5 sections present
✓ Each section has proper markdown formatting
✓ No section exceeds 6 bullet points
✓ All data is grounded in input_data
✓ No generic advice

## CRITICAL RULES:
- NEVER make up skills not in matched_skills list
- NEVER exceed stated alignment score
- NEVER reference user's name
- NEVER use placeholder text [like this]
- ALWAYS use actual data from input

Provide the response in clean markdown format ready for rendering.
```

---

## Part 4: Response Styling & Colors

### Color Scheme by Template

```javascript
const TEMPLATE_COLORS = {
  "matched_skills": {
    "Direct Answer": "#f0f4ff",        // Light blue
    "Skill Alignment Overview": "#e8f5e9",  // Light green
    "7-Day Revision Plan": "#fff3e0",  // Light orange
    "Free Resources": "#f3e5f5",       // Light purple
    "Resume Context": "#e3f2fd"        // Light blue
  },
  
  "missing_skills": {
    "Direct Answer": "#f0f4ff",
    "Priority Analysis": "#ffebee",    // Light red
    "Learning Roadmap": "#e8f5e9",     // Light green
    "Mini Projects": "#fff3e0",        // Light orange
    "Resume Context": "#e3f2fd"
  },
  
  "projects": {
    "Direct Answer": "#f0f4ff",
    "STAR/PAR Method": "#fff3e0",
    "Your Projects Mapped": "#f3e5f5",
    "Sample Pitches": "#e0f2f1",       // Light teal
    "Resume Context": "#e3f2fd"
  },
  
  "interview_tips": {
    "Direct Answer": "#f0f4ff",
    "Strength Areas": "#e8f5e9",
    "Interview Talking Points": "#fff3e0",
    "Practice Routine": "#f3e5f5",
    "Resume Context": "#e3f2fd"
  },
  
  "resume_improvements": {
    "Direct Answer": "#f0f4ff",
    "Score Analysis": "#ffebee",
    "ATS Fixes": "#fff3e0",
    "Before/After Examples": "#e0f2f1",
    "Resume Context": "#e3f2fd"
  },
  
  "general": {
    "Direct Answer": "#f5f5f5",        // Light gray
    "Practical Steps": "#f0f4ff",
    "Related Resources": "#e8f5e9"
  }
};
```

### Section Styling Rules

```css
.response-section {
  border-left: 4px solid [border_color];
  background-color: [background_color];
  padding: 16px;
  border-radius: 4px;
  margin: 12px 0;
  font-size: 14px;
  line-height: 1.6;
}

.section-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 12px;
  color: [border_color];
}

.section-content {
  color: #333;
}

.data-point {
  display: flex;
  align-items: center;
  margin: 8px 0;
}

.data-label {
  font-weight: 500;
  margin-right: 12px;
  min-width: 120px;
}

.data-value {
  color: [border_color];
  font-weight: 600;
}

.skill-badge {
  display: inline-block;
  background: [border_color];
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  margin: 4px 4px 4px 0;
}

.resource-link {
  color: [border_color];
  text-decoration: none;
  font-weight: 500;
}

.resource-link:hover {
  text-decoration: underline;
}
```

---

## Part 5: API Architecture

### New Endpoint Structure

```
POST /api/chat/template
Content-Type: application/json

Request:
{
  "session_id": "session-123",
  "template": "matched_skills",  // OR: missing_skills, projects, interview_tips, resume_improvements, general
  "resume_context": {
    "summary": {...},
    "key_findings": {...},
    "skills_inventory": {...},
    "candidate_profile": {...},
    "decision_layers": {...}
  },
  "user_question": "Optional custom question (for general template)",
  "user_preferences": {
    "include_styling": true,
    "include_data_points": true
  }
}

Response:
{
  "status": "success|failed",
  "template_used": "matched_skills",
  "answer": {
    "text": "markdown with styling info",
    "sections": [
      {
        "title": "Section Title",
        "content": "markdown content",
        "type": "text|bullets|table|data-points",
        "style": {
          "background_color": "#f0f4ff",
          "border_color": "#4a90e2",
          "text_color": "#000",
          "border_width": "2px"
        },
        "data": {}  // Optional: structured data for rendering
      }
    ]
  },
  "metadata": {
    "response_time_ms": 1234,
    "model_used": "llama-3.1-8b-instant",
    "validation": {
      "is_valid": true,
      "quality_score": 0.92,
      "sections_found": 5,
      "structure_compliant": true
    }
  }
}
```

### Alternative: Keep /api/chat/analyze but with strict templates

```
POST /api/chat/analyze
Content-Type: application/json

Request:
{
  "session_id": "session-123",
  "question": "How to quickly prepare the skills that I already possess?",
  "intent": "matched_skills",  // Auto-detect from question
  "mode": "template",  // NEW: "template" or "general"
  "resume_context": {...}
}

Response:
{
  "status": "success",
  "answer": {...},  // Structured as per template
  "validation": {...}
}
```

---

## Part 6: Predefined Questions Frontend

### Question Selection UI

```jsx
const PREDEFINED_QUESTIONS = [
  {
    id: "matched_skills",
    icon: "✓",
    title: "Matched Skills",
    subtitle: "How to prepare skills I already have",
    question: "How to quickly prepare the skills that I already possess?",
    color: "#4caf50"
  },
  {
    id: "missing_skills",
    icon: "?",
    title: "Missing Skills",
    subtitle: "Strategic plan to learn missing skills",
    question: "What skills am I missing? How to cover them?",
    color: "#f44336"
  },
  {
    id: "projects",
    icon: "📁",
    title: "Project Showcase",
    subtitle: "How to present projects effectively",
    question: "How to showcase my projects in resume and interviews?",
    color: "#9c27b0"
  },
  {
    id: "interview_tips",
    icon: "💬",
    title: "Interview Confidence",
    subtitle: "Feel confident about your resume",
    question: "How to feel confident in interviews about my resume?",
    color: "#ff9800"
  },
  {
    id: "resume_improvements",
    icon: "📄",
    title: "Resume Optimization",
    subtitle: "Improve ATS score and impact",
    question: "How to improve my resume for better ATS and impact?",
    color: "#2196f3"
  },
  {
    id: "general",
    icon: "💡",
    title: "Ask Anything",
    subtitle: "Custom question about jobs and skills",
    question: null,  // User provides custom question
    color: "#757575"
  }
];
```

### UI Component Layout

```jsx
<div className="questions-grid">
  {PREDEFINED_QUESTIONS.map((q) => (
    <QuestionCard
      key={q.id}
      title={q.title}
      subtitle={q.subtitle}
      icon={q.icon}
      color={q.color}
      onClick={() => {
        if (q.id === "general") {
          // Show input field for custom question
          showCustomQuestionInput();
        } else {
          // Send template request
          sendTemplateRequest(q.id);
        }
      }}
    />
  ))}
</div>

// For custom questions:
<div className="custom-question-input">
  <input
    type="text"
    placeholder="Ask any question about jobs, resume, or skills..."
    onSubmit={(text) => sendGeneralQuestion(text)}
  />
</div>
```

---

## Part 7: Template Matcher

For user free-form questions, auto-detect closest template:

```javascript
const TEMPLATE_MATCHERS = {
  "matched_skills": [
    /how.*prepare.*skill/i,
    /revise.*skill/i,
    /deepen.*skill/i,
    /strengthen.*skill/i,
    /matched.*skill/i,
    /already.*possess/i,
    /existing.*skill/i
  ],
  
  "missing_skills": [
    /missing.*skill/i,
    /gap.*skill/i,
    /learn.*skill/i,
    /cover.*skill/i,
    /improve.*skill/i,
    /what.*missing/i,
    /not.*have/i,
    /need.*learn/i
  ],
  
  "projects": [
    /showcase.*project/i,
    /present.*project/i,
    /project.*interview/i,
    /project.*resume/i,
    /portfolio/i,
    /how.*talk.*project/i
  ],
  
  "interview_tips": [
    /interview/i,
    /confident.*interview/i,
    /prepare.*interview/i,
    /tell.*resume/i,
    /confidence/i,
    /nervous/i
  ],
  
  "resume_improvements": [
    /resume.*improve/i,
    /ats.*score/i,
    /keyword/i,
    /resume.*format/i,
    /improve.*resume/i,
    /format.*resume/i
  ]
};

function detectTemplate(question) {
  for (const [template, patterns] of Object.entries(TEMPLATE_MATCHERS)) {
    for (const pattern of patterns) {
      if (pattern.test(question)) {
        return template;
      }
    }
  }
  return "general";
}
```

---

## Part 8: Implementation Roadmap

### Phase 1: Backend Templates (Week 1)
- [ ] Create template engine
- [ ] Implement 5 strict prompt generators
- [ ] Create response validator
- [ ] Add styling metadata to responses
- [ ] Test all templates with sample data

### Phase 2: API Enhancements (Week 1-2)
- [ ] Add `/api/chat/template` endpoint (or enhance `/api/chat/analyze`)
- [ ] Implement template auto-detection
- [ ] Add response validation logic
- [ ] Add styling/coloring to response JSON
- [ ] Test with curl/Postman

### Phase 3: Frontend Integration (Week 2)
- [ ] Create question selection grid UI
- [ ] Render sections with proper styling
- [ ] Implement custom question input
- [ ] Add response styling based on template
- [ ] Test all templates in browser

### Phase 4: Testing & Polish (Week 2-3)
- [ ] Test all 5 templates with real resume
- [ ] Validate response quality
- [ ] Adjust colors and styling
- [ ] Performance testing
- [ ] Bug fixes and refinement

---

## Part 9: Success Metrics

### Template Quality
- ✅ 100% structure compliance (all 5 sections)
- ✅ Quality score ≥ 0.90 (vs 0.70 before)
- ✅ Response time < 2 seconds
- ✅ 0 formatting errors

### User Experience
- ✅ Users immediately see relevant questions
- ✅ Responses are scannable (sections + colors)
- ✅ Each section has clear purpose
- ✅ Styling differentiates sections
- ✅ Data is easy to extract (structured format)

### Maintenance
- ✅ Easy to add new templates
- ✅ Prompts are self-documenting
- ✅ Validation is automated
- ✅ Frontend styling is reusable

---

## Part 10: Sample Response (Matched Skills)

### Backend Response JSON:
```json
{
  "status": "success",
  "template_used": "matched_skills",
  "answer": {
    "text": "## Direct Answer\nYour matched skills provide a strong foundation...\n\n## Skill Alignment Overview\n...",
    "sections": [
      {
        "title": "Direct Answer",
        "content": "Your matched skills provide a strong foundation. Here's how to deepen them...",
        "style": {
          "background_color": "#f0f4ff",
          "border_color": "#4a90e2",
          "text_color": "#000"
        }
      },
      {
        "title": "Skill Alignment Overview",
        "type": "data-points",
        "content": "Exact Matched Skills: 9 core technical requirements\nTop 5 Skills: Java, JavaScript, Python, Data Structures, Git\nOverall Alignment: 44%\nKey Strength: Full-stack development",
        "data": {
          "matched_count": 9,
          "top_skills": ["Java", "JavaScript", "Python", "Data Structures", "Git"],
          "alignment_score": 44,
          "strength_area": "Full-stack development"
        },
        "style": {
          "background_color": "#e8f5e9",
          "border_color": "#4caf50",
          "text_color": "#000"
        }
      },
      {
        "title": "7-Day Revision Plan",
        "type": "bullets",
        "content": "- Day 1-2: LeetCode medium problems...\n- Day 3-4: GitHub project...",
        "days": [
          {"range": "1-2", "activity": "LeetCode medium problems..."},
          {"range": "3-4", "activity": "GitHub project..."}
        ],
        "style": {
          "background_color": "#fff3e0",
          "border_color": "#ff9800",
          "text_color": "#000"
        }
      },
      {
        "title": "Free Resources",
        "type": "resources",
        "content": "- Java: [FreeCodeCamp Java Course](http://...)\n...",
        "resources": [
          {
            "skill": "Java",
            "title": "FreeCodeCamp Java Course",
            "url": "https://www.freecodecamp.org/learn/java/",
            "type": "video"
          }
        ],
        "style": {
          "background_color": "#f3e5f5",
          "border_color": "#9c27b0",
          "text_color": "#000"
        }
      },
      {
        "title": "Resume Context",
        "type": "evidence",
        "content": "Matched Skills Count: 9 exact matches...",
        "evidence": [
          {"claim": "9 exact matches", "source": "resume_analysis", "confidence": "high"},
          {"claim": "Top skill: Java", "source": "skills_inventory", "confidence": "high"}
        ],
        "style": {
          "background_color": "#e3f2fd",
          "border_color": "#2196f3",
          "text_color": "#000"
        }
      }
    ]
  },
  "metadata": {
    "response_time_ms": 1450,
    "model_used": "llama-3.1-8b-instant",
    "validation": {
      "is_valid": true,
      "quality_score": 0.94,
      "sections_found": 5,
      "structure_compliant": true,
      "issues": []
    }
  }
}
```

### Frontend Rendering:
```
[Card with light blue background]
┌─────────────────────────────────┐
│ ✓ Direct Answer                 │
│                                 │
│ Your matched skills provide a   │
│ strong foundation. Here's how   │
│ to deepen them...               │
└─────────────────────────────────┘

[Card with light green background]
┌─────────────────────────────────┐
│ Skill Alignment Overview         │
│                                 │
│ • Matched Skills: 9              │
│ • Top 5: Java, JavaScript, ... │
│ • Alignment Score: 44%          │
│ • Key Strength: Full-stack      │
└─────────────────────────────────┘

[Card with light orange background]
┌─────────────────────────────────┐
│ 7-Day Revision Plan             │
│                                 │
│ • Day 1-2: LeetCode medium ...  │
│ • Day 3-4: GitHub project...    │
│ • Day 5-6: Advanced Python...   │
│ • Day 7: Review & consolidate   │
└─────────────────────────────────┘

... (Resources and Resume Context sections)
```

---

## Comparison: Old vs New Approach

| Aspect | Old Approach | New Approach |
|--------|-------------|-------------|
| **Flexibility** | High (any question) | Medium (5 templates + general) |
| **Response Quality** | Variable (0.70 QS) | Consistent (0.90+ QS) |
| **Structure Compliance** | 60-80% | 100% |
| **User Satisfaction** | Moderate | High (predictable) |
| **Styling/Formatting** | None | Full (colors per section) |
| **Frontend Rendering** | Complex | Simple (known structure) |
| **Maintenance** | Hard | Easy (templates isolated) |
| **Scalability** | Limited | High (template-based) |

---

## Conclusion

This template-based architecture provides:

✅ **Higher Quality** - Strict prompts → consistent outputs  
✅ **Better UX** - Predefined questions → fast access  
✅ **Proper Styling** - Colors per template + sections  
✅ **Easier Rendering** - Frontend knows structure  
✅ **Better Satisfaction** - Covers 90% of use cases  
✅ **Scalable** - Easy to add new templates  

**Next Step:** Implement Phase 1 (Backend Templates)

---

**Document prepared:** March 19, 2026  
**Status:** Ready for Implementation  
**Estimated effort:** 2 weeks (5 days backend + 5 days frontend)
