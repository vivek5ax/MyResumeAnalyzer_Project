# Quick Testing Guide - Chatbot Improvements

**Purpose:** Verify matched_skills and missing_skills improvements are working correctly  
**Time Required:** 5-10 minutes  
**Prerequisites:** Backend running with the improvements

---

## Pre-Flight Checklist

### 1. Start Backend
```bash
cd d:\1_RESUME_ANALYSER_INFOSYS\Resume_Analyzer\backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### 2. Verify Backend is Ready
```bash
# In another terminal, test health check
curl http://127.0.0.1:8000/health
```

---

## Test Cases

### Test 1: Matched Skills with Proper Formatting

**Trigger Question:**
```
How to quickly prepare the skills that I already possess as revision, provide some plan
```

**Expected Response Structure:**
```
## Direct Answer
[2-4 sentences about revising matched skills]

## Skill Alignment Overview
- Exact Matched Skills: [NUMBER] core technical requirements
- Top Skills: [Skill1], [Skill2], [Skill3]...
- Overall Alignment Score: [%]
- Key Strength: [description]

## Quick Revision Plan (7 days)
- Day 1-2: [specific action with skill name]
- Day 3-4: [specific action with platform/project name]
...

## Free Resources
- [Skill Name]: [Resource Title](URL)
- [Skill Name]: [Resource Title](URL)
...

---

## Resume Context Reference
- **Matched Skills:** [exact names], ...
- **Alignment Score:** [%]
- **Leveraging Strategy:** [description]
...
```

**Quality Checks:**
- ✅ Bold text renders as **bold** not `**bold**`
- ✅ Links are clickable `[Text](URL)` not plain URLs  
- ✅ No backslash escapes visible
- ✅ All 5 sections present
- ✅ Skill names are specific (not generic)
- ✅ Day breakdown is daily/weekly specific

**Validate in Response JSON:**
```json
{
  "status": "success",
  "answer": "[full formatted response above]",
  "validation": {
    "is_valid": true,
    "quality_score": 0.85,
    "found_sections": ["Direct Answer", "Skill Alignment Overview", "Quick Revision Plan (7 days)", "Free Resources", "Resume Context Reference"]
  }
}
```

---

### Test 2: Missing Skills with Priority Ranking

**Trigger Question:**
```
How to cover the skills that I am missing
```

**Expected Response Structure:**
```
## Direct Answer
[2-4 sentences about closing skill gaps strategically]

## Priority Skills Analysis
- Missing Skills Count: [NUMBER]
- Priority 1 (High Impact): [Skill1], [Skill2] - [weeks] weeks per skill
- Priority 2 (Medium Impact): [Skill3], [Skill4] - [weeks] weeks per skill
- Priority 3 (Building): [Skill5], [Skill6] - [weeks] weeks per skill
- Current Alignment Impact: Estimated +[%] with Priority 1 skills

## 30/60/90 Day Roadmap
### Days 1-30: [Phase Name]
- Week 1: [Specific skill and action]
- Week 2: [Specific skill and action]
- Week 3-4: [Specific skill and action]

### Days 31-60: [Phase Name]
- Week 5-6: [Specific skill and action]
- Week 7: [Specific skill and action]
- Week 8: [Specific skill and action]

### Days 61-90: [Phase Name]
...

## Mini Project Plan
1. Build [project idea] with [tech stack]
   - Learn: [Skill1], [Skill2], [Skill3]
   - Time: [weeks] weeks
2. Deploy [project idea] with [approach]
   - Learn: [Skill1], [Skill2]
   - Time: [weeks] weeks

---

## Resume Context Reference
- **Missing Skills Count:** [NUMBER]
- **Priority 1:** [Skills] - [weeks] weeks, +[%] alignment
- **Priority 2:** [Skills] - [weeks] weeks, +[%] alignment
- **Priority 3:** [Skills] - [weeks] weeks, +[%] alignment
...
```

**Quality Checks:**
- ✅ Skills ranked by job relevance (Priority 1/2/3)
- ✅ Learning time estimates present (weeks)
- ✅ Weekly breakdown in roadmap
- ✅ Alignment score impact shown
- ✅ No escaped asterisks
- ✅ All 5 sections present
- ✅ Projects are realistic and concrete

**Validate in Response JSON:**
```json
{
  "status": "success",
  "answer": "[full formatted response above]",
  "validation": {
    "is_valid": true,
    "quality_score": 0.82,
    "found_sections": ["Direct Answer", "Priority Skills Analysis", "30/60/90 Day Roadmap", "Mini Project Plan", "Resume Context Reference"]
  }
}
```

---

## Markdown Rendering Checks

### Quick Visual Test

| Element | Should Show | NOT Show |
|---------|------------|----------|
| Bold Text | **bold text** | \*\*bold text\*\* |
| Links | [Link](https://...) | **[Link]** or \[Link\] |
| Bullets | - Item | • Item or * Item |
| Separator | --- alone on line | \-\-\- |

### Browser DevTools Check

If testing in browser:
1. Right-click response → Inspect Element
2. Look for:
   - ✅ `<strong>text</strong>` for bold
   - ✅ `<a href="...">text</a>` for links
   - ✅ `<ul><li>` for bullet lists
   - ❌ NO literal asterisks in HTML
   - ❌ NO backslash characters

---

## Validation Scoring

**Response Quality Score Interpretation:**

- **0.85-1.0:** Excellent
  - All sections present ✓
  - Proper formatting ✓
  - Specific and relevant content ✓
  - Evidence grounded ✓

- **0.70-0.84:** Good
  - Most sections present
  - Some formatting issues
  - Generally specific
  - Mostly grounded

- **0.50-0.69:** Fair
  - Missing a section
  - Formatting problems
  - Some generic content
  - Partial evidence

- **< 0.50:** Needs Review
  - Multiple sections missing
  - Significant formatting issues
  - Generic content
  - Minimal grounding

---

## Troubleshooting

### Issue: Response shows literal `**text**`

**Cause:** Markdown not being rendered  
**Solution:** Check if frontend sends `Accept: text/markdown` header

### Issue: Links show as `**[Link]**`

**Cause:** Old template still being used  
**Solution:** Ensure server restarted after code changes

### Issue: Sections misaligned

**Cause:** Missing separator or extra blank lines  
**Solution:** Check for `---` on own line between sections

### Issue: No quality_score in validation

**Cause:** Validation not enabled  
**Solution:** Verify `normalized_mode == "resume_context"`

---

## Load Testing (Optional)

To test multiple requests:

```bash
# Run 3 requests for matched_skills
for i in {1..3}; do
  echo "Test $i:"
  curl -X POST http://127.0.0.1:8000/api/chat/analyze \
    -H "Content-Type: application/json" \
    -d '{
      "session_id": "'$(uuidgen)'",
      "question": "How to quickly prepare the skills that I already possess?",
      "intent": "matched_skills"
    }'
  echo ""
  sleep 1
done
```

---

## Success Criteria

✅ **All Tests Pass If:**
1. Response has all required sections (no `Found: N sections` where N < expected)
2. Markdown renders correctly (no literal asterisks)
3. Links are clickable and formatted as `[Text](URL)`
4. Skill names are specific, not generic
5. Time estimates are realistic (2-6 weeks)
6. Validation quality_score is 0.7+
7. No errors in backend logs
8. Response completes within 5 seconds

---

## Quick Regression Tests

Run these to ensure nothing broke:

1. **General Intent (no resume context)**
   ```
   Question: What is Python?
   Intent: general
   Expected: Direct answer, no "Resume Context Reference" section
   ```

2. **Projects Intent**
   ```
   Question: How to showcase the skills I have while explaining my projects?
   Intent: projects
   Expected: Project Story Framework + actual project names
   ```

3. **Interview Tips Intent**
   ```
   Question: Give some proper interview tips to feel confident on my resume
   Intent: interview_tips
   Expected: Confidence Building Practice + 60-second pitch
   ```

---

## Report Results

**If Everything Works:**
✅ All improvements are live and functioning correctly  
✅ Backend ready for production  
✅ User-facing response quality significantly improved  

**If Issues Found:**
Document exact issue + question that triggered it  
Share response JSON (answer + validation object)  
Check backend logs for error traces  

---

**Note:** These improvements focus on response structure and formatting quality. The actual skill recommendations and learning paths come from the resume analysis context, which remains unchanged.
