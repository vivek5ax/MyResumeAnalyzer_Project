import React, { useEffect, useMemo, useRef, useState } from 'react';
import FileUpload from './FileUpload';
import { ChevronDown, FileText, Files, Loader2, Trophy } from 'lucide-react';
import { apiUrl } from '../config/api';

const MAX_FILES = 10;
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Keep multi-resume state in memory until browser refresh.
let multiResumePageCache = {
    domain: 'software',
    jdFile: null,
    resumeFiles: [],
    results: [],
    meta: null,
    error: null,
};

const formatSize = (bytes) => {
    if (!bytes || Number.isNaN(bytes)) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let idx = 0;
    while (size >= 1024 && idx < units.length - 1) {
        size /= 1024;
        idx += 1;
    }
    return `${size.toFixed(size >= 100 || idx === 0 ? 0 : 1)} ${units[idx]}`;
};

const truncateList = (items = [], limit = 4) => {
    if (!Array.isArray(items) || !items.length) return '-';
    const shown = items.slice(0, limit).join(', ');
    const extra = items.length - limit;
    return extra > 0 ? `${shown} +${extra}` : shown;
};

const MultiResumeAnalysis = ({ domainOptions }) => {
    const [domain, setDomain] = useState(multiResumePageCache.domain || 'software');
    const [isDomainOpen, setIsDomainOpen] = useState(false);
    const [jdFile, setJdFile] = useState(multiResumePageCache.jdFile || null);
    const [resumeFiles, setResumeFiles] = useState(Array.isArray(multiResumePageCache.resumeFiles) ? multiResumePageCache.resumeFiles : []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(multiResumePageCache.error || null);
    const [results, setResults] = useState(Array.isArray(multiResumePageCache.results) ? multiResumePageCache.results : []);
    const [meta, setMeta] = useState(multiResumePageCache.meta || null);

    const resumeInputRef = useRef(null);
    const selectedDomain = useMemo(() => domainOptions.find((opt) => opt.id === domain), [domainOptions, domain]);
    const podiumData = useMemo(() => {
        if (!results.length) {
            return {
                heading: 'Top 3 Preview',
                footer: 'Run analysis to reveal real rankings.',
                entries: [
                    { rank: 2, label: 'Runner Up', score: null, stepClass: 'step-2' },
                    { rank: 1, label: 'Top Match', score: null, stepClass: 'step-1' },
                    { rank: 3, label: 'Strong Fit', score: null, stepClass: 'step-3' },
                ],
            };
        }

        const topThree = results.slice(0, 3);
        const first = topThree.find((item) => Number(item.rank) === 1) || topThree[0] || null;
        const second = topThree.find((item) => Number(item.rank) === 2) || topThree[1] || null;
        const third = topThree.find((item) => Number(item.rank) === 3) || topThree[2] || null;

        return {
            heading: 'Top 3 Results',
            footer: `${results.length} total candidates analyzed • Top match: ${first?.match_percentage ?? 0}%`,
            entries: [
                {
                    rank: 2,
                    label: second?.resume_name || 'Runner Up',
                    score: second?.match_percentage ?? null,
                    stepClass: 'step-2',
                },
                {
                    rank: 1,
                    label: first?.resume_name || 'Top Match',
                    score: first?.match_percentage ?? null,
                    stepClass: 'step-1',
                },
                {
                    rank: 3,
                    label: third?.resume_name || 'Strong Fit',
                    score: third?.match_percentage ?? null,
                    stepClass: 'step-3',
                },
            ],
        };
    }, [results]);
    const hasTopPerformerResults = results.length > 0;

    useEffect(() => {
        multiResumePageCache = {
            domain,
            jdFile,
            resumeFiles,
            results,
            meta,
            error,
        };
    }, [domain, jdFile, resumeFiles, results, meta, error]);

    const validateResumeFiles = (files) => {
        if (!files || !files.length) return 'Please upload at least one resume file.';
        if (files.length > MAX_FILES) return `You can upload up to ${MAX_FILES} resumes at a time.`;

        for (const file of files) {
            const ext = String(file.name || '').split('.').pop()?.toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(ext)) {
                return `Invalid file type for ${file.name}. Allowed: PDF, DOCX, TXT.`;
            }
            if (file.size > MAX_FILE_SIZE) {
                return `${file.name} exceeds 5MB limit.`;
            }
        }
        return null;
    };

    const handleResumeSelection = (event) => {
        const files = Array.from(event.target.files || []);
        const validationError = validateResumeFiles(files);
        if (validationError) {
            setError(validationError);
            setResumeFiles([]);
            return;
        }
        setError(null);
        setResumeFiles(files);
    };

    const removeResume = (idx) => {
        setResumeFiles((prev) => prev.filter((_, index) => index !== idx));
    };

    const startNewRun = () => {
        // Reset only the multi-resume page state
        setJdFile(null);
        setResumeFiles([]);
        setResults([]);
        setMeta(null);
        setError(null);
        // Reset cache
        multiResumePageCache = {
            domain,
            jdFile: null,
            resumeFiles: [],
            results: [],
            meta: null,
            error: null,
        };
    };

    const runMultiAnalysis = async () => {
        setError(null);
        setResults([]);
        setMeta(null);

        if (!jdFile) {
            setError('Please upload one Job Description file.');
            return;
        }

        const validationError = validateResumeFiles(resumeFiles);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('domain', domain);
            formData.append('job_description_file', jdFile);
            resumeFiles.forEach((file) => formData.append('resumes', file));

            const response = await fetch(apiUrl('/extract-multi-resume'), {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err?.detail || 'Multi-resume analysis failed.');
            }

            const payload = await response.json();
            setResults(Array.isArray(payload?.rankings) ? payload.rankings : []);
            setMeta({
                jdSkillCount: Number(payload?.jd_skill_count || 0),
                resumeCount: Number(payload?.resume_count || 0),
                domain: payload?.domain || domain,
            });
        } catch (err) {
            setError(err?.message || 'Unable to run analysis right now.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="documents-panel fade-in neo-panel multi-resume-panel">
            {/* Top Performers Card */}
            <section className="top-performers-shell">
                <div className="top-performers-card">
                    <div className="top-performers-header">
                        <Trophy size={20} className="top-performers-trophy" />
                        <h3 className="top-performers-title">Top Performers</h3>
                    </div>

                    <div className={`top-performers-layout ${hasTopPerformerResults ? 'with-results' : 'preview-only'}`}>
                        <div className="top-performers-empty" aria-label="Top performer podium visualization">
                            <p className="top-performers-empty-label">{podiumData.heading}</p>
                            <div className="performer-podium">
                                {podiumData.entries.map((entry) => (
                                    <div key={`podium-${entry.rank}`} className={`podium-step ${entry.stepClass}`}>
                                        <span className="podium-rank">{entry.rank}</span>
                                        <span className="podium-name" title={entry.label}>{entry.label}</span>
                                        {entry.score !== null && <span className="podium-score">{entry.score}%</span>}
                                    </div>
                                ))}
                            </div>
                            <p className="performers-insight-text">{podiumData.footer}</p>
                        </div>

                        {hasTopPerformerResults && (
                            <aside className="top-performers-side-table" aria-label="Top 3 performers table">
                                <p className="top-performers-side-title">Top 3 Details Table</p>
                                <div className="top-performers-side-table-wrap">
                                    <table className="top-performers-mini-table">
                                        <thead>
                                            <tr>
                                                <th>Rank</th>
                                                <th>Resume</th>
                                                <th>Match%</th>
                                                <th>Exact</th>
                                                <th>Semantic</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.slice(0, 3).map((result) => (
                                                <tr key={`mini-${result.resume_filename}`} className={`mini-table-row rank-${result.rank}`}>
                                                    <td>#{result.rank}</td>
                                                    <td title={result.resume_name}>{result.resume_name}</td>
                                                    <td>{result.match_percentage}%</td>
                                                    <td>{result.exact_matches}</td>
                                                    <td>{result.semantic_matches}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </aside>
                        )}
                    </div>
                </div>
            </section>

            {/* Domain Selection */}
            <section className="domain-section neo-panel">
                <div className="section-heading-row">
                    <h3 className="section-title">Domain Configuration</h3>
                </div>

                <div className="domain-dropdown">
                    <button
                        className="domain-trigger"
                        onClick={() => setIsDomainOpen((prev) => !prev)}
                        type="button"
                    >
                        <div className="domain-trigger-content">
                            <span className="domain-emoji">{selectedDomain?.icon}</span>
                            <span>{selectedDomain?.label}</span>
                        </div>
                        <ChevronDown
                            size={18}
                            style={{
                                transform: isDomainOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                            }}
                        />
                    </button>

                    {isDomainOpen && (
                        <div className="domain-menu fade-in">
                            {domainOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    className={`domain-option ${domain === opt.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setDomain(opt.id);
                                        setIsDomainOpen(false);
                                    }}
                                    type="button"
                                >
                                    <span>{opt.icon}</span>
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* JD and Resume Upload - Grid Layout */}
            <section className="workspace-grid neo-panel">
                <div>
                    <div className="section-heading-row">
                        <h3 className="section-title">Job Description</h3>
                    </div>
                    <div className="setup-card">
                        <FileUpload
                            onFileSelect={setJdFile}
                            selectedFile={jdFile}
                            accept=".pdf,.docx,.txt"
                            label="Job Description"
                        />
                    </div>
                </div>

                <div>
                    <div className="section-heading-row">
                        <h3 className="section-title">Candidate Resumes (Up to 10)</h3>
                    </div>
                    <div className="setup-card multi-upload-container">
                        <input
                            ref={resumeInputRef}
                            type="file"
                            accept=".pdf,.docx,.txt"
                            multiple
                            onChange={handleResumeSelection}
                            style={{ display: 'none' }}
                        />

                        <button
                            className="multi-upload-trigger-browse"
                            type="button"
                            onClick={() => resumeInputRef.current?.click()}
                        >
                            <Files size={16} />
                            <span>Select Resume Files</span>
                        </button>

                        <p className="multi-upload-hint-text">PDF, DOCX, TXT • Max 10 files, 5MB each</p>

                        {resumeFiles.length > 0 && (
                            <div className="multi-upload-selected-list">
                                {resumeFiles.map((file, idx) => (
                                    <div key={`${file.name}-${idx}`} className="multi-upload-selected-item">
                                        <div className="multi-upload-selected-info">
                                            <FileText size={13} />
                                            <span className="multi-upload-selected-name" title={file.name}>{file.name}</span>
                                            <span className="multi-upload-selected-size">{formatSize(file.size)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="multi-upload-selected-remove"
                                            onClick={() => removeResume(idx)}
                                            title="Remove file"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Run Button */}
            <section className="action-section">
                <button
                    className="btn workspace-run-btn"
                    onClick={runMultiAnalysis}
                    disabled={loading || !jdFile || resumeFiles.length === 0}
                    type="button"
                >
                    {loading ? (
                        <span className="inline-loading"><Loader2 size={14} className="spin" /> Running Analysis...</span>
                    ) : 'Run Analysis'}
                </button>
            </section>

            {/* Error Message */}
            {error && <div className="error-message fade-in">{error}</div>}

            {/* Results Section */}
            {meta && (
                <section className="multi-summary-row">
                    <div className="multi-summary-pill">Domain: {meta.domain}</div>
                    <div className="multi-summary-pill">JD Skills: {meta.jdSkillCount}</div>
                    <div className="multi-summary-pill">Resumes: {meta.resumeCount}</div>
                </section>
            )}

            {/* Start New Run Button - Appears when results exist */}
            {(results.length > 0 || meta) && (
                <section className="action-section start-new-run-section">
                    <button
                        className="btn start-new-run-btn"
                        onClick={startNewRun}
                        type="button"
                        title="Clear results and start a new multi-resume analysis"
                    >
                        Start New Run
                    </button>
                </section>
            )}

            {results.length > 0 && (
                <section className="multi-ranking-wrap">
                    <h3 className="section-title">Full Ranking Table</h3>
                    <div className="evidence-table-wrap multi-resume-table-wrapper">
                        <table className="evidence-table multi-ranking-table">
                            <thead>
                                <tr>
                                    <th className="rank-col">🏆 Rank</th>
                                    <th className="name-col">Resume Name</th>
                                    <th className="match-col">Match %</th>
                                    <th className="exact-col">Exact</th>
                                    <th className="semantic-col">Semantic</th>
                                    <th className="strong-col">Strong Skills</th>
                                    <th className="missing-col">Missing Skills</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((row, idx) => (
                                    <tr key={row.resume_filename} className={`ranking-row rank-position-${idx + 1}`}>
                                        <td className="rank-col"><span className="rank-number">#{row.rank}</span></td>
                                        <td className="name-col"><span className="resume-name-badge">{row.resume_name}</span></td>
                                        <td className="match-col"><span className={`match-percentage match-${Math.round(row.match_percentage / 25)}`}>{row.match_percentage}%</span></td>
                                        <td className="exact-col"><span className="skill-count exact-count">{row.exact_matches}</span></td>
                                        <td className="semantic-col"><span className="skill-count semantic-count">{row.semantic_matches}</span></td>
                                        <td className="strong-col" title={(row.strong_skills || []).join(', ')}><span className="skill-list strong-list">{truncateList(row.strong_skills, 3)}</span></td>
                                        <td className="missing-col" title={(row.missing_skills || []).join(', ')}><span className="skill-list missing-list">{truncateList(row.missing_skills, 3)}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </section>
    );
};

export default MultiResumeAnalysis;
