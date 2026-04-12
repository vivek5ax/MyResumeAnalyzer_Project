import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, FileText, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import FormalReport from './FormalReport';
import { apiUrl } from '../config/api';

const ReportModal = ({ isOpen, onClose, isClosing, data }) => {
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const reportRef = useRef(null);

    // Don't render anything if the modal is closed
    if (!isOpen) return null;

    const handlePrint = async () => {
        try {
            setIsGeneratingPDF(true);

            // POST the exact context data to the Python backend
            const response = await fetch(apiUrl('/export-pdf'), {
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

    const modalContent = (
        <div className={`modal-backdrop ${isClosing ? 'closing' : ''}`} onClick={(e) => {
            if (e.target.className.includes('modal-backdrop')) onClose();
        }}>
            {/* Wider modal for A4 aspect ratio visibility */}
            <div className="modal-content" style={{ maxWidth: '900px', width: '95vw', background: '#f8fafc', padding: 0 }}>
                {/* Header section identical to other modals, but stickied to top */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', borderRadius: '16px 16px 0 0', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#10b98115', padding: '10px', borderRadius: '10px' }}>
                            <FileText size={24} color="#10b981" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Executive Report Preview</h2>
                            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Review the layout before downloading.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            onClick={handlePrint}
                            disabled={isGeneratingPDF}
                            style={{
                                padding: '0.75rem 1.25rem',
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: isGeneratingPDF ? '#94a3b8' : '#10b981',
                                border: 'none',
                                color: 'white',
                                fontWeight: 'bold',
                                borderRadius: '8px',
                                cursor: isGeneratingPDF ? 'wait' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Download size={18} />
                            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                        </button>

                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Modal Body containing the Formal Report */}
                {/* Add a light gray background and some padding so the A4 white pages stand out like a real document preview */}
                <div style={{ padding: '2rem', background: '#e2e8f0', maxHeight: 'calc(90vh - 85px)', overflowY: 'auto' }}>
                    <div style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.1)', margin: '0 auto', maxWidth: '800px', background: '#ffffff' }}>
                        <FormalReport ref={reportRef} data={data} />
                    </div>
                </div>
            </div>
        </div>
    );

    // Render cleanly into the root DOM
    return ReactDOM.createPortal(modalContent, document.body);
};

export default ReportModal;
