import React, { useState, useRef, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ResumePDFReport from './ResumePDFReport';

const PDFReportViewer = ({ 
  analysisData, 
  isOpen, 
  onClose, 
  isLoading = false,
  onProgressChange = null,
  onGenerationComplete = null
}) => {
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isPdfReady, setIsPdfReady] = useState(false);
  const downloadLinkRef = useRef();

  // Track PDF generation progress with simulated steps
  useEffect(() => {
    if (isOpen && !isPdfReady) {
      setCurrentProgress(0);
      setPdfBlob(null);
      setPdfError(null);
      
      // Simulate progress steps
      const timeouts = [];
      
      const steps = [
        { delay: 500, progress: 15, label: 'Formatting document...' },
        { delay: 1200, progress: 30, label: 'Generating charts...' },
        { delay: 1900, progress: 50, label: 'Building pages...' },
        { delay: 2600, progress: 75, label: 'Compiling report...' },
      ];

      steps.forEach(({ delay, progress, label }) => {
        const timeout = setTimeout(() => {
          setCurrentProgress(progress);
          onProgressChange?.(progress, label);
        }, delay);
        timeouts.push(timeout);
      });

      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [isOpen, isPdfReady, onProgressChange]);

  // Auto-download when PDF is ready
  useEffect(() => {
    if (pdfBlob && downloadLinkRef.current) {
      // Create a download link and trigger it
      const url = URL.createObjectURL(pdfBlob);
      const filename = `Resume_Analysis_${new Date().getTime()}.pdf`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Mark as complete and trigger callback
      setCurrentProgress(100);
      onProgressChange?.(100, 'PDF ready! Downloading...');
      onGenerationComplete?.('success');
    }
  }, [pdfBlob, onProgressChange, onGenerationComplete]);

  if (!isOpen || !analysisData) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(2px)' }}>
      <div className="modal-content pdf-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>📄 Resume Analysis Report</h2>
            <p className="subtitle">
              Generating professional PDF report...
            </p>
          </div>
          <div className="modal-controls">
            <button className="btn btn-secondary" onClick={onClose} disabled={currentProgress < 100}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-body pdf-viewer-container">
          <div className="loading-state">
            <div className="progress-circle" style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(#3b82f6 0% ${currentProgress}%, #e2e8f0 ${currentProgress}% 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '900',
                  color: '#3b82f6'
                }}>
                  {currentProgress}%
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                  marginTop: '4px',
                  fontWeight: '600'
                }}>
                  Complete
                </div>
              </div>
            </div>
            
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
              {currentProgress === 100 ? '✅ Downloading your PDF...' : 'Generating Report'}
            </p>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
              {currentProgress === 100 
                ? 'Your document will open automatically' 
                : 'This may take a moment. Please wait...'}
            </p>
            
            {pdfError && (
              <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '12px' }}>
                ❌ Error: {pdfError}
              </p>
            )}
          </div>

          {/* Hidden PDF generator */}
          <div ref={downloadLinkRef} style={{ display: 'none', height: 0, width: 0 }}>
            <PDFDownloadLink
              document={<ResumePDFReport analysisData={analysisData} />}
              fileName={`Resume_Analysis_${new Date().getTime()}.pdf`}
            >
              {({ blob, url, loading, error }) => {
                if (blob && !pdfBlob && !loading) {
                  // PDF is ready, store it for download
                  setTimeout(() => {
                    setPdfBlob(blob);
                    setIsPdfReady(true);
                  }, 300);
                }
                if (error) {
                  setPdfError(error.message);
                  onGenerationComplete?.('error');
                }
                return null;
              }}
            </PDFDownloadLink>
          </div>
        </div>

        {/* Meta Information */}
        <div className="modal-footer">
          <div className="report-meta">
            <span>
              {analysisData.resume_filename && (
                <>
                  📄 <strong>Resume:</strong> {analysisData.resume_filename}
                </>
              )}
            </span>
            <span>
              {analysisData.jd_filename && (
                <>
                  📋 <strong>Job Description:</strong> {analysisData.jd_filename}
                </>
              )}
            </span>
            <span>
              🏷️ <strong>Domain:</strong> {analysisData.domain || 'General'}
            </span>
            <span>
              📊 <strong>Score:</strong>{' '}
              {Math.round(analysisData.bert_results?.summary?.overall_alignment_score || 0)}%
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 95vw;
          max-height: 95vh;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .pdf-modal {
          width: 90vw;
          height: 90vh;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px;
          border-bottom: 2px solid #e2e8f0;
          gap: 20px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          color: #0f172a;
          font-weight: 700;
        }

        .modal-header .subtitle {
          margin: 8px 0 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .modal-controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background-color: #2563eb;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .btn-secondary {
          background-color: #e2e8f0;
          color: #0f172a;
        }

        .btn-secondary:hover {
          background-color: #cbd5e1;
        }

        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-body {
          flex: 1;
          overflow: auto;
          background: #f8fafc;
        }

        .pdf-viewer-container {
          width: 100%;
          height: 100%;
          display: flex;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 20px;
          color: #64748b;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
          background-color: #f8fafc;
        }

        .report-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          font-size: 12px;
          color: #64748b;
        }

        .report-meta span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .report-meta strong {
          color: #0f172a;
          font-weight: 600;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .modal-content {
            max-width: 98vw;
            max-height: 98vh;
            border-radius: 8px;
          }

          .pdf-modal {
            width: 98vw;
            height: 98vh;
          }

          .modal-header {
            padding: 16px;
          }

          .modal-header h2 {
            font-size: 18px;
          }

          .modal-controls {
            width: 100%;
          }

          .btn {
            flex: 1;
            min-width: 100px;
          }
        }
      `}</style>
    </div>
  );
};

export default PDFReportViewer;
