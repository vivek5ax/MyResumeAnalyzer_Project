import React from 'react';
import ReactDOM from 'react-dom';
import { X, Sparkles, CheckCircle, AlertCircle, HelpCircle, BrainCircuit, Target, AlertTriangle } from 'lucide-react';

const BertModal = ({ isOpen, onClose, isClosing, data }) => {
    const [showVenn, setShowVenn] = React.useState(false);
    const [expandedRegion, setExpandedRegion] = React.useState(null);

    if (!isOpen) return null;

    console.log("BertModal Received Data:", data);

    // Safeguard nested structure based on our new advanced ATS Semantic Pipeline
    const defaultPartition = { exact_match: [], strong_semantic: [], moderate_semantic: [], irrelevant: [] };
    const defaultSummary = { total_jd_skills: 0, resume_detected_skills: 0, exact_match_count: 0, semantic_match_count: 0, missing_skills_count: 0, overall_alignment_score: 0 };

    // Safely extract our tiered structures
    const bertResults = data.bert_results || {};
    const summary = bertResults.summary || defaultSummary;
    const partition = bertResults.skill_partition || defaultPartition;
    const missingSkills = bertResults.missing_from_resume || [];

    // Join semantic arrays securely mapping the string outputs
    const allSemanticMatches = [...(partition.strong_semantic || []), ...(partition.moderate_semantic || [])];

    // Calculate Venn Diagram Arrays Dynamically treating semantics as matches
    const exactMatchStrings = partition.exact_match || [];
    const semanticMatchStrings = allSemanticMatches.map(item => item.skill); // Resume's variants
    const matchedSkills = [...exactMatchStrings, ...semanticMatchStrings];

    const resumeOnly = partition.irrelevant || [];
    const jdOnly = missingSkills.map(item => item.skill);

    const modalContent = (
        <div className="modal-overlay">
            <div className={`modal-content modal-content-full ${isClosing ? 'slide-down' : ''}`} style={{ background: '#f8fafc' }}>
                {/* Header Section */}
                <div className="modal-header" style={{
                    padding: '1.5rem 3rem',
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                            <Sparkles size={32} color="#fbbf24" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>BERT ATS Semantic Analysis</h2>
                            <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Deep Contextual Scoring & Tier Classification</p>
                        </div>
                    </div>

                    {/* Add Score Right Next to Title */}
                    <div style={{ padding: '0.5rem 1.5rem', background: '#fbbf24', borderRadius: '30px', color: '#78350f', fontWeight: '900', fontSize: '1.3rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        {summary.overall_alignment_score}% ALIGNMENT
                    </div>

                    <button className="modal-close-btn" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', width: '40px', height: '40px', borderRadius: '10px' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Main Content Area */}
                <div style={{ padding: '2.5rem 3rem', height: 'calc(100vh - 100px)', overflowY: 'auto' }}>

                    {/* Metrics Summary Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>JD Requirements</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b' }}>{summary.total_jd_skills}</span>
                        </div>
                        <div style={{ background: '#dcfce7', padding: '1.25rem', borderRadius: '16px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#166534', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Exact Matches</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#166534' }}>{summary.exact_match_count}</span>
                        </div>
                        <div style={{ background: '#fef3c7', padding: '1.25rem', borderRadius: '16px', border: '1px solid #fde68a', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#92400e', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Semantic Overlap</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#92400e' }}>{summary.semantic_match_count}</span>
                        </div>
                        <div style={{ background: '#fee2e2', padding: '1.25rem', borderRadius: '16px', border: '1px solid #fecaca', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Critically Missing</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#991b1b' }}>{summary.missing_skills_count}</span>
                        </div>
                    </div>

                    {/* Skill Classification Grid (4 Column Layout Now) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                        {/* 1. Exact Match Pillar */}
                        <div className="bert-match-card">
                            <h3 className="category-label label-exact" style={{ color: '#166534' }}>
                                <AlertCircle size={18} /> Exact Matches
                            </h3>
                            <div className="skills-list" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                                {exactMatchStrings.length > 0 ? (
                                    exactMatchStrings.map((skill, i) => (
                                        <span key={i} className="skill-tag skill-pill-exact">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="no-skills-msg">No exact matches found.</p>
                                )}
                            </div>
                        </div>

                        {/* 2. Semantic Match Pillar */}
                        <div className="bert-match-card">
                            <h3 className="category-label label-semantic" style={{ color: '#92400e', background: '#fef3c7' }}>
                                <Target size={18} /> Semantic Equivalents
                            </h3>
                            <div className="skills-list" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                                {allSemanticMatches.length > 0 ? (
                                    allSemanticMatches.map((item, i) => (
                                        <div key={i} style={{
                                            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.5rem',
                                            fontSize: '0.8rem', color: '#92400e', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        }}>
                                            <strong>{item.skill}</strong>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>Matches: {item.similar_to} ({(item.score * 100).toFixed(0)}%)</div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-skills-msg">No related semantics identified.</p>
                                )}
                            </div>
                        </div>

                        {/* 3. Missing Skills Pillar */}
                        <div className="bert-match-card">
                            <h3 className="category-label label-irrelevant" style={{ color: '#991b1b', background: '#fee2e2' }}>
                                <AlertTriangle size={18} /> Missing from Resume
                            </h3>
                            <div className="skills-list" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                                {missingSkills.length > 0 ? (
                                    missingSkills.map((item, i) => (
                                        <div key={i} style={{
                                            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.5rem',
                                            fontSize: '0.8rem', color: '#991b1b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        }}>
                                            <strong style={{ display: 'block' }}>{item.skill}</strong>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{item.categories.join(', ')} | Weight: {item.weight}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-skills-msg">No skills missing!</p>
                                )}
                            </div>
                        </div>

                        {/* 4. Irrelevant Pillar */}
                        <div className="bert-match-card">
                            <h3 className="category-label" style={{ color: '#475569', background: '#f1f5f9' }}>
                                <HelpCircle size={18} /> Unrelated Profile Skils
                            </h3>
                            <div className="skills-list" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                                {resumeOnly.length > 0 ? (
                                    resumeOnly.map((skill, i) => (
                                        <span key={i} className="skill-tag skill-pill-irrelevant" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="no-skills-msg">No extra skills detected.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Visualize Button Section */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3.5rem', position: 'relative' }}>
                        <button
                            className="btn-primary"
                            onClick={() => setShowVenn(!showVenn)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1.1rem 2.75rem',
                                borderRadius: '14px',
                                background: showVenn ? '#475569' : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                                border: 'none',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                boxShadow: showVenn ? '0 10px 20px rgba(0,0,0,0.1)' : '0 15px 30px -10px rgba(79, 70, 229, 0.5)',
                                zIndex: 10
                            }}
                        >
                            <BrainCircuit size={22} />
                            {showVenn ? 'Hide Alignment Overlap' : 'Visualize Match Overlap'}
                        </button>
                    </div>

                    {/* Venn Diagram Visualization (Enhanced) */}
                    {showVenn && (
                        <div className="fade-in" style={{
                            marginTop: '4rem',
                            padding: '4rem 2rem',
                            background: '#ffffff',
                            borderRadius: '40px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
                            animation: 'fadeIn 0.6s ease-out'
                        }}>
                            <h3 style={{ textAlign: 'center', marginBottom: '4rem', color: '#0f172a', fontWeight: '900', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                                Alignment Coverage Map
                            </h3>

                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'visible' }}>
                                <svg width="1000" height="650" viewBox="0 0 1000 650" style={{ overflow: 'visible' }}>
                                    <defs>
                                        <linearGradient id="jdGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 0.15 }} /> {/* Red representing Missing Demands */}
                                            <stop offset="100%" style={{ stopColor: '#b91c1c', stopOpacity: 0.08 }} />
                                        </linearGradient>
                                        <linearGradient id="resumeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.15 }} />
                                            <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 0.08 }} />
                                        </linearGradient>
                                        <filter id="vennShadowStrong" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                                            <feOffset dx="4" dy="4" result="offsetblur" />
                                            <feComponentTransfer>
                                                <feFuncA type="linear" slope="0.15" />
                                            </feComponentTransfer>
                                            <feMerge>
                                                <feMergeNode />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    {/* Left Circle - Job Description (Missing Needs) */}
                                    <circle cx="380" cy="325" r="280" fill="url(#jdGradient)" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="8,4" filter="url(#vennShadowStrong)" />

                                    {/* Right Circle - Resume Profile (Overlap + Extra) */}
                                    <circle cx="620" cy="325" r="280" fill="url(#resumeGradient)" stroke="#10b981" strokeWidth="2.5" strokeDasharray="8,4" filter="url(#vennShadowStrong)" />

                                    {/* Labels with enhanced typography */}
                                    <rect x="180" y="20" width="200" height="40" rx="20" fill="#fef2f2" />
                                    <text x="280" y="47" textAnchor="middle" style={{ fontSize: '1rem', fontWeight: 900, fill: '#991b1b', letterSpacing: '0.05em' }}>MISSING EXPECTATIONS</text>

                                    <rect x="620" y="20" width="200" height="40" rx="20" fill="#f1f5f9" />
                                    <text x="720" y="47" textAnchor="middle" style={{ fontSize: '1rem', fontWeight: 900, fill: '#065f46', letterSpacing: '0.05em' }}>RESUME PROFILE</text>

                                    {/* JD Only Missing Skills */}
                                    <foreignObject x="110" y="100" width="250" height="450">
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignContent: 'space-evenly', justifyContent: 'center', height: '100%', padding: '20px' }}>
                                            {jdOnly.slice(0, 12).map((s, i) => (
                                                <div key={i} style={{
                                                    background: 'rgba(239, 68, 68, 0.08)',
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(239, 68, 68, 0.15)',
                                                    color: '#991b1b',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '700',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                }}>{s}</div>
                                            ))}
                                            {jdOnly.length > 12 && (
                                                <button
                                                    onClick={() => setExpandedRegion(expandedRegion === 'jd' ? null : 'jd')}
                                                    style={{
                                                        color: '#ef4444', fontSize: '0.7rem', fontWeight: '800',
                                                        background: 'white', border: '1px solid #fca5a5',
                                                        padding: '4px 10px', borderRadius: '12px', cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                    }}>
                                                    {expandedRegion === 'jd' ? 'Close' : `+${jdOnly.length - 12} more`}
                                                </button>
                                            )}
                                        </div>
                                    </foreignObject>

                                    {/* Resume Only Extra Skills */}
                                    <foreignObject x="640" y="100" width="250" height="450">
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignContent: 'space-evenly', justifyContent: 'center', height: '100%', padding: '20px' }}>
                                            {resumeOnly.slice(0, 12).map((s, i) => (
                                                <div key={i} style={{
                                                    background: 'rgba(71, 85, 105, 0.08)',
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(71, 85, 105, 0.15)',
                                                    color: '#475569',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '700',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                }}>{s}</div>
                                            ))}
                                            {resumeOnly.length > 12 && (
                                                <button
                                                    onClick={() => setExpandedRegion(expandedRegion === 'resume' ? null : 'resume')}
                                                    style={{
                                                        color: '#475569', fontSize: '0.7rem', fontWeight: '800',
                                                        background: 'white', border: '1px solid #cbd5e1',
                                                        padding: '4px 10px', borderRadius: '12px', cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                    }}>
                                                    {expandedRegion === 'resume' ? 'Close' : `+${resumeOnly.length - 12} more`}
                                                </button>
                                            )}
                                        </div>
                                    </foreignObject>

                                    {/* Matched Intersection Box */}
                                    <foreignObject x="375" y="100" width="250" height="450">
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            alignContent: 'space-evenly',
                                            justifyContent: 'center',
                                            gap: '0.6rem',
                                            height: '100%',
                                            padding: '20px'
                                        }}>
                                            {matchedSkills.slice(0, 12).map((s, i) => {
                                                const isExact = exactMatchStrings.includes(s);
                                                return (
                                                    <div key={i} style={{
                                                        background: isExact ? '#dcfce7' : '#fef3c7',
                                                        color: isExact ? '#166534' : '#92400e',
                                                        padding: '4px 10px',
                                                        borderRadius: '10px',
                                                        border: isExact ? '1px solid #86efac' : '1px solid #fcd34d',
                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '800',
                                                        whiteSpace: 'nowrap'
                                                    }}>{s}</div>
                                                )
                                            })}
                                            {matchedSkills.length > 12 && (
                                                <button
                                                    onClick={() => setExpandedRegion(expandedRegion === 'matched' ? null : 'matched')}
                                                    style={{
                                                        color: '#6366f1', fontSize: '0.7rem', fontWeight: '900',
                                                        background: 'white', border: '1px solid #818cf8',
                                                        padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                                    }}>
                                                    {expandedRegion === 'matched' ? 'Hide Verified' : `+${matchedSkills.length - 12} Matches`}
                                                </button>
                                            )}
                                        </div>
                                    </foreignObject>

                                    {/* -------------------- EXPANDED CARDS & CONNECTING LINES -------------------- */}
                                    {expandedRegion === 'jd' && (
                                        <g style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                            <path d="M 110 325 Q 70 325 30 325" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" />
                                            <foreignObject x="-190" y="80" width="220" height="490">
                                                <div style={{
                                                    background: 'white', border: '2px solid #fecaca', borderRadius: '16px', padding: '15px',
                                                    height: '100%', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.1)',
                                                }}>
                                                    <h4 style={{ color: '#991b1b', fontSize: '0.85rem', marginBottom: '10px', textAlign: 'center', fontWeight: '800', borderBottom: '1px solid #fee2e2', paddingBottom: '8px' }}>All Missing Skills</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {jdOnly.map((s, i) => (
                                                            <div key={i} style={{ background: '#fef2f2', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', color: '#991b1b', fontWeight: '700' }}>{s}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </foreignObject>
                                        </g>
                                    )}

                                    {expandedRegion === 'resume' && (
                                        <g style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                            <path d="M 890 325 Q 930 325 970 325" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4,4" />
                                            <foreignObject x="970" y="80" width="220" height="490">
                                                <div style={{
                                                    background: 'white', border: '2px solid #cbd5e1', borderRadius: '16px', padding: '15px',
                                                    height: '100%', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(100, 116, 139, 0.1)',
                                                }}>
                                                    <h4 style={{ color: '#334155', fontSize: '0.85rem', marginBottom: '10px', textAlign: 'center', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>All Extra Skills</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {resumeOnly.map((s, i) => (
                                                            <div key={i} style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', color: '#475569', fontWeight: '700' }}>{s}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </foreignObject>
                                        </g>
                                    )}

                                    {expandedRegion === 'matched' && (
                                        <g style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                            <path d="M 500 570 Q 500 620 500 640" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4,4" />
                                            <foreignObject x="350" y="640" width="300" height="300">
                                                <div style={{
                                                    background: 'white', border: '2px solid #818cf8', borderRadius: '16px', padding: '15px',
                                                    maxHeight: '300px', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.15)',
                                                    position: 'relative'
                                                }}>
                                                    <h4 style={{ color: '#4338ca', fontSize: '0.85rem', marginBottom: '10px', textAlign: 'center', fontWeight: '800', borderBottom: '1px solid #e0e7ff', paddingBottom: '8px' }}>All Verified Matches</h4>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                                                        {matchedSkills.map((s, i) => {
                                                            const isExact = exactMatchStrings.includes(s);
                                                            return (
                                                                <div key={i} style={{
                                                                    background: isExact ? '#dcfce7' : '#fef3c7', color: isExact ? '#166534' : '#92400e',
                                                                    padding: '5px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '700',
                                                                    border: isExact ? '1px solid #86efac' : '1px solid #fcd34d'
                                                                }}>{s}</div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </foreignObject>
                                        </g>
                                    )}

                                </svg>
                            </div>

                            {/* Legend section */}
                            <div style={{
                                marginTop: '3rem',
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '3rem',
                                padding: '1.5rem',
                                background: '#f8fafc',
                                borderRadius: '20px',
                                border: '1px solid #f1f5f9'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '16px', height: '16px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '4px', border: '1.5px solid #ef4444' }}></div>
                                    <span style={{ color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Missing JD Skill</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '16px', height: '16px', background: 'rgba(71, 85, 105, 0.15)', borderRadius: '4px', border: '1.5px solid #94a3b8' }}></div>
                                    <span style={{ color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Non-Relevant Profile Skill</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: '4px' }}></div>
                                    <span style={{ color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Exact Verified Match</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: '4px' }}></div>
                                    <span style={{ color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Semantic/Conceptual Match</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default BertModal;
