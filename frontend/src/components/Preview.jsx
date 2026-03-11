import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CheckCircle, X, FileText, FileSearch, BrainCircuit, Sparkles, BarChart3 } from 'lucide-react';
import SkillsModal from './SkillsModal';
import BertModal from './BertModal';
import VisualizationModal from './VisualizationModal';

const Preview = ({ data }) => {
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
            marginTop: '3.5rem',
            paddingTop: '2.5rem',
            borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
            <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '24px',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        background: '#10b981',
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.4)'
                    }}>
                        <CheckCircle color="white" size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'white', fontSize: '1.4rem', fontWeight: '800' }}>Extraction Successful</h3>
                        <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '1rem' }}>Smart semantic analysis complete. Choose an action below to explore the results.</p>
                    </div>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.25rem'
                }}>
                    <button className="btn" onClick={handlePrint} disabled={isGeneratingPDF} style={{
                        gridColumn: '1 / -1', // Make this span all columns to stand out
                        padding: '1.1rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: isGeneratingPDF ? '#64748b' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: isGeneratingPDF ? 'none' : '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
                        border: 'none',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: isGeneratingPDF ? 'wait' : 'pointer'
                    }}>
                        <FileText size={20} />
                        {isGeneratingPDF ? 'Generating High-Quality Executive PDF...' : 'Download Executive PDF Report'}
                    </button>
                    <button className="btn" onClick={openVizModal} style={{
                        padding: '1.1rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                        boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
                        border: 'none'
                    }}>
                        <BarChart3 size={20} />
                        Visual Analysis
                    </button>
                    <button className="btn" onClick={openBertModal} style={{
                        padding: '1.1rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
                        boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.3)',
                        border: 'none'
                    }}>
                        <Sparkles size={20} />
                        BERT Analysis
                    </button>
                    <button className="btn" onClick={openSkillsModal} style={{
                        padding: '1.1rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)',
                        boxShadow: '0 10px 15px -3px rgba(6, 182, 212, 0.3)',
                        border: 'none'
                    }}>
                        <BrainCircuit size={20} />
                        Skills Extracted
                    </button>
                    <button className="btn" onClick={openModal} style={{
                        padding: '1.1rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#cbd5e1'
                    }}>
                        <FileSearch size={20} />
                        View Full Content
                    </button>
                </div>
            </div>

            {isModalOpen && ReactDOM.createPortal(modalContent, document.body)}
            <SkillsModal isOpen={isSkillsModalOpen} onClose={closeSkillsModal} isClosing={isSkillsClosing} data={data} />
            <BertModal isOpen={isBertModalOpen} onClose={closeBertModal} isClosing={isBertClosing} data={data} />
            <VisualizationModal isOpen={isVizModalOpen} onClose={closeVizModal} isClosing={isVizClosing} data={data} />
        </div>
    );
};

export default Preview;
