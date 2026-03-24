# Resume Analyzer: AI-Powered Screening & Matching

The **Resume Analyzer** is an advanced, AI-driven web application designed to evaluate a candidate's resume against a Job Description (JD). It uses a hybrid Natural Language Processing (NLP) approach, combining fast deterministic rule-based matching with deep semantic contextual analysis to provide a highly accurate **Alignment Score** and categorized skill feedback.

---

## 🛠️ Tech Stack & Dependencies

### Frontend
- **React.js (Vite)**: Fast, modern UI framework.
- **CSS & Glassmorphism**: For a sleek, modern, gradient-heavy user interface.
- **Lucide React**: Vector icons used throughout the dashboard.

### Backend (Python)
- **FastAPI & Uvicorn**: High-performance asynchronous API server.
- **spaCy (`en_core_web_sm`)**: Used for blazing-fast deterministic rule-based matching (PhraseMatcher) and intelligent sentence segmentation.
- **Sentence-Transformers (BERT)**: Uses `all-MiniLM-L6-v2` for deep semantic contextual similarity scoring via PyTorch.
- **PyTorch**: Powers the underlying tensor calculations and GPU/hardware acceleration for the BERT model.

### File Parsing & Extraction Dependencies
- **pdfplumber**: Primary tool for extracting raw text from PDFs while preserving some spatial context.
- **python-docx**: Library for safely unzipping and parsing Microsoft Word (`.docx`) files.
- **pytesseract & pdf2image**: Acts as an Optical Character Recognition (OCR) fallback in case a PDF upload is entirely scanned images with no embedded text layer.

---

## 📁 File Upload, Parsing & Validation Pipeline

### 1. Robust File Validation
Before any heavy NLP processing begins, the system strictly validates the uploaded user documents in memory (without saving them to disk):
- **Maximum File Size Protection**: Stops processing immediately if the file exceeds the 5MB limit.
- **MIME Type Checking**: Ensures the HTTP payload actually matches common document content types (`application/pdf`, `text/plain`, `application/zip` for DOCX).
- **Magic Number / Signature Verification**: Looks at the raw byte headers (e.g., `%PDF`, `PK\x03\x04` for ZIP/DOCX) to cryptographically ensure the file is what it claims to be.
- **Anti-Zip Bomb Protection**: Because DOCX files are technically ZIP archives, the tool safely calculates the hypothetical expanded size of the file before unzipping it, aborting if the internal payload expands beyond a safe 50MB threshold.

### 2. File Parsing & Text Extraction
Once validated, the backend parses the file bytes into raw text strings:
- **TXT Files**: Standard UTF-8 decoding.
- **DOCX Files**: Uses `python-docx` to loop through paragraph nodes and concatenate the text.
- **PDF Files**: Uses `pdfplumber` to extract text from the PDF text layers page-by-page. If the text is completely empty (often indicative of a flat scanned image rather than a native software-generated PDF), an **OCR Fallback** automatically kicks in, converting the pages to images and reading the text using `pytesseract`.

---

## 🧹 Intelligent Text Preprocessing

A significant hurdle in text analysis is that different machine learning tools require different types of text formatting. To solve this, the preprocessor instantly generates **three specialized versions** of the parsed text:

1. **Version A: Raw Text**
   - Preserves stopwords, punctuation, original casing, and sentence structures.
   - *Why?* This is used later by the **BERT Model**. Contextual Transformer models need complete, grammatically correct sentences to understand the semantic intent properly.

2. **Version B: Light Clean (The "Token" Version)**
   - Text is completely lowercased. Special noise is removed, but critically, it preserves technical characters (`.`, `+`, `#`, `/`, `-`) so skills like `C++`, `C#`, and `CI/CD` are not mistakenly destroyed into `c` or `ci cd`. 
   - *Why?* This heavily sanitized version is passed into the **spaCy PhraseMatcher** to ensure substring exact matching doesn't break due to weird spacing or capitalizations.

3. **Version C: Normalized**
   - Takes "Version B" and aggressively removes all English stop words (like *the, and, was, have*).
   - *Why?* This is used for basic algorithmic Keyword Frequency graphs to ensure common grammar words don't skew the results.

---

## 🧠 Stage 1: spaCy Fast Skill Extraction

Before utilizing heavy AI, the system runs an optimized `PhraseMatcher` to grab guaranteed, exact technical and soft skills.

* **Domain Taxonomies**: The user selects a domain (Software, Finance, Medical, HR, Electrical, etc.). The backend dynamically loads a highly detailed JSON file containing canonical skills and their many known aliases.
* **Alias Resolution**: The system doesn't just look for "Applicant Tracking System"; it also looks for "ATS", "Greenhouse", "Lever", etc. If it finds any alias in the text, it mathematically converts it to the canonical display name.
* **Execution**: It builds token-sequences of these skills and runs them across the *Light Clean* version of the JD and Resume. It automatically resolves overlapping bounding boxes (e.g., matching "Machine Learning" instead of separately matching "Machine" and "Learning").
* It outputs a list of extracted raw skills found in the JD, and raw skills found in the Resume.

---

## 🤖 Stage 2: BERT Semantic Deep Matching

The system then compares the arrays of required Job Description skills against the candidate's Resume profile. If a required skill is entirely missing from the exact spaCy match, the system doesn't immediately fail the candidate. Instead, it triggers the **BERT Semantic Matcher** to read the context of the resume.

1. **Vector Embeddings generation**: It uses `SentenceTransformer('all-MiniLM-L6-v2')` to mathematically encode the missing Job Description skills into dense mathematical vectors (768 dimensions).
2. **Resume Chunking**: It takes the *Raw Text* format of the resume and uses spaCy to cleanly segment the document into individual grammatical sentences. It translates every sentence of the resume into mathematical vectors as well.
3. **Cosine Similarity**: It calculates the mathematical distance (Cosine Similarity) between the required skill vectors and the candidate's resume sentence vectors.

---

## 📊 Stage 3: Professional PDF Report Generation

After analysis is complete, the system generates a **Comprehensive Professional PDF Report** with embedded visualizations, AI-generated insights, emoji decorators, and card-based layouts:

### 📋 Report Structure (4 Pages)

**Page 1: Executive Overview**
- 📊 Overall Alignment Score with color-coded gauge chart (Red/Orange/Yellow/Green)
- 🎯 Key Metrics Card Table (Exact, Semantic, Missing, Total Matched)
- 📝 Executive Summary with correlation-based interpretation
- 👤 Candidate/Position/Domain/Date metadata with emoji indicators

**Page 2: Skill Analysis Visualizations**
- 📈 Pie Chart: Skill match distribution (Exact vs Semantic vs Missing)
- 📊 Bar Chart: Category-wise comparison (JD Requirements vs Resume Skills)
- 📉 Histogram: Semantic confidence score distribution
- All charts embedded as high-quality PNG images with proper sizing

**Page 3: Detailed Skills Breakdown**
- ✅ **Exact Matched Skills**: Complete list with color highlighting (#10b981)
- 🔗 **Strong Semantic Matches**: Skills with 0.72+ confidence scores and individual scores
- 🟡 **Moderate Semantic Matches**: Skills with 0.60-0.72 confidence scores
- ⚠️ **Critical Missing Skills**: Priority-flagged (🔴 Role Critical, 🟠 Important, 🟡 Desired)

**Page 4: AI Insights & Recommendations**
- 🤖 **AI-Generated Interview Focus Areas**: Top 4 focus points from LLM analysis
- 🔄 **Skill Normalization Insights**: Alias mappings and skill relationships
- 💪 **Key Strengths**: Quantified alignment metrics and readiness indicators
- 🎯 **Development Areas**: Gap analysis and ramp-up timeline estimates
- 🏆 **Final Hiring Recommendation**: Algorithmic decision (🟢 Strong Yes / 🟡 Yes / 🟠 Consider / 🔴 Pass)

### 🎨 Visual Design Features

**Color Palette:**
- ✅ Success Green: #10b981 (Exact matches, positive indicators)
- 🔗 Info Blue: #3b82f6 (Semantic matches, information)
- 🟡 Warning Orange: #f59e0b (Moderate confidence, caution)
- 🟠 Alert: #f97316 (Warnings, development needed)
- ⚠️ Danger Red: #ef4444 (Missing/critical gaps)
- 🎨 Neutral Grays: #e2e8f0, #f1f5f9, #f8fafc (Backgrounds)

**Typography Hierarchy:**
- Title: 28pt Bold (#0f172a)
- Headers (H2): 15pt Bold (#1e293b)
- Subheaders (H3): 11pt Bold (#334155)
- Body: 9.5pt Justified (#334155)
- Card Text: 9pt (#334155)

**Card-Based Layouts:**
- Colored card containers for skill sections with proper spacing
- Alternating row backgrounds for tables (#f1f5f9 and white)
- 1.5px bordered grids with subtle color coding
- Proper padding and margins for visual breathing room

### 🤖 AI Content Integration

**Enrichment Features:**
- 📖 **Summary Analysis**: AI-generated overview from LLM (up to 500 chars)
- 🎤 **Interview Questions**: Top 4 suggested interview focus areas
- 🔄 **Skill Mapper**: Alias mappings and skill relationship insights
- 📋 **Gap Triage**: Prioritized missing skills with context
- ✨ **Quality Metrics**: Hallucination risk assessment, coverage score, warnings

### 📊 Visualization Capabilities

**Chart Functions:**
1. `_create_skill_match_chart()` - Pie chart with dynamic sizing (4.5×3.5")
2. `_create_category_heatmap()` - Bar chart with labeled values (6×3.5")
3. `_create_alignment_gauge()` - Colored gauge with interpretation (4×3.2")
4. `_create_confidence_distribution()` - Histogram with mean line (5.5×3")

All charts feature:
- 120 DPI resolution for print quality
- White edge borders for separation
- Bold, readable font sizes
- Proper color contrast
- Matplotlib figure cleanup with buffer management

### 🔧 Technical Implementation

**PDF Generation:**
- ReportLab for professional document formatting
- Matplotlib for chart generation and image embedding
- Async processing for responsive frontend
- BytesIO buffer management for proper image handling
- Figure cleanup (plt.close()) to prevent memory leaks

**Data Processing:**
- Extracts BERT analysis results (skill partitions, clusters, confidence)
- Parses AI enrichment data (interview focus, normalizations, triage)
- Calculates percentages and metrics dynamically
- Handles missing/null data gracefully with fallbacks

**Emoji Integration:**
- 📊 📈 ✅ ⚠️ 🎯 🤖 🔗 💪 🏆 🎤 🔄 🟢 🟡 🟠 🔴 
- Strategic placement for visual hierarchy and accessibility
- Unicode-safe emoji rendering in PDF

**Response Format:**
- Streamed binary PDF attachment
- Dynamic filename: `Resume_Analysis_Report_{DOMAIN}_{DATE}.pdf`
- Content-Type: application/pdf
- Proper HTTP headers for download

### 🎯 Scoring & Recommendations

**Alignment Thresholds:**
| Score | Recommendation | Emoji | Interpretation |
|-------|----------------|-------|-----------------|
| ≥75% | Strong Yes | 🟢 | Excellent fit, ready for immediate progression |
| 60-75% | Yes | 🟡 | Good fit with manageable gaps |
| 45-60% | Consider | 🟠 | Fair fit, requires training investment |
| <45% | Pass | 🔴 | Poor fit, substantial gaps identified |

**Formula:**
```
Score = (Exact Matches × 1.0 + Strong Semantic × 0.6 + Moderate Semantic × 0.4) / Total JD Skills × 100
```

### The Decision Tiers
Based on the BERT Cosine Similarity outputs, it categorizes candidates' capabilities into four strict UI tiers:

* 🥇 **Exact Match**: The requested JD skill string is found precisely in the resume. High confidence.
* 🥈 **Semantic Equivalents (Strong & Moderate)**: The specific exact word was missing, but the BERT model detected sentences with highly similar contextual meaning. 
  - *Strong match threshold*: Similarity Score >= 0.72 
  - *Moderate match threshold*: Similarity Score >= 0.60
  - *(Note: Small tweaks are systematically applied based on string length and recognized alias existence to normalize accuracy)*
* ❌ **Missing from Resume**: The similarity score fell below 0.60. The candidate does not vaguely possess this requirement.
* ❔ **Unrelated Profile Skills**: Skills the candidate possesses that the JD did not explicitly ask for.

---

## 🧮 How the "Alignment Score" is Calculated

The total percentage fit (e.g., `85.4%`) is computed intelligently by applying staggered mathematical weights to the BERT outcome tiers. Exact matches are worth full points, while semantic variants receive heavily penalized partial points to reward accuracy.

Every skill listed in the taxonomy theoretically carries a `max_weight` (usually defaulting to `1.0`).

**The Mathematical Formula:**
```python
Total Possible Weight = Sum(All required JD skill maximum weights)

Earned Weight = 
    (Number of Exact Matches * 1.0) +
    (Number of Strong Semantic Matches * 0.6) +
    (Number of Moderate Semantic Matches * 0.4)

Alignment Score = (Earned Weight / Total Possible Weight) * 100
```

*(Algorithm automatically restricts counting the exact same underlying skill twice if multiple varying matches apply it to the same canonical group).*

This comprehensive pipeline allows the Resume Analyzer to process documents with incredible precision, acting more like a real human recruiter evaluating meaning rather than a fragile strict keyword scanner.
