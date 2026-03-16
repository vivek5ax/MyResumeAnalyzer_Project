import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import JdInput from './components/JdInput';
import Preview from './components/Preview';
import SkillsModal from './components/SkillsModal';
import BertModal from './components/BertModal';
import VisualizationModal from './components/VisualizationModal';
import {
    ChevronDown,
    Menu,
    X,
    LayoutDashboard,
    FileText,
    BarChart3,
    Workflow,
    FileDown,
    Layers3,
    CheckCircle2,
    Loader2,
    Circle,
    Briefcase,
    UserRound,
    Microscope,
} from 'lucide-react';

function App() {
    const [resume, setResume] = useState(null);
    const [jdFile, setJdFile] = useState(null);
    const [jdText, setJdText] = useState("");
    const [domain, setDomain] = useState("software");
    const [extractedData, setExtractedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDomainOpen, setIsDomainOpen] = useState(false);
    const [activePage, setActivePage] = useState('workspace');
    const [stageStep, setStageStep] = useState(0);

    const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
    const [isBertModalOpen, setIsBertModalOpen] = useState(false);
    const [isVizModalOpen, setIsVizModalOpen] = useState(false);

    const [isSkillsClosing, setIsSkillsClosing] = useState(false);
    const [isBertClosing, setIsBertClosing] = useState(false);
    const [isVizClosing, setIsVizClosing] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [pdfProgress, setPdfProgress] = useState(0);
    const [showPdfProgress, setShowPdfProgress] = useState(false);
    const [pdfProgressLabel, setPdfProgressLabel] = useState('Preparing report data...');
    const [isHighlightEnabled, setIsHighlightEnabled] = useState(false);
    const [evidenceView, setEvidenceView] = useState('ready');
    const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isCompactScreen = viewportWidth <= 700;

    React.useEffect(() => {
        const handleResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    React.useEffect(() => {
        if (!isCompactScreen) {
            setIsSidebarOpen(false);
        }
    }, [isCompactScreen]);

    // Domain Options
    const domainOptions = [
        { id: 'software', label: 'Software Engineering', icon: '💻' },
        { id: 'medical', label: 'Medical & Healthcare', icon: '🏥' },
        { id: 'electrical', label: 'Electrical Engineering', icon: '⚡' },
        { id: 'marketing', label: 'Marketing & Sales', icon: '📢' },
        { id: 'finance', label: 'Finance & Banking', icon: '💰' },
        { id: 'human_resources', label: 'Human Resources', icon: '👥' }
    ];

    // Clear extraction results if inputs change
    React.useEffect(() => {
        setExtractedData(null);
        if (!loading) {
            setStageStep(0);
        }
    }, [resume, jdFile, jdText, domain]);

    React.useEffect(() => {
        const hasInputs = !!resume && (!!jdFile || !!jdText.trim());
        if (!loading && !extractedData) {
            setStageStep(hasInputs ? 1 : 0);
        }
    }, [resume, jdFile, jdText, loading, extractedData]);

    const handleExtract = async () => {
        setLoading(true);
        setError(null);
        setExtractedData(null);
        setStageStep(2);

        const formData = new FormData();
        formData.append('resume', resume);
        formData.append('domain', domain);

        if (jdFile) {
            formData.append('job_description_file', jdFile);
        } else if (jdText) {
            formData.append('job_description_text', jdText);
        } else {
            setError("Please provide a Job Description (File or Text)");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/extract', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Extraction failed");
            }

            const data = await response.json();
            setExtractedData(data);
            setActivePage('workspace');
            setStageStep(3);
        } catch (err) {
            setError(err.message);
            setStageStep(1);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPdf = async () => {
        if (!extractedData) return;

        let progressTimer;

        try {
            setIsGeneratingPDF(true);
            setShowPdfProgress(true);
            setPdfProgress(4);
            setPdfProgressLabel('Preparing report data...');

            progressTimer = window.setInterval(() => {
                setPdfProgress((prev) => {
                    if (prev >= 90) return 90;
                    if (prev < 35) return prev + 5;
                    if (prev < 70) return prev + 3;
                    return prev + 1;
                });
            }, 260);

            window.setTimeout(() => {
                setPdfProgressLabel('Rendering visual sections...');
            }, 1600);

            window.setTimeout(() => {
                setPdfProgressLabel('Finalizing PDF export...');
            }, 4200);

            const response = await fetch('http://localhost:8000/export-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(extractedData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'PDF export failed');
            }

            if (progressTimer) {
                window.clearInterval(progressTimer);
            }

            setPdfProgress(100);
            setPdfProgressLabel('Download ready...');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Resume_Analysis_Report_${extractedData.domain || 'General'}.pdf`;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            await new Promise((resolve) => window.setTimeout(resolve, 500));
            setShowPdfProgress(false);
        } catch (err) {
            if (progressTimer) {
                window.clearInterval(progressTimer);
            }
            setPdfProgress(100);
            setPdfProgressLabel('Export failed');
            setError(err.message || 'Failed to generate PDF');
            await new Promise((resolve) => window.setTimeout(resolve, 900));
            setShowPdfProgress(false);
        } finally {
            if (progressTimer) {
                window.clearInterval(progressTimer);
            }
            setIsGeneratingPDF(false);
        }
    };

    const closeSkillsModal = () => {
        setIsSkillsClosing(true);
        setTimeout(() => {
            setIsSkillsModalOpen(false);
            setIsSkillsClosing(false);
        }, 350);
    };

    const closeBertModal = () => {
        setIsBertClosing(true);
        setTimeout(() => {
            setIsBertModalOpen(false);
            setIsBertClosing(false);
        }, 350);
    };

    const closeVizModal = () => {
        setIsVizClosing(true);
        setTimeout(() => {
            setIsVizModalOpen(false);
            setIsVizClosing(false);
        }, 350);
    };

    const handleStartNewRun = () => {
        setResume(null);
        setJdFile(null);
        setJdText("");
        setExtractedData(null);
        setError(null);
        setLoading(false);
        setStageStep(0);
        setIsHighlightEnabled(false);
        setIsSkillsModalOpen(false);
        setIsBertModalOpen(false);
        setIsVizModalOpen(false);
        setIsSkillsClosing(false);
        setIsBertClosing(false);
        setIsVizClosing(false);
        setActivePage('workspace');
        setIsSidebarOpen(false);
        setShowPdfProgress(false);
        setPdfProgress(0);
        setPdfProgressLabel('Preparing report data...');
    };

    const isAnalyzeDisabled = !resume || (!jdFile && !jdText.trim()) || loading;
    const selectedDomain = domainOptions.find(opt => opt.id === domain);
    const navItems = [
        { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'evidence', label: 'Evidence', icon: Microscope },
    ];

    const matchedSkills = extractedData?.bert_results?.summary?.exact_match_count || 0;
    const semanticSkills = extractedData?.bert_results?.summary?.semantic_match_count || 0;
    const missingSkills = extractedData?.bert_results?.summary?.missing_skills_count || 0;
    const alignmentScore = extractedData?.bert_results?.summary?.overall_alignment_score || 0;
    const summary = extractedData?.bert_results?.summary || {};
    const skillPartition = extractedData?.bert_results?.skill_partition || {};
    const matchEvidence = extractedData?.bert_results?.match_evidence || [];

    const getWordCount = (text) => {
        if (!text || !text.trim()) return 0;
        return text.trim().split(/\s+/).filter(Boolean).length;
    };

    const formatFileSize = (bytes) => {
        if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes <= 0) return 'Size N/A';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex += 1;
        }
        return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
    };

    const truncatePreview = (text, limit = 3200) => {
        if (!text) return 'No parsed content available yet.';
        return text.length > limit ? `${text.slice(0, limit)}...` : text;
    };

    const dedupeSkills = (arr = []) => {
        const seen = new Set();
        const out = [];
        arr.forEach((item) => {
            if (!item || typeof item !== 'string') return;
            const cleaned = item.trim();
            if (!cleaned) return;
            const key = cleaned.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                out.push(cleaned);
            }
        });
        return out;
    };

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const toSkillEntries = (skills = [], category) => skills.map((skill) => ({
        skill,
        category,
    }));

    const buildHighlightedPreview = (text, skillEntries = []) => {
        if (!text) return 'No parsed content available yet.';
        if (!isHighlightEnabled || !skillEntries.length) return text;

        const orderedEntries = [...skillEntries]
            .filter((entry) => entry.skill && entry.skill.length > 1)
            .sort((a, b) => b.skill.length - a.skill.length);

        const ranges = [];
        const isOverlapping = (start, end) => ranges.some((range) => !(end <= range.start || start >= range.end));

        orderedEntries.forEach((entry) => {
            const pattern = new RegExp(`(^|[^A-Za-z0-9])(${escapeRegex(entry.skill)})(?=$|[^A-Za-z0-9])`, 'gi');
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const start = match.index + (match[1]?.length || 0);
                const end = start + (match[2]?.length || 0);
                if (!isOverlapping(start, end)) {
                    ranges.push({
                        start,
                        end,
                        category: entry.category,
                    });
                }
            }
        });

        if (!ranges.length) return text;

        ranges.sort((a, b) => a.start - b.start);

        const nodes = [];
        let cursor = 0;
        ranges.forEach((range, idx) => {
            if (range.start > cursor) {
                nodes.push(text.slice(cursor, range.start));
            }
            nodes.push(
                <mark key={`${range.start}-${range.end}-${idx}`} className={`highlight-mark ${range.category}`}>
                    {text.slice(range.start, range.end)}
                </mark>
            );
            cursor = range.end;
        });

        if (cursor < text.length) {
            nodes.push(text.slice(cursor));
        }

        return nodes;
    };

    const exactSkills = dedupeSkills(skillPartition.exact_match || []);
    const strongSemantic = skillPartition.strong_semantic || [];
    const moderateSemantic = skillPartition.moderate_semantic || [];
    const partialResumeSkills = dedupeSkills([
        ...strongSemantic.map((item) => item.skill),
        ...moderateSemantic.map((item) => item.skill),
    ]);
    const partialJdSkills = dedupeSkills([
        ...strongSemantic.map((item) => item.similar_to),
        ...moderateSemantic.map((item) => item.similar_to),
    ]);
    const missingJdSkills = dedupeSkills((extractedData?.bert_results?.missing_from_resume || []).map((item) => item.skill));
    const additionalResumeSkills = dedupeSkills(extractedData?.bert_results?.extra_resume_skills || []);

    const jdHighlightEntries = [
        ...toSkillEntries(exactSkills, 'exact'),
        ...toSkillEntries(partialJdSkills, 'partial'),
        ...toSkillEntries(missingJdSkills, 'missing'),
    ];
    const resumeHighlightEntries = [
        ...toSkillEntries(exactSkills, 'exact'),
        ...toSkillEntries(partialResumeSkills, 'partial'),
        ...toSkillEntries(additionalResumeSkills, 'additional'),
    ];

    const prettyMatchType = (value) => {
        if (value === 'exact') return 'Exact';
        if (value === 'strong_semantic') return 'Strong Semantic';
        if (value === 'moderate_semantic') return 'Moderate Semantic';
        if (value === 'missing') return 'Missing';
        return value || 'Unknown';
    };

    const compactSnippet = (value, limit = 210) => {
        if (!value || typeof value !== 'string') return 'No context captured.';
        const normalized = value.replace(/\s+/g, ' ').trim();
        if (!normalized) return 'No context captured.';
        return normalized.slice(0, limit);
    };

    const containsSkillTerm = (text, term) => {
        if (!text || !term || typeof text !== 'string' || typeof term !== 'string') return false;
        const pattern = new RegExp(`(^|[^A-Za-z0-9])${escapeRegex(term)}(?=$|[^A-Za-z0-9])`, 'i');
        return pattern.test(text);
    };

    const buildInlineHighlights = (text, terms = [], tone = 'neutral') => {
        if (!text || typeof text !== 'string') return 'No context captured.';

        const uniqueTerms = dedupeSkills(terms).filter((term) => term.length > 1);
        if (!uniqueTerms.length) return text;

        const orderedTerms = [...uniqueTerms].sort((a, b) => b.length - a.length);
        const ranges = [];
        const isOverlapping = (start, end) => ranges.some((range) => !(end <= range.start || start >= range.end));

        orderedTerms.forEach((term) => {
            const pattern = new RegExp(`(^|[^A-Za-z0-9])(${escapeRegex(term)})(?=$|[^A-Za-z0-9])`, 'gi');
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const start = match.index + (match[1]?.length || 0);
                const end = start + (match[2]?.length || 0);
                if (!isOverlapping(start, end)) {
                    ranges.push({ start, end });
                }
            }
        });

        if (!ranges.length) return text;

        ranges.sort((a, b) => a.start - b.start);

        const nodes = [];
        let cursor = 0;
        ranges.forEach((range, idx) => {
            if (range.start > cursor) {
                nodes.push(text.slice(cursor, range.start));
            }

            nodes.push(
                <mark key={`${range.start}-${range.end}-${idx}`} className={`evidence-inline-mark ${tone}`}>
                    {text.slice(range.start, range.end)}
                </mark>
            );

            cursor = range.end;
        });

        if (cursor < text.length) {
            nodes.push(text.slice(cursor));
        }

        return nodes;
    };

    const renderMainContent = () => {
        if (activePage === 'evidence') {
            if (!extractedData) {
                return (
                    <section className="documents-panel fade-in neo-panel">
                        <div className="results-empty">
                            Run an assessment to generate traceable match evidence with JD and resume context snippets.
                        </div>
                    </section>
                );
            }

            const evidenceRows = matchEvidence.slice(0, 24).map((item, idx) => {
                const matchType = item.match_type || 'neutral';
                const confidencePercent = Math.round((Number(item.confidence || 0)) * 100);
                const jdSnippet = compactSnippet(item.jd_snippet, 220);
                const resumeSnippet = compactSnippet(item.resume_snippet, 220);
                const highlightTone = matchType === 'exact'
                    ? 'exact'
                    : (matchType === 'strong_semantic' || matchType === 'moderate_semantic')
                        ? 'semantic'
                        : matchType;
                const highlightTerms = [item.skill, item.jd_skill, item.resume_skill].filter(Boolean);
                const isSemantic = matchType === 'strong_semantic' || matchType === 'moderate_semantic';
                const exactWordMissingInResume = !containsSkillTerm(resumeSnippet, item.skill || '');
                return {
                    id: `${item.skill || 'skill'}-${idx}`,
                    skill: item.skill || 'Unknown Skill',
                    matchType,
                    confidencePercent,
                    jdSkill: item.jd_skill || '-',
                    resumeSkill: item.resume_skill || '-',
                    jdSnippet,
                    resumeSnippet,
                    highlightTerms,
                    highlightTone,
                    isSemantic,
                    exactWordMissingInResume,
                };
            });

            const exactRows = evidenceRows.filter((row) => row.matchType === 'exact');
            const semanticRows = evidenceRows.filter((row) => row.matchType === 'strong_semantic' || row.matchType === 'moderate_semantic');
            const missingRows = evidenceRows.filter((row) => row.matchType === 'missing');

            const averageConfidence = evidenceRows.length
                ? Math.round(evidenceRows.reduce((acc, row) => acc + row.confidencePercent, 0) / evidenceRows.length)
                : 0;

            const hrVerdict = alignmentScore >= 75 && missingRows.length <= 4
                ? { title: 'Strong Shortlist', tone: 'positive', note: 'Candidate demonstrates strong role-fit with manageable gaps.' }
                : alignmentScore >= 55
                    ? { title: 'Interview with Focus Areas', tone: 'neutral', note: 'Candidate is viable, but interview must validate specific risk areas.' }
                    : { title: 'High Risk for Current Role', tone: 'risk', note: 'Current evidence suggests significant capability mismatch for this JD.' };

            const topStrengths = exactRows.slice(0, 4).map((row) => row.skill);
            const topRisks = missingRows.slice(0, 4).map((row) => row.skill);
            const semanticProbeRows = semanticRows.filter((row) => row.exactWordMissingInResume).slice(0, 3);

            const laneMap = {
                ready: {
                    key: 'ready',
                    label: 'Ready Signals',
                    rows: exactRows,
                    cardClass: 'exact',
                    tone: 'exact',
                    caption: 'Directly present in candidate profile and JD evidence.',
                },
                validation: {
                    key: 'validation',
                    label: 'Needs Validation',
                    rows: semanticRows,
                    cardClass: 'semantic',
                    tone: 'semantic',
                    caption: 'Contextual skill alignment; verify practical depth during interview.',
                },
                risk: {
                    key: 'risk',
                    label: 'Risk Gaps',
                    rows: missingRows,
                    cardClass: 'missing',
                    tone: 'missing',
                    caption: 'Critical mismatch signal. Needs training plan or alternative candidate coverage.',
                },
            };

            const activeLane = laneMap[evidenceView] || laneMap.ready;

            return (
                <section className="documents-panel fade-in neo-panel">
                    <div className="neo-panel-header">
                        <h3 className="section-title">Recruiter Decision Console</h3>
                        <p className="neo-muted">HR-oriented view of candidate fit, risk, and interview focus areas based on evidence.</p>
                    </div>

                    {!matchEvidence.length ? (
                        <div className="results-empty">No evidence rows were generated for this run.</div>
                    ) : (
                        <>
                            <section className="evidence-hr-summary-grid">
                                <article className={`evidence-hr-card verdict ${hrVerdict.tone}`}>
                                    <p className="doc-label">Hiring Recommendation</p>
                                    <p className="doc-value">{hrVerdict.title}</p>
                                    <p className="insight-subtext">{hrVerdict.note}</p>
                                </article>
                                <article className="evidence-hr-card">
                                    <p className="doc-label">Average Evidence Confidence</p>
                                    <p className="doc-value">{averageConfidence}%</p>
                                    <p className="insight-subtext">Based on {evidenceRows.length} tracked evidence rows.</p>
                                </article>
                                <article className="evidence-hr-card">
                                    <p className="doc-label">Strength vs Risk</p>
                                    <p className="doc-value">{exactRows.length} strengths | {missingRows.length} risk gaps</p>
                                    <p className="insight-subtext">Use this ratio to prioritize shortlist confidence.</p>
                                </article>
                            </section>

                            <section className="evidence-hr-playbook">
                                <article className="document-card evidence-playbook-card">
                                    <p className="doc-label">Top Strength Signals</p>
                                    <ul className="evidence-playbook-list">
                                        {topStrengths.length ? topStrengths.map((skill) => <li key={skill}>{skill}</li>) : <li>No strong strength signals detected.</li>}
                                    </ul>
                                </article>

                                <article className="document-card evidence-playbook-card">
                                    <p className="doc-label">Top Risk Signals</p>
                                    <ul className="evidence-playbook-list">
                                        {topRisks.length ? topRisks.map((skill) => <li key={skill}>{skill}</li>) : <li>No high-priority risk gaps detected.</li>}
                                    </ul>
                                </article>

                                <article className="document-card evidence-playbook-card">
                                    <p className="doc-label">Interview Probes (Semantic Matches)</p>
                                    <ul className="evidence-playbook-list">
                                        {semanticProbeRows.length ? semanticProbeRows.map((row) => (
                                            <li key={row.id}>Validate real depth in {row.skill} ({row.confidencePercent}% semantic confidence).</li>
                                        )) : <li>No semantic-only probes required.</li>}
                                    </ul>
                                </article>
                            </section>

                            <div className="evidence-summary-row">
                                <p className="insight-subtext">Evidence grouped for recruiter action: ready-to-hire signals, contextual match checks, and concern items.</p>
                            </div>

                            <section className="evidence-lane-switch">
                                {Object.values(laneMap).map((lane) => (
                                    <button
                                        key={lane.key}
                                        className={`evidence-lane-btn ${evidenceView === lane.key ? 'active' : ''}`}
                                        onClick={() => setEvidenceView(lane.key)}
                                    >
                                        <span>{lane.label}</span>
                                        <strong>{lane.rows.length}</strong>
                                    </button>
                                ))}
                            </section>

                            <section className="evidence-lanes-grid single-view">
                                <article className="evidence-lane">
                                    <div className="evidence-lane-header">
                                        <h4>{activeLane.label}</h4>
                                        <span>{activeLane.rows.length}</span>
                                    </div>
                                    <div className="evidence-lane-body">
                                        {activeLane.rows.slice(0, 12).map((row) => (
                                            <article key={row.id} className={`evidence-item-card ${activeLane.cardClass}`}>
                                                <div className="evidence-item-top">
                                                    <span className={`evidence-skill-chip evidence-skill-${row.matchType}`}>{row.skill}</span>
                                                    <span className={`evidence-pill evidence-${row.matchType}`}>{row.confidencePercent}%</span>
                                                </div>
                                                <p className="evidence-item-caption">{activeLane.caption}</p>
                                                <div className="evidence-context-stack">
                                                    <div className="evidence-context-block">
                                                        <p className="evidence-context-label">JD Context</p>
                                                        <div className="evidence-context-cell">{buildInlineHighlights(row.jdSnippet, row.highlightTerms, activeLane.tone)}</div>
                                                    </div>
                                                    <div className="evidence-context-block">
                                                        <p className="evidence-context-label">Resume Context</p>
                                                        <div className="evidence-context-cell">{buildInlineHighlights(row.resumeSnippet, row.highlightTerms, activeLane.tone)}</div>
                                                    </div>
                                                    {row.isSemantic && row.exactWordMissingInResume ? (
                                                        <p className="evidence-semantic-note">Matched semantically at {row.confidencePercent}% even though exact terminology is absent.</p>
                                                    ) : null}
                                                </div>
                                            </article>
                                        ))}
                                        {!activeLane.rows.length ? (
                                            <div className="results-empty">No items in this lane for the current run.</div>
                                        ) : null}
                                    </div>
                                </article>
                            </section>
                        </>
                    )}
                </section>
            );
        }

        if (activePage === 'documents') {
            return (
                <section className="documents-panel fade-in neo-panel">
                    <div className="neo-panel-header">
                        <h3 className="section-title">Document Center</h3>
                        <p className="neo-muted">All sources and metadata for the active assessment.</p>
                    </div>
                    <div className="documents-grid">
                        <div className="document-card">
                            <div className="doc-label-row">
                                <Briefcase size={14} className="doc-icon-badge" />
                                <p className="doc-label">Job Description Source</p>
                            </div>
                            <p className="doc-value">{jdFile ? jdFile.name : jdText.trim() ? 'Manual Text Input' : 'Not attached'}</p>
                        </div>
                        <div className="document-card">
                            <div className="doc-label-row">
                                <UserRound size={14} className="doc-icon-badge" />
                                <p className="doc-label">Resume Source</p>
                            </div>
                            <p className="doc-value">{resume ? resume.name : 'Not attached'}</p>
                        </div>
                    </div>

                    {extractedData ? (
                        <>
                            <div className="documents-section-divider">
                                <span>Parsed Content Preview</span>
                            </div>

                            <div className="documents-highlight-toolbar">
                                <button
                                    className={`highlight-toggle-btn ${isHighlightEnabled ? 'active' : ''}`}
                                    onClick={() => setIsHighlightEnabled((prev) => !prev)}
                                >
                                    {isHighlightEnabled ? 'Remove Highlight' : 'Highlighter'}
                                </button>

                                <div className="highlight-legend">
                                    <span className="legend-pill exact">Exact Match</span>
                                    <span className="legend-pill partial">Partial Match</span>
                                    <span className="legend-pill missing">Missing Skills</span>
                                    <span className="legend-pill additional">Additional Resume Skills</span>
                                </div>
                            </div>

                            <section className="documents-text-compare">
                                <article className="document-card text-preview-card">
                                    <div className="text-preview-header">
                                        <div>
                                            <p className="doc-label">Parsed Job Description</p>
                                            <p className="doc-value">{extractedData.jd_filename || 'Manual Input'}</p>
                                            <p className="text-metrics">{jdFile ? formatFileSize(jdFile.size) : jdText.trim() ? 'Manual text input' : 'Size N/A'}</p>
                                        </div>
                                        <p className="text-metrics">{getWordCount(extractedData.job_description_text)} words</p>
                                    </div>
                                    <div className="parsed-preview-body">
                                        {buildHighlightedPreview(extractedData.job_description_text, jdHighlightEntries)}
                                        <div className="preview-scroll-buffer" aria-hidden="true" />
                                    </div>
                                </article>

                                <article className="document-card text-preview-card">
                                    <div className="text-preview-header">
                                        <div>
                                            <p className="doc-label">Parsed Resume Content</p>
                                            <p className="doc-value">{extractedData.resume_filename || 'Uploaded File'}</p>
                                            <p className="text-metrics">{resume ? formatFileSize(resume.size) : 'Size N/A'}</p>
                                        </div>
                                        <p className="text-metrics">{getWordCount(extractedData.resume_text)} words</p>
                                    </div>
                                    <div className="parsed-preview-body">
                                        {buildHighlightedPreview(extractedData.resume_text, resumeHighlightEntries)}
                                        <div className="preview-scroll-buffer" aria-hidden="true" />
                                    </div>
                                </article>
                            </section>
                        </>
                    ) : (
                        <div className="results-empty">
                            Run an assessment to unlock semantic insights, skill-gap summary, and side-by-side parsed content previews.
                        </div>
                    )}
                </section>
            );
        }

        return (
            <>
                <section className="neo-hero-grid">
                    <div className="neo-hero-card">
                        <p className="neo-kicker">AI Assistant</p>
                        <h3>Build a complete capability snapshot for every candidate profile.</h3>
                        <p>
                            Upload resume and JD inputs, run semantic scoring, and export formal recruiter-grade reports.
                        </p>
                    </div>

                    <div className="neo-stats-grid">
                        <div className="neo-stat-card">
                            <p>Alignment Score</p>
                            <h4>{alignmentScore}%</h4>
                        </div>
                        <div className="neo-stat-card">
                            <p>Exact Matches</p>
                            <h4>{matchedSkills}</h4>
                        </div>
                        <div className="neo-stat-card">
                            <p>Semantic Matches</p>
                            <h4>{semanticSkills}</h4>
                        </div>
                        <div className="neo-stat-card">
                            <p>Missing Skills</p>
                            <h4>{missingSkills}</h4>
                        </div>
                    </div>
                </section>

                <section className="domain-section neo-panel">
                    <div className="section-heading-row">
                        <h3 className="section-title">Domain Configuration</h3>
                    </div>

                    <div className="domain-dropdown">
                        <button
                            className="domain-trigger"
                            onClick={() => setIsDomainOpen(!isDomainOpen)}
                        >
                            <div className="domain-trigger-content">
                                <span className="domain-emoji">{selectedDomain?.icon}</span>
                                <span>{selectedDomain?.label}</span>
                            </div>
                            <ChevronDown
                                size={18}
                                style={{
                                    transform: isDomainOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease'
                                }}
                            />
                        </button>

                        {isDomainOpen && (
                            <div className="domain-menu fade-in">
                                {domainOptions.map(opt => (
                                    <button
                                        key={opt.id}
                                        className={`domain-option ${domain === opt.id ? 'active' : ''}`}
                                        onClick={() => {
                                            setDomain(opt.id);
                                            setIsDomainOpen(false);
                                        }}
                                    >
                                        <span>{opt.icon}</span>
                                        <span>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="workspace-grid neo-panel">
                    <div>
                        <div className="section-heading-row">
                            <h3 className="section-title">Job Description</h3>
                        </div>
                        <div className="setup-card">
                            <JdInput
                                onFileSelect={setJdFile}
                                onTextChange={setJdText}
                                selectedFile={jdFile}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="section-heading-row">
                            <h3 className="section-title">Candidate Resume</h3>
                        </div>
                        <div className="setup-card">
                            <div className="file-placeholder-spacing" />
                            <FileUpload
                                onFileSelect={setResume}
                                selectedFile={resume}
                                accept=".pdf,.docx,.txt"
                                label="Resume"
                            />
                            {resume && (
                                <div className="attached-file-note">
                                    Attached file: {resume.name}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="action-section">
                    <button
                        className="btn workspace-run-btn"
                        onClick={handleExtract}
                        disabled={isAnalyzeDisabled}
                    >
                        {loading ? 'Running Analysis...' : 'Run Analysis'}
                    </button>
                </section>

                <section className="pipeline-strip neo-panel">
                    <div className={`pipeline-item ${stageStep >= 1 ? 'complete' : ''}`}>
                        {stageStep >= 1 ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        <span>Input Capture</span>
                    </div>
                    <div className={`pipeline-item ${loading ? 'active' : ''} ${stageStep >= 2 ? 'complete' : ''}`}>
                        {loading ? <Loader2 size={16} className="spin" /> : stageStep >= 2 ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        <span>Semantic Processing</span>
                    </div>
                    <div className={`pipeline-item ${stageStep >= 3 ? 'complete' : ''}`}>
                        {stageStep >= 3 ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        <span>Executive Reporting</span>
                    </div>
                </section>

                {error && (
                    <div className="error-message fade-in">
                        {error}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="app-container fade-in">
            <div className="app-layout">
                <aside className={`sidebar-glass ${isCompactScreen ? 'mobile-drawer' : ''} ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-brand-block">
                        <button className="brand-orb" aria-label="Resume Analyzer Home">✶</button>
                        {isCompactScreen && (
                            <button
                                className="mobile-drawer-close"
                                onClick={() => setIsSidebarOpen(false)}
                                aria-label="Close sidebar"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <nav className="sidebar-nav">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setActivePage(item.id);
                                        if (isCompactScreen) setIsSidebarOpen(false);
                                    }}
                                    title={item.label}
                                >
                                    <Icon size={18} />
                                    <span className="sidebar-nav-label">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {extractedData && (
                        <div className="sidebar-action-stack">
                            <button className="sidebar-action-btn" onClick={() => setIsVizModalOpen(true)}>
                                <BarChart3 size={16} />
                                <span>Visuals</span>
                            </button>
                            <button className="sidebar-action-btn" onClick={() => setIsBertModalOpen(true)}>
                                <Layers3 size={16} />
                                <span>Semantic</span>
                            </button>
                            <button className="sidebar-action-btn" onClick={() => setIsSkillsModalOpen(true)}>
                                <Workflow size={16} />
                                <span>Skills</span>
                            </button>
                            <button className="sidebar-action-btn primary" onClick={handleExportPdf} disabled={isGeneratingPDF}>
                                <FileDown size={16} />
                                <span>{isGeneratingPDF ? 'Exporting...' : 'Export PDF'}</span>
                            </button>
                        </div>
                    )}

                    <div className="sidebar-mini-card">
                        <p className="doc-label">Current Domain</p>
                        <p className="doc-value">{selectedDomain?.label}</p>
                    </div>
                </aside>

                {isCompactScreen && isSidebarOpen && (
                    <button
                        className="mobile-sidebar-backdrop show"
                        aria-label="Close sidebar backdrop"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <main className={`glass-card professional-shell page-panel ${!isCompactScreen && activePage === 'workspace' ? 'workspace-no-scroll' : ''} ${!isCompactScreen && activePage === 'documents' ? 'documents-no-scroll' : ''}`}>
                    <header className="professional-header">
                        {isCompactScreen && (
                            <button
                                className="mobile-sidebar-toggle"
                                onClick={() => setIsSidebarOpen(true)}
                                aria-label="Open sidebar"
                            >
                                <Menu size={18} />
                                <span>Menu</span>
                            </button>
                        )}
                        <div>
                            <h1 className={`title ${activePage === 'documents' ? 'documents-title' : ''}`}>
                                {activePage === 'workspace' && 'Assessment Workspace'}
                                {activePage === 'documents' && 'Document Overview'}
                                {activePage === 'evidence' && 'Evidence Layer'}
                            </h1>
                            <p className="subtitle">Clear end-to-end flow from input ingestion to recruiter-ready intelligence.</p>
                        </div>
                        <button className="title-cta-btn" onClick={handleStartNewRun}>Start New Run</button>
                    </header>

                    {renderMainContent()}
                </main>
            </div>

            <SkillsModal isOpen={isSkillsModalOpen} onClose={closeSkillsModal} isClosing={isSkillsClosing} data={extractedData || {}} />
            <BertModal isOpen={isBertModalOpen} onClose={closeBertModal} isClosing={isBertClosing} data={extractedData || {}} />
            <VisualizationModal isOpen={isVizModalOpen} onClose={closeVizModal} isClosing={isVizClosing} data={extractedData || {}} />

            {showPdfProgress && (
                <div className="pdf-progress-overlay">
                    <div className="pdf-progress-card">
                        <h3>Generating HR Report</h3>
                        <p>{pdfProgressLabel}</p>
                        <div className="pdf-progress-ring" style={{ '--progress': `${pdfProgress}%` }}>
                            <div className="pdf-progress-ring-inner">{pdfProgress}%</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
