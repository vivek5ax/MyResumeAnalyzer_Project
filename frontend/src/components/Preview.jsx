import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle, X, FileText, FileSearch, BrainCircuit, Sparkles } from 'lucide-react';
import SkillsModal from './SkillsModal';
import BertModal from './BertModal';

const Preview = ({ data }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
    const [isBertModalOpen, setIsBertModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isSkillsClosing, setIsSkillsClosing] = useState(false);
    const [isBertClosing, setIsBertClosing] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setIsClosing(false);
        }, 500);
    };

    const openSkillsModal = () => setIsSkillsModalOpen(true);
    const closeSkillsModal = () => {
        setIsSkillsClosing(true);
        setTimeout(() => {
            setIsSkillsModalOpen(false);
            setIsSkillsClosing(false);
        }, 500);
    };

    const openBertModal = () => setIsBertModalOpen(true);
    const closeBertModal = () => {
        setIsBertClosing(true);
        setTimeout(() => {
            setIsBertModalOpen(false);
            setIsBertClosing(false);
        }, 500);
    };

    // ... (modalContent remains mostly same) ...
    const modalContent = isModalOpen && (
        <div className="modal-overlay">
            <div className={`modal-content ${isClosing ? 'slide-down' : ''}`}>
                <div className="modal-header" style={{ padding: '1rem 2rem' }}>
                    <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', opacity: 0.7, fontWeight: '600' }}>Extracted Preview</h2>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <div>
                                <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>JD Source</span>
                                <p style={{ margin: '2px 0 0', color: '#4f46e5', fontWeight: '600' }}>{data.jd_filename || "Manual Input"}</p>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Resume Source</span>
                                <p style={{ margin: '2px 0 0', color: '#4f46e5', fontWeight: '600' }}>{data.resume_filename || "Uploaded File"}</p>
                            </div>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={closeModal} style={{ background: '#e2e8f0', color: '#475569' }}>
                        <X size={24} />
                    </button>
                </div>
                <div className="split-view" style={{ padding: '2rem', gap: '2rem', background: '#f1f5f9' }}>
                    <div className="split-panel content-card">
                        <div className="panel-title"><FileSearch size={24} />Job Description</div>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#1e293b' }}>{data.job_description_text}</div>
                    </div>
                    <div className="split-panel content-card">
                        <div className="panel-title"><FileText size={24} />Resume Content</div>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#1e293b' }}>{data.resume_text}</div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fade-in" style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle color="var(--success)" size={24} style={{ marginRight: '0.5rem' }} />
                    <h3 style={{ margin: 0 }}>Extraction Successful</h3>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" onClick={openBertModal} style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem', background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' }}>
                        <Sparkles size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        BERT Analysis
                    </button>
                    <button className="btn" onClick={openSkillsModal} style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}>
                        <BrainCircuit size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Skills extracted
                    </button>
                    <button className="btn" onClick={openModal} style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>
                        View Full Content
                    </button>
                </div>
            </div>

            {isModalOpen && ReactDOM.createPortal(modalContent, document.body)}
            <SkillsModal
                isOpen={isSkillsModalOpen}
                onClose={closeSkillsModal}
                isClosing={isSkillsClosing}
                data={data}
            />
            <BertModal
                isOpen={isBertModalOpen}
                onClose={closeBertModal}
                isClosing={isBertClosing}
                data={data}
            />
        </div>
    );
};

export default Preview;
