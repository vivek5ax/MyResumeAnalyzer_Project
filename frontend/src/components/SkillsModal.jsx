import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Code, Users, Briefcase, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const SkillsModal = ({ isOpen, onClose, isClosing, data, isEmbedded = false }) => {
    if (!isEmbedded && !isOpen) return null;

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
            <div className="comparison-card fade-in" style={{ padding: '0.8rem' }}>
                <div className="card-header-refined" style={{ marginBottom: '0.6rem' }}>
                    <div className="card-title-refined" style={{ fontSize: '0.85rem' }}>
                        <Code size={16} color="#4f46e5" />
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
                        <div className="skill-col-header-refined required-header" style={{ fontSize: '0.7rem' }}>
                            <Briefcase size={12} />
                            Required in JD
                        </div>
                        <div className="skills-list" style={{ maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
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
                        <div className="skill-col-header-refined found-header" style={{ fontSize: '0.7rem' }}>
                            <Sparkles size={12} />
                            Found in Your Resume
                        </div>
                        <div className="skills-list" style={{ maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
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

    const panelContent = (
        <div
            className={isEmbedded ? '' : `modal-content modal-content-full ${isClosing ? 'slide-down' : ''}`}
            style={{
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

                {/* Content Area */}
                <div style={{ flex: 1, padding: '1rem 1.2rem', overflowY: isEmbedded ? 'visible' : 'auto', background: 'linear-gradient(135deg, #f0f9ff 0%, #eff6ff 100%)', maxHeight: isEmbedded ? 'none' : undefined }}>
                    <div className="comparison-grid" style={{ maxWidth: '100%', margin: '0 auto' }}>

                        {/* Technical Categories from JD */}
                        {Object.entries(jdSkills.categorized_skills || {}).map(([category, skills]) => (
                            <ComparisonCard key={category} category={category} jdItems={skills} />
                        ))}

                        {/* Soft Skills Section (Special Card) */}
                        <div className="comparison-card fade-in" style={{ borderLeft: '6px solid #10b981', padding: '0.5rem 0.6rem' }}>
                            <div className="card-header-refined" style={{ marginBottom: '0.4rem' }}>
                                <div className="card-title-refined" style={{ color: '#059669', fontSize: '0.75rem' }}>
                                    <Users size={16} />
                                    Soft Skills & Competencies
                                </div>
                            </div>
                            <div className="comparison-columns-refined">
                                <div>
                                    <div className="skill-col-header-refined" style={{ color: '#059669' }}>Required in JD</div>
                                    <div className="skills-list" style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {(jdSkills.soft_skills || []).map((skill, idx) => (
                                            <span key={idx} className="skill-tag soft-tag">{typeof skill === 'object' ? skill.skill : skill}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="skill-col-header-refined" style={{ color: '#059669' }}>Found in Resume</div>
                                    <div className="skills-list" style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
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
                            <div className="comparison-card fade-in" style={{ borderLeft: '6px solid #64748b', padding: '0.5rem 0.6rem' }}>
                                <div className="card-header-refined" style={{ marginBottom: '0.4rem' }}>
                                    <div className="card-title-refined" style={{ color: '#475569', fontSize: '0.75rem' }}>
                                        <AlertCircle size={16} />
                                        Additional Capabilities (Not explicitly in JD)
                                    </div>
                                </div>
                                <div className="skills-list" style={{ padding: '0.5rem' }}>
                                    {Object.entries(resumeSkills.categorized_skills || {})
                                        .filter(([cat]) => !jdSkills.categorized_skills?.[cat])
                                        .map(([cat, skills]) => (
                                            <div key={cat} style={{ marginBottom: '1rem', width: '100%' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{cat}</div>
                                                <div className="skills-list" style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
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

export default SkillsModal;
