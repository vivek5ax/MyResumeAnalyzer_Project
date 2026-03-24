import React, { useEffect, useRef } from 'react';

/**
 * Circular PDF progress popup.
 * Props:
 *  visible    – boolean
 *  progress   – 0..100
 *  label      – string description of current phase
 */
const PdfProgressModal = ({ visible, progress, label }) => {
    const circleRef = useRef(null);

    const R  = 54;                     // radius
    const C  = 2 * Math.PI * R;       // circumference

    useEffect(() => {
        if (circleRef.current) {
            const offset = C - (progress / 100) * C;
            circleRef.current.style.strokeDashoffset = offset;
        }
    }, [progress, C]);

    if (!visible) return null;

    const pct = Math.min(100, Math.max(0, Math.round(progress)));

    // Tier colour
    const arcColor =
        pct >= 80 ? '#22c55e' :
        pct >= 50 ? '#0ea5e9' :
                    '#6366f1';

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(15,23,42,0.68)',
                backdropFilter: 'blur(6px)',
                animation: 'pdfFadeIn 0.3s ease',
            }}
        >
            <style>{`
                @keyframes pdfFadeIn { from { opacity:0; transform:scale(.95) } to { opacity:1; transform:scale(1) } }
                @keyframes pdfPulse  { 0%,100% { opacity:1 } 50% { opacity:.5 } }
                .pdf-progress-arc {
                    stroke-dasharray: ${C};
                    stroke-dashoffset: ${C};
                    transition: stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1);
                }
            `}</style>

            <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '40px 44px 36px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '18px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
                minWidth: '320px',
            }}>
                {/* Title */}
                <div style={{ fontFamily: 'sans-serif', fontWeight: 700, fontSize: '17px', color: '#0f172a', letterSpacing: '-0.3px' }}>
                    Generating Report
                </div>

                {/* SVG circle */}
                <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                    <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                        {/* Track */}
                        <circle
                            cx="65" cy="65" r={R}
                            fill="none" stroke="#e2e8f0" strokeWidth="10"
                        />
                        {/* Progress arc */}
                        <circle
                            ref={circleRef}
                            className="pdf-progress-arc"
                            cx="65" cy="65" r={R}
                            fill="none"
                            stroke={arcColor}
                            strokeWidth="10"
                            strokeLinecap="round"
                        />
                    </svg>
                    {/* Centered % text */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'sans-serif',
                    }}>
                        <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                            {pct}%
                        </span>
                        <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '3px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            complete
                        </span>
                    </div>
                </div>

                {/* Phase label */}
                <div style={{
                    fontFamily: 'sans-serif', fontSize: '13px', color: '#475569',
                    textAlign: 'center', lineHeight: 1.5, maxWidth: '240px',
                    animation: 'pdfPulse 1.8s ease-in-out infinite',
                }}>
                    {label || 'Processing…'}
                </div>

                {/* Hint */}
                <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#cbd5e1' }}>
                    Your PDF will download automatically
                </div>
            </div>
        </div>
    );
};

export default PdfProgressModal;
