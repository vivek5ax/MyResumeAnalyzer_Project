import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Code, Users, Briefcase, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const SkillsModal = ({ isOpen, onClose, isClosing, data }) => {
    if (!isOpen) return null;

    const resumeSkills = data.resume_skills || { technical_skills: [], soft_skills: [], categorized_skills: {} };
    const jdSkills = data.jd_skills || { technical_skills: [], soft_skills: [], categorized_skills: {} };

    // Normalize case for matching safely from string or object
    const normalize = (s) => (typeof s === 'object' ? s.skill : s)?.toLowerCase().trim() || "";
    const resumeFlat = (resumeSkills.technical_skills || []).map(normalize);

    const ComparisonCard = ({ category, jdItems }) => {
        // Find which items from this JD category are in the resume
        const matches = jdItems.filter(skill => resumeFlat.includes(normalize(skill)));
        const missing = jdItems.filter(skill => !resumeFlat.includes(normalize(skill)));

        // Find which items from the RESUME categorized_skills belong to this category (if any)
        const resumeInCategory = resumeSkills.categorized_skills?.[category] || [];

        return (
            <div className="comparison-card fade-in">
                <div className="card-header-refined">
                    <div className="card-title-refined">
                        <Code size={20} color="#4f46e5" />
                        {category}
                    </div>
                    <div className="stats-badges-refined">
                        <span className="stat-badge-refined stat-matched-refined">
                            Matched: {matches.length}
                        </span>
                        <span className="stat-badge-refined stat-missing-refined">
                            Missing: {missing.length}
                        </span>
                    </div>
                </div>

                <div className="comparison-columns-refined">
                    {/* Column 1: JD Requirements */}
                    <div>
                        <div className="skill-col-header-refined required-header">
                            <Briefcase size={14} />
                            Required in JD
                        </div>
                        <div className="skills-list">
                            {jdItems.map((skill, idx) => {
                                const isMatched = resumeFlat.includes(normalize(skill));
                                const skillName = typeof skill === 'object' ? skill.skill : skill;
                                return (
                                    <span
                                        key={idx}
                                        className={`skill-tag ${isMatched ? 'skill-tag-matched-refined tag-highlight-green-refined' : 'skill-tag-missing-refined'}`}
                                    >
                                        {isMatched && <CheckCircle2 size={14} style={{ marginRight: '6px' }} />}
                                        {skillName}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* Column 2: Resume Content */}
                    <div>
                        <div className="skill-col-header-refined found-header">
                            <Sparkles size={14} />
                            Found in Your Resume
                        </div>
                        <div className="skills-list">
                            {resumeInCategory.length > 0 ? (
                                resumeInCategory.map((skill, idx) => {
                                    const isRelevant = jdItems.map(normalize).includes(normalize(skill));
                                    const skillName = typeof skill === 'object' ? skill.skill : skill;
                                    return (
                                        <span
                                            key={idx}
                                            className={`skill-tag ${isRelevant ? 'skill-tag-matched-refined' : 'tech-tag'}`}
                                        >
                                            {isRelevant && <CheckCircle2 size={14} style={{ marginRight: '6px' }} />}
                                            {skillName}
                                        </span>
                                    );
                                })
                            ) : (
                                <span className="no-skills-msg" style={{ padding: '0.5rem' }}>No skills identified for this category in resume</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const modalContent = (
        <div className="modal-overlay">
            <div className={`modal-content modal-content-full ${isClosing ? 'slide-down' : ''}`}>

                {/* Header */}
                <div className="modal-header skills-modal-header" style={{ padding: '1.5rem 3rem' }}>
                    <div style={{ display: 'flex', gap: '5rem', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                                Skill Matching Breakdown
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '0.95rem', opacity: 0.9, fontWeight: '500' }}>
                                Side-by-side comparison of technical requirements and your qualifications
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '4rem' }}>
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', opacity: 0.7, letterSpacing: '0.1em' }}>Target Job</span>
                                <p style={{ margin: '2px 0 0', fontWeight: '600', fontSize: '1.1rem' }}>{data.jd_filename || "Manual Input"}</p>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', opacity: 0.7, letterSpacing: '0.1em' }}>Your Resume</span>
                                <p style={{ margin: '2px 0 0', fontWeight: '600', fontSize: '1.1rem' }}>{data.resume_filename || "Uploaded File"}</p>
                            </div>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', width: '48px', height: '48px' }}>
                        <X size={28} />
                    </button>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: '3rem', overflowY: 'auto', background: '#f1f5f9' }}>
                    <div className="comparison-grid" style={{ maxWidth: '1200px', margin: '0 auto' }}>

                        {/* Technical Categories from JD */}
                        {Object.entries(jdSkills.categorized_skills || {}).map(([category, skills]) => (
                            <ComparisonCard key={category} category={category} jdItems={skills} />
                        ))}

                        {/* Soft Skills Section (Special Card) */}
                        <div className="comparison-card fade-in" style={{ borderLeft: '6px solid #10b981' }}>
                            <div className="card-header-refined">
                                <div className="card-title-refined" style={{ color: '#059669' }}>
                                    <Users size={20} />
                                    Soft Skills & Competencies
                                </div>
                            </div>
                            <div className="comparison-columns-refined">
                                <div>
                                    <div className="skill-col-header-refined" style={{ color: '#059669' }}>Required in JD</div>
                                    <div className="skills-list">
                                        {(jdSkills.soft_skills || []).map((skill, idx) => (
                                            <span key={idx} className="skill-tag soft-tag">{typeof skill === 'object' ? skill.skill : skill}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="skill-col-header-refined" style={{ color: '#059669' }}>Found in Resume</div>
                                    <div className="skills-list">
                                        {(resumeSkills.soft_skills || []).map((skill, idx) => (
                                            <span key={idx} className="skill-tag soft-tag" style={{ background: '#dcfce7', borderColor: '#10b981', color: '#15803d' }}>
                                                <CheckCircle2 size={14} style={{ marginRight: '6px' }} />
                                                {typeof skill === 'object' ? skill.skill : skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Uncategorized Hardware/Other Skills from Resume */}
                        {Object.entries(resumeSkills.categorized_skills || {}).some(([cat]) => !jdSkills.categorized_skills?.[cat]) && (
                            <div className="comparison-card fade-in" style={{ borderLeft: '6px solid #64748b' }}>
                                <div className="card-header-refined">
                                    <div className="card-title-refined" style={{ color: '#475569' }}>
                                        <AlertCircle size={20} />
                                        Additional Capabilities (Not explicitly in JD)
                                    </div>
                                </div>
                                <div className="skills-list" style={{ padding: '0.5rem' }}>
                                    {Object.entries(resumeSkills.categorized_skills || {})
                                        .filter(([cat]) => !jdSkills.categorized_skills?.[cat])
                                        .map(([cat, skills]) => (
                                            <div key={cat} style={{ marginBottom: '1rem', width: '100%' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{cat}</div>
                                                <div className="skills-list">
                                                    {skills.map((skill, idx) => (
                                                        <span key={idx} className="skill-tag tech-tag" style={{ opacity: 0.8 }}>{typeof skill === 'object' ? skill.skill : skill}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default SkillsModal;
