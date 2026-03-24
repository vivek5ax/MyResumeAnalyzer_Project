import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, BrainCircuit, Sparkles } from 'lucide-react';
import BertModal from './BertModal';
import SkillsModal from './SkillsModal';

const SkillMatchingModal = ({ isOpen, onClose, isClosing, data, isEmbedded = false }) => {
    const [activeView, setActiveView] = useState('bert');

    if (!isEmbedded && !isOpen) return null;

    const panelContent = (
            <div
                className={isEmbedded ? '' : `modal-content modal-content-full ${isClosing ? 'slide-down' : ''}`}
                style={{
                    background: '#eef2f7',
                    height: isEmbedded ? 'auto' : undefined,
                    borderRadius: isEmbedded ? '16px' : undefined,
                    border: isEmbedded ? '1px solid #dbe3ee' : undefined,
                    boxShadow: isEmbedded ? '0 20px 30px -24px rgba(33, 46, 72, 0.45)' : undefined,
                    overflow: isEmbedded ? 'hidden' : undefined,
                    position: isEmbedded ? 'relative' : undefined,
                    top: isEmbedded ? 'auto' : undefined,
                    left: isEmbedded ? 'auto' : undefined,
                    width: isEmbedded ? '100%' : undefined,
                    maxWidth: isEmbedded ? '100%' : undefined,
                    maxHeight: isEmbedded ? 'none' : undefined,
                }}
            >
                <div className="modal-header" style={{
                    padding: '0.6rem 1rem',
                    background: '#ffffff',
                    borderBottom: '1px solid #dbe3ee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                    </div>
                    {!isEmbedded && (
                        <button className="modal-close-btn" onClick={onClose} style={{ background: '#e2e8f0', color: '#475569' }}>
                            <X size={22} />
                        </button>
                    )}
                </div>

                <div style={{ padding: '0.6rem 0.8rem 0.4rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn"
                        onClick={() => setActiveView('bert')}
                        style={{
                            padding: '0.5rem 0.8rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            border: activeView === 'bert' ? '1px solid #4f46e5' : '1px solid #cbd5e1',
                            background: activeView === 'bert' ? '#4f46e5' : '#ffffff',
                            color: activeView === 'bert' ? '#ffffff' : '#334155',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        <Sparkles size={14} />
                        BERT Skill Matching
                    </button>

                    <button
                        className="btn"
                        onClick={() => setActiveView('spacy')}
                        style={{
                            padding: '0.5rem 0.8rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            border: activeView === 'spacy' ? '1px solid #4f46e5' : '1px solid #cbd5e1',
                            background: activeView === 'spacy' ? '#4f46e5' : '#ffffff',
                            color: activeView === 'spacy' ? '#ffffff' : '#334155',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        <BrainCircuit size={14} />
                        Spacy Skill Matching
                    </button>
                </div>

                <div style={{ height: isEmbedded ? 'auto' : 'calc(100vh - 100px)', overflowY: isEmbedded ? 'visible' : 'auto', padding: '0.8rem 0' }}>
                    {activeView === 'bert' ? (
                        <BertModal isEmbedded={true} data={data} />
                    ) : (
                        <SkillsModal isEmbedded={true} data={data} />
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

export default SkillMatchingModal;
