import React, { useState } from 'react';
import FileUpload from './FileUpload';

const JdInput = ({ onFileSelect, onTextChange, selectedFile }) => {
    const [activeTab, setActiveTab] = useState('file');

    return (
        <div>
            <div className="tab-container">
                <button
                    className={`tab-btn ${activeTab === 'file' ? 'active' : ''}`}
                    onClick={() => setActiveTab('file')}
                >
                    Upload Document
                </button>
                <button
                    className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                    onClick={() => setActiveTab('text')}
                >
                    Paste Description
                </button>
            </div>

            <div className="fade-in">
                {activeTab === 'file' ? (
                    <div>
                        <FileUpload
                            onFileSelect={(file) => {
                                onFileSelect(file);
                                onTextChange(""); // Clear text if file selected
                            }}
                            selectedFile={selectedFile}
                            accept=".pdf,.docx,.txt"
                            label="Job Description"
                        />
                        {selectedFile && <p style={{ marginTop: '0.5rem', color: '#10b981' }}>Attached: {selectedFile.name}</p>}
                    </div>
                ) : (
                    <textarea
                        className="modern-input"
                        placeholder="Paste the full job description text here for analysis..."
                        onChange={(e) => {
                            onTextChange(e.target.value);
                            onFileSelect(null); // Clear file if text entered
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default JdInput;
