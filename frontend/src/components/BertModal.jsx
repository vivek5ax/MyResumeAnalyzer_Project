import React from 'react';
import ReactDOM from 'react-dom';
import { X, Sparkles, CheckCircle, AlertCircle, HelpCircle, BrainCircuit, Target, AlertTriangle } from 'lucide-react';

const BertModal = ({ isOpen, onClose, isClosing, data, isEmbedded = false }) => {
    const [showVenn, setShowVenn] = React.useState(false);
    const [expandedRegion, setExpandedRegion] = React.useState(null);

    if (!isEmbedded && !isOpen) return null;

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

    // Filter long strings for Venn Diagram to prevent clipping/clutter
    const STR_LIMIT = 18;
    const CIRCLE_LIMIT = 10;

    const jdShort = jdOnly.filter(s => s.length <= STR_LIMIT);
    const jdLong = jdOnly.filter(s => s.length > STR_LIMIT);
    const jdVisible = jdShort.slice(0, CIRCLE_LIMIT);
    const jdToPopup = [...jdLong, ...jdShort.slice(CIRCLE_LIMIT)];

    const resumeShort = resumeOnly.filter(s => s.length <= STR_LIMIT);
    const resumeLong = resumeOnly.filter(s => s.length > STR_LIMIT);
    const resumeVisible = resumeShort.slice(0, CIRCLE_LIMIT);
    const resumeToPopup = [...resumeLong, ...resumeShort.slice(CIRCLE_LIMIT)];

    const matchedShort = matchedSkills.filter(s => s.length <= STR_LIMIT);
    const matchedLong = matchedSkills.filter(s => s.length > STR_LIMIT);
    const matchedVisible = matchedShort.slice(0, CIRCLE_LIMIT);
    const matchedToPopup = [...matchedLong, ...matchedShort.slice(CIRCLE_LIMIT)];


    const panelContent = (
        <div
            className={isEmbedded ? '' : `modal-content modal-content-full ${isClosing ? 'slide-down' : ''}`}
            style={{
                background: '#f8fafc',
                height: isEmbedded ? 'auto' : undefined,
                position: isEmbedded ? 'relative' : undefined,
                top: isEmbedded ? 'auto' : undefined,
                left: isEmbedded ? 'auto' : undefined,
                width: isEmbedded ? '100%' : undefined,
                maxWidth: isEmbedded ? '100%' : undefined,
                maxHeight: isEmbedded ? 'none' : undefined,
                borderRadius: isEmbedded ? '14px' : undefined,
                overflow: isEmbedded ? 'hidden' : undefined,
            }}
        >
                {/* Main Content Area */}
                <div style={{ padding: '1rem 1.2rem', height: isEmbedded ? 'auto' : 'calc(100vh - 20px)', maxHeight: isEmbedded ? 'none' : undefined, overflowY: isEmbedded ? 'visible' : 'auto' }}>

                    {/* Metrics Summary Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.2rem' }}>
                        <div style={{ background: 'white', padding: '0.7rem 0.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>JD Req</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>{summary.total_jd_skills}</span>
                        </div>
                        <div style={{ background: '#dcfce7', padding: '0.7rem 0.5rem', borderRadius: '12px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: '800', color: '#166534', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Exact</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#166534' }}>{summary.exact_match_count}</span>
                        </div>
                        <div style={{ background: '#fef3c7', padding: '0.7rem 0.5rem', borderRadius: '12px', border: '1px solid #fde68a', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: '800', color: '#92400e', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Semantic</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#92400e' }}>{summary.semantic_match_count}</span>
                        </div>
                        <div style={{ background: '#fee2e2', padding: '0.7rem 0.5rem', borderRadius: '12px', border: '1px solid #fecaca', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Missing</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#991b1b' }}>{summary.missing_skills_count}</span>
                        </div>
                    </div>

                    {/* Skill Classification Grid (4 Column Layout Now) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {/* 1. Exact Match Pillar */}
                        <div className="bert-match-card" style={{ padding: '0.2rem' }}>
                            <h3 className="category-label label-exact" style={{ color: '#166534', background: '#dcfce7', borderRadius: '10px', padding: '0.6rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #bbf7d0', fontSize: '0.85rem' }}>
                                <AlertCircle size={15} /> Exact Matches
                            </h3>
                            <div className="skills-list" style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '5px' }}>
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
                        <div className="bert-match-card" style={{ padding: '0.2rem' }}>
                            <h3 className="category-label label-semantic" style={{ color: '#92400e', background: '#fef3c7', borderRadius: '10px', padding: '0.6rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #fde68a', fontSize: '0.85rem' }}>
                                <Target size={15} /> Semantic Equivalents
                            </h3>
                            <div className="skills-list" style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                                {allSemanticMatches.length > 0 ? (
                                    allSemanticMatches.map((item, i) => (
                                        <div key={i} style={{
                                            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '0.4rem 0.5rem', marginBottom: '0.4rem',
                                            fontSize: '0.75rem', color: '#92400e', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                        }}>
                                            <strong style={{ fontSize: '0.75rem' }}>{item.skill}</strong>
                                            <div style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '1px' }}>Matches: {item.similar_to} ({(item.score * 100).toFixed(0)}%)</div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-skills-msg">No related semantics identified.</p>
                                )}
                            </div>
                        </div>

                        {/* 3. Missing Skills Pillar */}
                        <div className="bert-match-card" style={{ padding: '0.2rem' }}>
                            <h3 className="category-label label-irrelevant" style={{ color: '#991b1b', background: '#fee2e2', borderRadius: '10px', padding: '0.6rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #fecaca', fontSize: '0.85rem' }}>
                                <AlertTriangle size={15} /> Missing from Resume
                            </h3>
                            <div className="skills-list" style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                                {missingSkills.length > 0 ? (
                                    missingSkills.map((item, i) => (
                                        <div key={i} style={{
                                            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.4rem 0.5rem', marginBottom: '0.4rem',
                                            fontSize: '0.75rem', color: '#991b1b', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                        }}>
                                            <strong style={{ display: 'block', fontSize: '0.75rem' }}>{item.skill}</strong>
                                            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{item.categories.join(', ')} | Weight: {item.weight}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-skills-msg">No skills missing!</p>
                                )}
                            </div>
                        </div>

                        {/* 4. Irrelevant Pillar */}
                        <div className="bert-match-card" style={{ padding: '0.2rem' }}>
                            <h3 className="category-label" style={{ color: '#475569', background: '#f1f5f9', borderRadius: '10px', padding: '0.6rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                                <HelpCircle size={15} /> Unrelated Profile Skils
                            </h3>
                            <div className="skills-list" style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.2rem', position: 'relative' }}>
                        <button
                            className="btn-primary"
                            onClick={() => setShowVenn(!showVenn)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.9rem 2.2rem',
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
                            marginTop: '2.5rem',
                            padding: '2.5rem 1.5rem',
                            background: '#ffffff',
                            borderRadius: '40px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
                            animation: 'fadeIn 0.6s ease-out'
                        }}>
                            <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#0f172a', fontWeight: '900', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                                Alignment Coverage Map
                            </h3>

                            {/* Legend section moved to TOP */}
                            <div style={{
                                marginBottom: '2.5rem',
                                display: 'flex',
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                                gap: '2rem',
                                padding: '1rem',
                                background: '#f8fafc',
                                borderRadius: '16px',
                                border: '1px solid #f1f5f9'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: '14px', height: '14px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '4px', border: '1.5px solid #ef4444' }}></div>
                                    <span style={{ color: '#475569', fontWeight: '700', fontSize: '0.8rem' }}>Missing JD Skill</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: '14px', height: '14px', background: 'rgba(71, 85, 105, 0.15)', borderRadius: '4px', border: '1.5px solid #94a3b8' }}></div>
                                    <span style={{ color: '#475569', fontWeight: '700', fontSize: '0.8rem' }}>Non-Relevant Profile Skill</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: '14px', height: '14px', background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: '4px' }}></div>
                                    <span style={{ color: '#475569', fontWeight: '700', fontSize: '0.8rem' }}>Exact Verified Match</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: '14px', height: '14px', background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: '4px' }}></div>
                                    <span style={{ color: '#475569', fontWeight: '700', fontSize: '0.8rem' }}>Semantic Conceptual Match</span>
                                </div>
                            </div>

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
                                    <circle cx="410" cy="325" r="210" fill="url(#jdGradient)" stroke="#ef4444" strokeWidth="1.8" strokeDasharray="8,4" filter="url(#vennShadowStrong)" />

                                    {/* Right Circle - Resume Profile (Overlap + Extra) */}
                                    <circle cx="590" cy="325" r="210" fill="url(#resumeGradient)" stroke="#10b981" strokeWidth="1.8" strokeDasharray="8,4" filter="url(#vennShadowStrong)" />

                                    {/* Labels with enhanced typography */}
                                    <rect x="230" y="20" width="160" height="32" rx="16" fill="#fef2f2" />
                                    <text x="310" y="41" textAnchor="middle" style={{ fontSize: '0.75rem', fontWeight: 900, fill: '#991b1b', letterSpacing: '0.04em' }}>MISSING EXPECTATIONS</text>

                                    <rect x="610" y="20" width="160" height="32" rx="16" fill="#f1f5f9" />
                                    <text x="690" y="41" textAnchor="middle" style={{ fontSize: '0.75rem', fontWeight: 900, fill: '#065f46', letterSpacing: '0.04em' }}>RESUME PROFILE</text>

                                    {/* JD Only Missing Skills - Dynamic sizing */}
                                    <foreignObject x="230" y="135" width="160" height="350">
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'center', alignItems: 'flex-start', height: '100%', padding: '10px', overflow: 'hidden' }}>
                                            {jdVisible.map((s, i) => {
                                                const fontSize = jdOnly.length > 20 ? '0.55rem' : jdOnly.length > 12 ? '0.58rem' : '0.62rem';
                                                const padding = jdOnly.length > 20 ? '2px 5px' : '2px 7px';
                                                return (
                                                    <div key={i} style={{
                                                        background: 'rgba(239, 68, 68, 0.08)',
                                                        padding: padding,
                                                        borderRadius: '4px',
                                                        border: '1px solid rgba(239, 68, 68, 0.12)',
                                                        color: '#991b1b',
                                                        fontSize: fontSize,
                                                        fontWeight: '700',
                                                        boxShadow: '0 1px 1px rgba(0,0,0,0.01)',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        maxWidth: '90%'
                                                    }}>{s}</div>
                                                );
                                            })}
                                            {jdToPopup.length > 0 && (
                                                <button
                                                    onClick={() => setExpandedRegion(expandedRegion === 'jd' ? null : 'jd')}
                                                    style={{
                                                        color: '#ef4444', fontSize: '0.7rem', fontWeight: '800',
                                                        background: 'white', border: '1px solid #fca5a5',
                                                        padding: '4px 10px', borderRadius: '12px', cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                    }}>
                                                    {expandedRegion === 'jd' ? 'Close' : `+${jdToPopup.length} more`}
                                                </button>
                                            )}
                                        </div>
                                    </foreignObject>

                                    {/* Resume Only Extra Skills - Dynamic sizing */}
                                    <foreignObject x="610" y="135" width="160" height="350">
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'center', alignItems: 'flex-start', height: '100%', padding: '10px', overflow: 'hidden' }}>
                                            {resumeVisible.map((s, i) => {
                                                const fontSize = resumeOnly.length > 20 ? '0.55rem' : resumeOnly.length > 12 ? '0.58rem' : '0.62rem';
                                                const padding = resumeOnly.length > 20 ? '2px 5px' : '2px 7px';
                                                return (
                                                    <div key={i} style={{
                                                        background: 'rgba(71, 85, 105, 0.08)',
                                                        padding: padding,
                                                        borderRadius: '4px',
                                                        border: '1px solid rgba(71, 85, 105, 0.12)',
                                                        color: '#475569',
                                                        fontSize: fontSize,
                                                        fontWeight: '700',
                                                        boxShadow: '0 1px 1px rgba(0,0,0,0.01)',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        maxWidth: '90%'
                                                    }}>{s}</div>
                                                );
                                            })}
                                            {resumeToPopup.length > 0 && (
                                                <button
                                                    onClick={() => setExpandedRegion(expandedRegion === 'resume' ? null : 'resume')}
                                                    style={{
                                                        color: '#475569', fontSize: '0.7rem', fontWeight: '800',
                                                        background: 'white', border: '1px solid #cbd5e1',
                                                        padding: '4px 10px', borderRadius: '12px', cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                    }}>
                                                    {expandedRegion === 'resume' ? 'Close' : `+${resumeToPopup.length} more`}
                                                </button>
                                            )}
                                        </div>
                                    </foreignObject>

                                    {/* Matched Intersection Box - Dynamic sizing */}
                                    <foreignObject x="420" y="135" width="160" height="350">
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            justifyContent: 'center',
                                            alignItems: 'flex-start',
                                            gap: '0.35rem',
                                            height: '100%',
                                            padding: '10px',
                                            overflow: 'hidden'
                                        }}>
                                            {matchedVisible.map((s, i) => {
                                                const isExact = exactMatchStrings.includes(s);
                                                const fontSize = matchedSkills.length > 20 ? '0.55rem' : matchedSkills.length > 12 ? '0.58rem' : '0.62rem';
                                                const padding = matchedSkills.length > 20 ? '2px 5px' : '2px 7px';
                                                return (
                                                    <div key={i} style={{
                                                        background: isExact ? '#dcfce7' : '#fef3c7',
                                                        color: isExact ? '#166534' : '#92400e',
                                                        padding: padding,
                                                        borderRadius: '5px',
                                                        border: isExact ? '1px solid #86efac' : '1px solid #fcd34d',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                                        fontSize: fontSize,
                                                        fontWeight: '800',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        maxWidth: '90%'
                                                    }}>{s}</div>
                                                );
                                            })}
                                            {matchedToPopup.length > 0 && (
                                                <button
                                                    onClick={() => setExpandedRegion(expandedRegion === 'matched' ? null : 'matched')}
                                                    style={{
                                                        color: '#6366f1', fontSize: '0.7rem', fontWeight: '900',
                                                        background: 'white', border: '1px solid #818cf8',
                                                        padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                                    }}>
                                                    {expandedRegion === 'matched' ? 'Hide Verified' : `+${matchedToPopup.length} Matches`}
                                                </button>
                                            )}
                                        </div>
                                    </foreignObject>

                                    {/* -------------------- EXPANDED CARDS & CONNECTING LINES -------------------- */}
                                    {expandedRegion === 'jd' && (
                                        <g style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                            {/* Anchor point at start of arrow */}
                                            <circle cx="215" cy="325" r="3" fill="#ef4444" opacity="0.6" />
                                            {/* Curved dotted line toward left popup */}
                                            <path d="M 215 325 Q 160 325, 120 180" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,4" />
                                            {/* Arrow head landing at edge of pop-up */}
                                            <polygon points="115,190 120,180 125,190" fill="#ef4444" opacity="0.6" />
                                            <foreignObject x="40" y="115" width="180" height="380">
                                                <div style={{
                                                    background: 'linear-gradient(135deg, #ffffff 0%, #fff5f5 100%)', border: '1.5px solid #fecaca', borderRadius: '14px', padding: '10px',
                                                    maxHeight: '340px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.1)',
                                                }}>
                                                    <h4 style={{ color: '#b91c1c', fontSize: '0.8rem', marginBottom: '8px', textAlign: 'center', fontWeight: '900', borderBottom: '1px solid #fee2e2', paddingBottom: '6px' }}>Additional Missing</h4>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                                                        {jdToPopup.map((s, i) => (
                                                            <div key={i} style={{ background: '#fef2f2', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', color: '#991b1b', fontWeight: '800', border: '1px solid #fca5a5' }}>{s}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </foreignObject>
                                        </g>
                                    )}

                                    {expandedRegion === 'resume' && (
                                        <g style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                            {/* Anchor point at start of arrow */}
                                            <circle cx="785" cy="325" r="3" fill="#64748b" opacity="0.6" />
                                            {/* Curved dotted line toward right popup */}
                                            <path d="M 785 325 Q 840 325, 870 180" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />
                                            {/* Arrow head landing at edge of pop-up */}
                                            <polygon points="865,190 870,180 875,190" fill="#64748b" opacity="0.6" />
                                            <foreignObject x="780" y="115" width="180" height="380">
                                                <div style={{
                                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '10px',
                                                    maxHeight: '340px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(100, 116, 139, 0.1)',
                                                }}>
                                                    <h4 style={{ color: '#334155', fontSize: '0.8rem', marginBottom: '8px', textAlign: 'center', fontWeight: '900', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>Additional Profile</h4>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                                                        {resumeToPopup.map((s, i) => (
                                                            <div key={i} style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', color: '#475569', fontWeight: '800', border: '1px solid #cbd5e1' }}>{s}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </foreignObject>
                                        </g>
                                    )}

                                    {expandedRegion === 'matched' && (
                                        <g style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                            {/* Anchor point at start of arrow from intersection bottom */}
                                            <circle cx="500" cy="480" r="3" fill="#6366f1" opacity="0.6" />
                                            {/* Curved dotted arrow from intersection bottom around to popup */}
                                            <path d="M 500 480 Q 750 480, 880 180" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4,4" />
                                            {/* Arrow head landing at edge of pop-up */}
                                            <polygon points="875,190 880,180 885,190" fill="#6366f1" opacity="0.6" />
                                            
                                            {/* Expanded Matched Skills Popup - Right side */}
                                            <foreignObject x="790" y="115" width="180" height="400">
                                                <div style={{
                                                    background: 'linear-gradient(135deg, #ffffff 0%, #f5f7ff 100%)',
                                                    border: '1.5px solid #818cf8',
                                                    borderRadius: '14px',
                                                    padding: '10px',
                                                    maxHeight: '350px',
                                                    overflowY: 'auto',
                                                    boxShadow: '0 12px 20px -5px rgba(99, 102, 241, 0.1)',
                                                    position: 'relative'
                                                }}>
                                                    <h4 style={{ color: '#4338ca', fontSize: '0.8rem', marginBottom: '8px', textAlign: 'center', fontWeight: '900', letterSpacing: '0.02em', borderBottom: '1px solid #e0e7ff', paddingBottom: '6px' }}>More Matches</h4>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                                                        {matchedToPopup.length > 0 ? (matchedToPopup.map((s, i) => {
                                                            const isExact = exactMatchStrings.includes(s);
                                                            return (
                                                                <div key={i} style={{
                                                                    background: isExact ? '#dcfce7' : '#fef3c7',
                                                                    color: isExact ? '#166534' : '#92400e',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: '800',
                                                                    border: isExact ? '1.2px solid #86efac' : '1.2px solid #fcd34d',
                                                                    boxShadow: isExact ? '0 1px 4px rgba(16, 185, 129, 0.05)' : '0 1px 4px rgba(245, 158, 11, 0.05)',
                                                                    transition: 'all 0.2s ease',
                                                                    cursor: 'default'
                                                                }}>{s}</div>
                                                            );
                                                        })) : (
                                                            <div style={{ color: '#a5b4fc', textAlign: 'center', fontSize: '0.7rem', padding: '10px', fontStyle: 'italic' }}>All skills visible</div>
                                                        )
                                                        }
                                                    </div>
                                                </div>
                                            </foreignObject>
                                        </g>
                                    )}

                                </svg>
                            </div>
                        </div>
                    )}
                </div>
            </div>
    );

    if (isEmbedded) {
        return panelContent;
    }

    const modalContent = (
        <div className="modal-overlay">
            {panelContent}
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default BertModal;
