import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle, X, FileText, FileSearch, BrainCircuit, Sparkles, BarChart3 } from 'lucide-react';
import SkillsModal from './SkillsModal';
import BertModal from './BertModal';
import VisualizationModal from './VisualizationModal';

const Preview = ({ data, hideActions = false }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
    const [isBertModalOpen, setIsBertModalOpen] = useState(false);
    const [isVizModalOpen, setIsVizModalOpen] = useState(false);

    const [isClosing, setIsClosing] = useState(false);
    const [isSkillsClosing, setIsSkillsClosing] = useState(false);
    const [isBertClosing, setIsBertClosing] = useState(false);
    const [isVizClosing, setIsVizClosing] = useState(false);

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const handlePrint = async () => {
        try {
            setIsGeneratingPDF(true);

            // POST the exact context data to the Python backend
            const response = await fetch('http://localhost:8000/export-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "PDF Export failed on server.");
            }

            // The backend returns a binary streaming response (the literal file)
            const blob = await response.blob();

            // Create an invisible anchor tag to trigger the browser's native download dialogue
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Resume_Analysis_Report_${data.domain || 'General'}.pdf`;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("An error occurred while generating the PDF: " + error.message);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

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

    const openVizModal = () => setIsVizModalOpen(true);
    const closeVizModal = () => {
        setIsVizClosing(true);
        setTimeout(() => {
            setIsVizModalOpen(false);
            setIsVizClosing(false);
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
        <div className="fade-in" style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e2e7f0'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '18px',
                border: '1px solid #e2e7f0',
                padding: '1.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #6a72ee 0%, #5863e7 100%)',
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #5e67e8'
                    }}>
                        <CheckCircle color="#ffffff" size={22} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: '#1f2632', fontSize: '1.15rem', fontWeight: '800' }}>Assessment Completed</h3>
                        <p style={{ margin: '4px 0 0', color: '#778095', fontSize: '0.95rem' }}>The analysis package is ready for review, visualization, and export.</p>
                    </div>
                </div>
                {!hideActions && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '0.85rem'
                    }}>
                    <button className="btn" onClick={handlePrint} disabled={isGeneratingPDF} style={{
                        gridColumn: '1 / -1', // Make this span all columns to stand out
                        padding: '0.95rem',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: isGeneratingPDF ? '#9ca3af' : 'linear-gradient(135deg, #666fea 0%, #5963e8 100%)',
                        boxShadow: isGeneratingPDF ? 'none' : '0 10px 16px -8px rgba(90, 99, 232, 0.5)',
                        border: 'none',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: isGeneratingPDF ? 'wait' : 'pointer'
                    }}>
                        <FileText size={20} />
                        {isGeneratingPDF ? 'Generating Executive PDF...' : 'Download Executive PDF Report'}
                    </button>
                    <button className="btn" onClick={openVizModal} style={{
                        padding: '0.9rem',
                        fontSize: '0.92rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: '#6b73ef',
                        boxShadow: '0 8px 14px -10px rgba(90, 99, 232, 0.48)',
                        border: 'none'
                    }}>
                        <BarChart3 size={20} />
                        Visual Analytics
                    </button>
                    <button className="btn" onClick={openBertModal} style={{
                        padding: '0.9rem',
                        fontSize: '0.92rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: '#5d66e8',
                        boxShadow: '0 8px 14px -10px rgba(90, 99, 232, 0.48)',
                        border: 'none'
                    }}>
                        <Sparkles size={20} />
                        Semantic Analysis
                    </button>
                    <button className="btn" onClick={openSkillsModal} style={{
                        padding: '0.9rem',
                        fontSize: '0.92rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: '#7078f1',
                        boxShadow: '0 8px 14px -10px rgba(90, 99, 232, 0.48)',
                        border: 'none'
                    }}>
                        <BrainCircuit size={20} />
                        Skills Mapping
                    </button>
                    <button className="btn" onClick={openModal} style={{
                        padding: '0.9rem',
                        fontSize: '0.92rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: '#f6f8fc',
                        border: '1px solid #dce2ec',
                        color: '#2f3748'
                    }}>
                        <FileSearch size={20} />
                        Source Content
                    </button>
                    </div>
                )}
            </div>

            {isModalOpen && ReactDOM.createPortal(modalContent, document.body)}
            <SkillsModal isOpen={isSkillsModalOpen} onClose={closeSkillsModal} isClosing={isSkillsClosing} data={data} />
            <BertModal isOpen={isBertModalOpen} onClose={closeBertModal} isClosing={isBertClosing} data={data} />
            <VisualizationModal isOpen={isVizModalOpen} onClose={closeVizModal} isClosing={isVizClosing} data={data} />
        </div>
    );
};

export default Preview;
