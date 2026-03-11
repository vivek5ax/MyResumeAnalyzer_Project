import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import JdInput from './components/JdInput';
import Preview from './components/Preview';
import { ChevronDown, Briefcase } from 'lucide-react';

function App() {
    const [resume, setResume] = useState(null);
    const [jdFile, setJdFile] = useState(null);
    const [jdText, setJdText] = useState("");
    const [domain, setDomain] = useState("software");
    const [extractedData, setExtractedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDomainOpen, setIsDomainOpen] = useState(false);

    // Domain Options
    const domainOptions = [
        { id: 'software', label: 'Software Engineering', icon: '💻' },
        { id: 'medical', label: 'Medical & Healthcare', icon: '🏥' },
        { id: 'electrical', label: 'Electrical Engineering', icon: '⚡' },
        { id: 'marketing', label: 'Marketing & Sales', icon: '📢' },
        { id: 'finance', label: 'Finance & Banking', icon: '💰' },
        { id: 'human_resources', label: 'Human Resources', icon: '👥' }
    ];

    // Clear extraction results if inputs change
    React.useEffect(() => {
        setExtractedData(null);
    }, [resume, jdFile, jdText, domain]);

    const handleExtract = async () => {
        setLoading(true);
        setError(null);
        setExtractedData(null);

        const formData = new FormData();
        formData.append('resume', resume);
        formData.append('domain', domain);

        if (jdFile) {
            formData.append('job_description_file', jdFile);
        } else if (jdText) {
            formData.append('job_description_text', jdText);
        } else {
            setError("Please provide a Job Description (File or Text)");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/extract', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Extraction failed");
            }

            const data = await response.json();
            setExtractedData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isAnalyzeDisabled = !resume || (!jdFile && !jdText.trim()) || loading;

    return (
        <div className="app-container fade-in">
            <div className="glass-card">
                <h1 className="title">Resume Analyzer</h1>
                <p className="subtitle">AI-Powered Resume Screening & Job Matching</p>

                {/* Domain Selection Section */}
                <div style={{ marginBottom: '2.5rem', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: '#6366f1', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem' }}>STEP 1</div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Select Job Domain</h3>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsDomainOpen(!isDomainOpen)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '1rem',
                                padding: '1rem 1.5rem',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontSize: '1.05rem'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>
                                    {domainOptions.find(opt => opt.id === domain)?.icon}
                                </span>
                                <span style={{ fontWeight: '600' }}>
                                    {domainOptions.find(opt => opt.id === domain)?.label}
                                </span>
                            </div>
                            <ChevronDown
                                size={20}
                                style={{
                                    transform: isDomainOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease',
                                    opacity: 0.6
                                }}
                            />
                        </button>

                        {isDomainOpen && (
                            <div className="fade-in" style={{
                                position: 'absolute',
                                top: 'calc(100% + 10px)',
                                left: 0,
                                right: 0,
                                background: '#1e293b',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                                zIndex: 100,
                                overflow: 'hidden',
                                padding: '0.5rem'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
                                    {domainOptions.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                setDomain(opt.id);
                                                setIsDomainOpen(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '0.9rem 1.2rem',
                                                borderRadius: '12px',
                                                border: 'none',
                                                background: domain === opt.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                                color: domain === opt.id ? '#818cf8' : '#94a3b8',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                textAlign: 'left',
                                                fontWeight: domain === opt.id ? '700' : '500'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (domain !== opt.id) {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                    e.currentTarget.style.color = 'white';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (domain !== opt.id) {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = '#94a3b8';
                                                }
                                            }}
                                        >
                                            <span style={{ fontSize: '1.3rem' }}>{opt.icon}</span>
                                            <span>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* JD Input Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ background: '#6366f1', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem' }}>STEP 2</div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Job Description</h3>
                        </div>
                        <div className="setup-card">
                            <JdInput
                                onFileSelect={setJdFile}
                                onTextChange={setJdText}
                                selectedFile={jdFile}
                            />
                        </div>
                    </div>

                    {/* Resume Upload Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ background: '#6366f1', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem' }}>STEP 3</div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Upload Resume</h3>
                        </div>
                        <div className="setup-card">
                            {/* Dummy spacer to match JD tabs height */}
                            <div style={{ height: '36px', marginBottom: '1.5rem', borderBottom: '1px solid transparent' }}></div>
                            <FileUpload
                                onFileSelect={setResume}
                                accept=".pdf,.docx,.txt"
                                label="Resume"
                            />
                            {resume && (
                                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                    Attached: {resume.name}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                    <button
                        className="btn"
                        onClick={handleExtract}
                        disabled={isAnalyzeDisabled}
                        style={{ width: '100%', maxWidth: '400px', padding: '1.1rem' }}
                    >
                        {loading ? 'Processing...' : 'Analyze Capability'}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-message fade-in" style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        padding: '1rem',
                        borderRadius: '12px',
                        color: '#fca5a5',
                        textAlign: 'center',
                        marginTop: '1.5rem'
                    }}>
                        {error}
                    </div>
                )}

                {/* Results Preview */}
                {extractedData && (
                    <Preview data={extractedData} />
                )}
            </div>
        </div>
    );
}

export default App;
