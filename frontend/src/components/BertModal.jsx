import React from 'react';
import ReactDOM from 'react-dom';
import { X, Sparkles, CheckCircle, AlertCircle, HelpCircle, BrainCircuit } from 'lucide-react';

const BertModal = ({ isOpen, onClose, isClosing, data }) => {
    const [showVenn, setShowVenn] = React.useState(false);

    if (!isOpen) return null;

    console.log("BertModal Received Data:", data);

    const bertResults = data.bert_results || {
        exact_match: [],
        partial_match: [],
        irrelevant: [],
        jd_bert_skills: [],
        resume_bert_skills: []
    };

    // Calculate Venn Logic
    const matchedSkills = [...bertResults.exact_match, ...bertResults.partial_match];
    const jdOnly = bertResults.jd_bert_skills.filter(s =>
        !matchedSkills.some(m => m.toLowerCase() === s.toLowerCase())
    );
    const resumeOnly = bertResults.irrelevant;

    console.log("BertResults parsed:", bertResults);

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
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>BERT Semantic Analysis</h2>
                            <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Intelligent Skill Classification & Verification</p>
                        </div>
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
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b' }}>{bertResults.jd_bert_skills.length}</span>
                        </div>
                        <div style={{ background: '#dcfce7', padding: '1.25rem', borderRadius: '16px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#166534', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Exact Matches</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#166534' }}>{bertResults.exact_match.length}</span>
                        </div>
                        <div style={{ background: '#fef3c7', padding: '1.25rem', borderRadius: '16px', border: '1px solid #fde68a', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#92400e', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Related Skills</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#92400e' }}>{bertResults.partial_match.length}</span>
                        </div>
                        <div style={{ background: '#f1f5f9', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Unrelated</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#475569' }}>{bertResults.irrelevant.length}</span>
                        </div>
                    </div>

                    {/* Skill Classification Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                        {/* 1. Exact Match Pillar */}
                        <div className="bert-match-card">
                            <h3 className="category-label label-exact" style={{ color: '#166534' }}>
                                <CheckCircle size={18} /> Exact Match
                            </h3>
                            <div className="skills-list">
                                {bertResults.exact_match.length > 0 ? (
                                    bertResults.exact_match.map((skill, i) => (
                                        <span key={i} className="skill-tag skill-pill-exact">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="no-skills-msg">No exact matches found.</p>
                                )}
                            </div>
                        </div>

                        {/* 2. Partial Match Pillar */}
                        <div className="bert-match-card">
                            <h3 className="category-label label-partial" style={{ color: '#92400e' }}>
                                <AlertCircle size={18} /> Partial Match
                            </h3>
                            <div className="skills-list">
                                {bertResults.partial_match.length > 0 ? (
                                    bertResults.partial_match.map((skill, i) => (
                                        <span key={i} className="skill-tag skill-pill-partial">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="no-skills-msg">No related skills identified.</p>
                                )}
                            </div>
                        </div>

                        {/* 3. Irrelevant Pillar */}
                        <div className="bert-match-card">
                            <h3 className="category-label label-irrelevant" style={{ color: '#64748b' }}>
                                <HelpCircle size={18} /> Irrelevant Skill
                            </h3>
                            <div className="skills-list">
                                {bertResults.irrelevant.length > 0 ? (
                                    bertResults.irrelevant.map((skill, i) => (
                                        <span key={i} className="skill-tag skill-pill-irrelevant">
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
                            {showVenn ? 'Hide Deep Insights' : 'Visualize Skill Alignment'}
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
                                Semantic Alignment Distribution
                            </h3>

                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'visible' }}>
                                <svg width="1000" height="650" viewBox="0 0 1000 650" style={{ overflow: 'visible' }}>
                                    <defs>
                                        <linearGradient id="jdGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 0.15 }} />
                                            <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.08 }} />
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

                                    {/* Left Circle - Job Description (Radius increased to 280) */}
                                    <circle cx="380" cy="325" r="280" fill="url(#jdGradient)" stroke="#4f46e5" strokeWidth="2.5" strokeDasharray="8,4" filter="url(#vennShadowStrong)" />

                                    {/* Right Circle - Resume Profile (Radius increased to 280) */}
                                    <circle cx="620" cy="325" r="280" fill="url(#resumeGradient)" stroke="#10b981" strokeWidth="2.5" strokeDasharray="8,4" filter="url(#vennShadowStrong)" />

                                    {/* Labels with enhanced typography */}
                                    <rect x="180" y="20" width="200" height="40" rx="20" fill="#f1f5f9" />
                                    <text x="280" y="47" textAnchor="middle" style={{ fontSize: '1rem', fontWeight: 900, fill: '#1e40af', letterSpacing: '0.05em' }}>JOB REQUIREMENTS</text>

                                    <rect x="620" y="20" width="200" height="40" rx="20" fill="#f1f5f9" />
                                    <text x="720" y="47" textAnchor="middle" style={{ fontSize: '1rem', fontWeight: 900, fill: '#065f46', letterSpacing: '0.05em' }}>RESUME PROFILE</text>

                                    {/* JD Only Skills (Left Area) - Expanded fit */}
                                    <foreignObject x="140" y="100" width="220" height="450">
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '20px' }}>
                                            {jdOnly.slice(0, 15).map((s, i) => (
                                                <div key={i} style={{
                                                    background: 'rgba(79, 70, 229, 0.08)',
                                                    padding: '5px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(79, 70, 229, 0.15)',
                                                    color: '#1e40af',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                }}>{s}</div>
                                            ))}
                                            {jdOnly.length > 15 && <div style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: '800' }}>+{jdOnly.length - 15} more</div>}
                                        </div>
                                    </foreignObject>

                                    {/* Resume Only Skills (Right Area) - Expanded fit */}
                                    <foreignObject x="640" y="100" width="220" height="450">
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '20px' }}>
                                            {resumeOnly.slice(0, 15).map((s, i) => (
                                                <div key={i} style={{
                                                    background: 'rgba(16, 185, 129, 0.08)',
                                                    padding: '5px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(16, 185, 129, 0.15)',
                                                    color: '#065f46',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                }}>{s}</div>
                                            ))}
                                            {resumeOnly.length > 15 && <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '800' }}>+{resumeOnly.length - 15} more</div>}
                                        </div>
                                    </foreignObject>

                                    {/* Intersection - Matched Skills (Center Expansion) */}
                                    <foreignObject x="400" y="80" width="200" height="490">
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '0.65rem',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: '100%',
                                            color: '#1e293b',
                                            fontSize: '0.8rem',
                                            fontWeight: '800',
                                            padding: '10px'
                                        }}>
                                            {matchedSkills.slice(0, 18).map((s, i) => (
                                                <div key={i} style={{
                                                    background: bertResults.exact_match.includes(s) ? '#dcfce7' : '#fef3c7',
                                                    color: bertResults.exact_match.includes(s) ? '#166534' : '#92400e',
                                                    padding: '5px 12px',
                                                    borderRadius: '10px',
                                                    border: bertResults.exact_match.includes(s) ? '1px solid #86efac' : '1px solid #fcd34d',
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                                    animation: bertResults.exact_match.includes(s) ? 'match-pulse-exact 3s infinite' : 'none',
                                                    whiteSpace: 'nowrap'
                                                }}>{s}</div>
                                            ))}
                                            {matchedSkills.length > 18 && <div style={{
                                                color: '#6366f1',
                                                fontSize: '0.75rem',
                                                fontWeight: '900',
                                                background: 'white',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                border: '1px solid #e2e8f0'
                                            }}>+{matchedSkills.length - 18} Verified</div>}
                                        </div>
                                    </foreignObject>
                                </svg>
                            </div>

                            {/* Legend section with refined styles */}
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
                                    <div style={{ width: '16px', height: '16px', background: 'rgba(79, 70, 229, 0.15)', borderRadius: '4px', border: '1.5px solid #4f46e5' }}></div>
                                    <span style={{ color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Required but Missing</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '16px', height: '16px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '4px', border: '1.5px solid #10b981' }}></div>
                                    <span style={{ color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Extra Resume Skills</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: '4px' }}></div>
                                    <span style={{ color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Perfect Match</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: '4px' }}></div>
                                    <span style={{ color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Conceptually Related</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Engineering Insights Box */}
                    <div style={{ marginTop: '3rem', padding: '2rem', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1e293b', fontSize: '1.1rem' }}>
                            <BrainCircuit size={22} color="#6366f1" /> Advanced Semantic Insights
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem', fontSize: '0.95rem', color: '#64748b', lineHeight: '1.6' }}>
                            <div>
                                <p style={{ marginBottom: '1rem' }}><strong>Exact Match:</strong> These are skills from your resume that directly align with the Job Description's requirements. These are core strengths for this specific role.</p>
                                <p><strong>Partial Match:</strong> BERT has identified a strong conceptual link (Sim ≥ 0.65) between your skill and a JD requirement. This indicates cross-functional capability even if terminology differs.</p>
                            </div>
                            <div style={{ paddingLeft: '2rem', borderLeft: '1px solid #f1f5f9' }}>
                                <p style={{ marginBottom: '1rem' }}><strong>Irrelevant Skills:</strong> Valid skills found in your resume, but they do not add direct value or matching score for this specific application.</p>
                                <p style={{ fontSize: '0.85rem', fontStyle: 'italic', background: '#f8fafc', padding: '0.75rem', borderRadius: '10px' }}>
                                    Matching score is calculated by comparing your semantic profile directly against JD requirements, ignoring external taxonomy noise.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default BertModal;
