# Frontend Implementation Guide - Template-Based UI

**Status:** Implementation Ready  
**Framework:** React (Vite)  
**Styling:** CSS with component-based styling

---

## Architecture Overview

```
[Predefined Questions Grid]
       ↓
[User Selects or Types Question]
       ↓
[Send Template Request to /api/chat/template]
       ↓
[Receive Structured Sections + Styling]
       ↓
[Render with Proper Colors and Layout]
       ↓
[Display with Interactive Features]
```

---

## Component Structure

### 1. Main Chat Component

**File:** `frontend/src/components/ChatWithTemplates.jsx`

```jsx
import React, { useState } from 'react';
import { QuestionGrid } from './QuestionGrid';
import { ResponseDisplay } from './ResponseDisplay';
import { CustomQuestionInput } from './CustomQuestionInput';
import { LoadingSpinner } from './LoadingSpinner';
import '../styles/chat-templates.css';

export function ChatWithTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resumeContext = {
    // This would come from the parent component or context
    summary: {},
    key_findings: {},
    skills_inventory: {},
    candidate_profile: {},
    decision_layers: {}
  };

  const PREDEFINED_TEMPLATES = [
    {
      id: 'matched_skills',
      icon: '✓',
      title: 'Matched Skills',
      subtitle: 'How to prepare the skills I already have',
      color: '#4caf50',
      description: 'Deep revision routine for your existing strengths'
    },
    {
      id: 'missing_skills',
      icon: '?',
      title: 'Missing Skills',
      subtitle: 'Strategic plan to learn missing skills',
      color: '#f44336',
      description: 'Priority-ranked learning roadmap with timelines'
    },
    {
      id: 'projects',
      icon: '📁',
      title: 'Project Showcase',
      subtitle: 'How to present my projects effectively',
      color: '#9c27b0',
      description: 'STAR method and storytelling framework'
    },
    {
      id: 'interview_tips',
      icon: '💬',
      title: 'Interview Confidence',
      subtitle: 'Feel confident in interviews',
      color: '#ff9800',
      description: 'Practice routines and talking points'
    },
    {
      id: 'resume_improvements',
      icon: '📄',
      title: 'Resume Optimization',
      subtitle: 'Improve ATS score and impact',
      color: '#2196f3',
      description: 'Keyword injection and formatting fixes'
    },
    {
      id: 'general',
      icon: '💡',
      title: 'Ask Anything',
      subtitle: 'Custom question about jobs and skills',
      color: '#757575',
      description: 'Free-form Q&A mode'
    }
  ];

  async function handleSelectTemplate(templateId) {
    if (templateId === 'general') {
      setSelectedTemplate(templateId);
      setCustomQuestion('');
      return;
    }

    setSelectedTemplate(templateId);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/chat/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: `session-${Date.now()}`,
          template: templateId,
          resume_context: resumeContext
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
      console.error('Template error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCustomQuestion(question) {
    setCustomQuestion(question);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/chat/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: `session-${Date.now()}`,
          template: 'general',  // Will be auto-detected if possible
          user_question: question,
          resume_context: resumeContext
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
      console.error('Custom question error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Render response if available
  if (response && !selectedTemplate?.includes('general')) {
    return (
      <div className="chat-container">
        <button 
          className="btn-back"
          onClick={() => {
            setResponse(null);
            setSelectedTemplate(null);
          }}
        >
          ← Back to Templates
        </button>
        
        <ResponseDisplay 
          response={response}
          templateId={selectedTemplate}
        />
        
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  // Show general Q&A input
  if (selectedTemplate === 'general') {
    return (
      <div className="chat-container">
        <button 
          className="btn-back"
          onClick={() => {
            setResponse(null);
            setSelectedTemplate(null);
          }}
        >
          ← Back to Templates
        </button>
        
        <CustomQuestionInput 
          onSubmit={handleCustomQuestion}
          loading={loading}
        />
        
        {loading && <LoadingSpinner />}
        {response && <ResponseDisplay response={response} />}
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="chat-container">
        <LoadingSpinner />
        <p>Generating your personalized response...</p>
      </div>
    );
  }

  // Show template grid
  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Resume Analyzer Chatbot</h2>
        <p>Select a template or ask any question about your resume:</p>
      </div>
      
      <QuestionGrid 
        templates={PREDEFINED_TEMPLATES}
        onSelectTemplate={handleSelectTemplate}
      />
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
```

---

### 2. Question Grid Component

**File:** `frontend/src/components/QuestionGrid.jsx`

```jsx
import React from 'react';
import '../styles/question-grid.css';

export function QuestionGrid({ templates, onSelectTemplate }) {
  return (
    <div className="question-grid">
      {templates.map(template => (
        <QuestionCard
          key={template.id}
          template={template}
          onClick={() => onSelectTemplate(template.id)}
        />
      ))}
    </div>
  );
}

function QuestionCard({ template, onClick }) {
  return (
    <div 
      className="question-card"
      style={{ borderLeftColor: template.color }}
      onClick={onClick}
    >
      <div className="card-icon" style={{ color: template.color }}>
        {template.icon}
      </div>
      
      <div className="card-content">
        <h3 className="card-title">{template.title}</h3>
        <p className="card-subtitle">{template.subtitle}</p>
        <p className="card-description">{template.description}</p>
      </div>
      
      <div className="card-arrow">→</div>
    </div>
  );
}
```

---

### 3. Response Display Component

**File:** `frontend/src/components/ResponseDisplay.jsx`

```jsx
import React from 'react';
import { ResponseSection } from './ResponseSection';
import { ValidationBadge } from './ValidationBadge';
import '../styles/response-display.css';

export function ResponseDisplay({ response, templateId }) {
  const { answer, metadata } = response;
  const { sections } = answer;
  const { validation } = metadata;

  if (!sections || sections.length === 0) {
    return (
      <div className="response-display empty">
        <p>No sections to display</p>
      </div>
    );
  }

  return (
    <div className="response-display">
      {/* Validation Badge */}
      {validation && (
        <ValidationBadge 
          qualityScore={validation.quality_score}
          isValid={validation.structure_compliant}
          sectionsFound={validation.sections_found}
        />
      )}

      {/* Response Sections */}
      <div className="sections-container">
        {sections.map((section, index) => (
          <ResponseSection
            key={index}
            section={section}
            index={index}
          />
        ))}
      </div>

      {/* Metadata Footer */}
      {metadata && (
        <div className="response-footer">
          <small>
            Generated by {metadata.model_used} in {metadata.response_time_ms}ms
          </small>
        </div>
      )}
    </div>
  );
}
```

---

### 4. Response Section Component

**File:** `frontend/src/components/ResponseSection.jsx`

```jsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import '../styles/response-section.css';

export function ResponseSection({ section, index }) {
  const [expanded, setExpanded] = useState(true);

  if (!section) return null;

  const { title, content, style, data } = section;
  const borderColor = style?.border_color || '#999';
  const backgroundColor = style?.background_color || '#f5f5f5';

  return (
    <div 
      className="response-section"
      style={{
        borderLeftColor: borderColor,
        backgroundColor: backgroundColor,
        borderLeftWidth: style?.border_width || '4px'
      }}
    >
      {/* Section Header */}
      <div 
        className="section-header"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="section-title" style={{ color: borderColor }}>
          {title}
        </h3>
        <span className="expand-icon">
          {expanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Section Content */}
      {expanded && (
        <div className="section-content">
          {/* Structured Data (if available) */}
          {data && Object.keys(data).length > 0 && (
            <div className="section-data">
              {renderStructuredData(data, borderColor)}
            </div>
          )}

          {/* Markdown Content */}
          {content && (
            <div className="section-markdown">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function renderStructuredData(data, borderColor) {
  return Object.entries(data).map(([key, value]) => {
    if (Array.isArray(value)) {
      return (
        <div key={key} className="data-point">
          <strong className="data-label" style={{ color: borderColor }}>
            {formatLabel(key)}:
          </strong>
          <span className="data-value">
            {value.map((v, i) => (
              <span 
                key={i}
                className="skill-badge"
                style={{ backgroundColor: borderColor }}
              >
                {v}
              </span>
            ))}
          </span>
        </div>
      );
    }

    return (
      <div key={key} className="data-point">
        <strong className="data-label" style={{ color: borderColor }}>
          {formatLabel(key)}:
        </strong>
        <span className="data-value">{String(value)}</span>
      </div>
    );
  });
}

function formatLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
```

---

### 5. Custom Question Input Component

**File:** `frontend/src/components/CustomQuestionInput.jsx`

```jsx
import React, { useState } from 'react';
import '../styles/custom-question.css';

export function CustomQuestionInput({ onSubmit, loading }) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmit(question);
      setQuestion('');
    }
  };

  return (
    <form className="custom-question-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="question-input"
        placeholder="Ask any question about jobs, resume, or skills..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={loading}
      />
      <button 
        type="submit"
        className="submit-btn"
        disabled={loading || !question.trim()}
      >
        {loading ? 'Thinking...' : 'Ask'}
      </button>
    </form>
  );
}
```

---

### 6. Validation Badge Component

**File:** `frontend/src/components/ValidationBadge.jsx`

```jsx
import React from 'react';
import '../styles/validation-badge.css';

export function ValidationBadge({ qualityScore, isValid, sectionsFound }) {
  const scorePercentage = Math.round(qualityScore * 100);
  const scoreColor = qualityScore >= 0.85 ? '#4caf50' : 
                     qualityScore >= 0.70 ? '#ff9800' : '#f44336';

  return (
    <div className="validation-badge">
      <div className="validation-info">
        <span className="validation-label">Quality Score:</span>
        <div 
          className="quality-score"
          style={{ color: scoreColor }}
        >
          {scorePercentage}%
        </div>
      </div>

      <div className="validation-status">
        {isValid ? (
          <span className="valid-check">✓ Structure Valid</span>
        ) : (
          <span className="invalid-check">⚠ Incomplete Structure</span>
        )}
      </div>

      <div className="validation-detail">
        <small>{sectionsFound} sections found</small>
      </div>
    </div>
  );
}
```

---

## Styling

### Main CSS File

**File:** `frontend/src/styles/chat-templates.css`

```css
.chat-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.chat-header {
  text-align: center;
  margin-bottom: 40px;
}

.chat-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.chat-header p {
  font-size: 16px;
  color: #666;
}

.btn-back {
  background: none;
  border: none;
  color: #2196f3;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 0;
  margin-bottom: 20px;
  transition: color 0.2s;
}

.btn-back:hover {
  color: #1976d2;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 12px 16px;
  border-radius: 4px;
  border-left: 4px solid #f44336;
  margin: 20px 0;
}
```

---

### Question Grid CSS

**File:** `frontend/src/styles/question-grid.css`

```css
.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.question-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #999;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.card-icon {
  font-size: 32px;
  line-height: 1;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.card-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
}

.card-description {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.card-arrow {
  color: #ccc;
  font-size: 20px;
  transition: color 0.2s;
}

.question-card:hover .card-arrow {
  color: #666;
}
```

---

### Response Display CSS

**File:** `frontend/src/styles/response-display.css`

```css
.response-display {
  background: white;
  border-radius: 8px;
  padding: 24px;
}

.response-display.empty {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.sections-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.validation-badge {
  background: linear-gradient(to right, #f5f5f5, #fff);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.validation-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.validation-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.quality-score {
  font-size: 20px;
  font-weight: 600;
}

.validation-status {
  flex: 1;
}

.valid-check {
  color: #4caf50;
  font-weight: 500;
  font-size: 14px;
}

.invalid-check {
  color: #ff9800;
  font-weight: 500;
  font-size: 14px;
}

.response-footer {
  text-align: center;
  color: #999;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  margin-top: 20px;
}
```

---

### Response Section CSS

**File:** `frontend/src/styles/response-section.css`

```css
.response-section {
  border-radius: 6px;
  border-left: 4px solid;
  padding: 20px;
  background-color: #f5f5f5;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.expand-icon {
  font-size: 12px;
  color: #999;
  transition: transform 0.2s;
}

.section-header:hover .expand-icon {
  color: #666;
}

.section-content {
  margin-top: 16px;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 100vh;
  }
}

.section-data {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.data-point {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.data-label {
  min-width: 140px;
  font-size: 14px;
}

.data-value {
  font-size: 14px;
  color: #666;
}

.skill-badge {
  display: inline-block;
  background: #2196f3;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  margin-right: 6px;
  margin-bottom: 4px;
}

.section-markdown {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.section-markdown ul,
.section-markdown ol {
  margin: 12px 0;
  padding-left: 24px;
}

.section-markdown li {
  margin: 6px 0;
}

.section-markdown strong {
  color: #000;
}

.section-markdown a {
  color: #2196f3;
  text-decoration: none;
}

.section-markdown a:hover {
  text-decoration: underline;
}
```

---

## Integration

### Update App.jsx

```jsx
import { ChatWithTemplates } from './components/ChatWithTemplates';

function App() {
  return (
    <div className="app">
      <ChatWithTemplates />
    </div>
  );
}

export default App;
```

---

## Testing Checklist

- [ ] Question grid displays all 6 templates
- [ ] Clicking template sends correct API request
- [ ] Loading spinner shows while waiting
- [ ] Response sections render properly
- [ ] Colors match template configuration
- [ ] Validation badge shows correctly
- [ ] Markdown renders in sections
- [ ] Links are clickable
- [ ] "Back" button works
- [ ] Custom question input works
- [ ] Error handling displays properly
- [ ] Responsive design on mobile

---

**Prepared:** March 19, 2026  
**Status:** Ready for Implementation
