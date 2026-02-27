import React, { useRef, useState } from 'react';
import { UploadCloud, AlertCircle, X, Folder, File } from 'lucide-react';

const FileUpload = ({ onFileSelect, accept, label }) => {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const validateFile = (file) => {
        if (file.size > 5 * 1024 * 1024) {
            setError("File size exceeds 5MB.");
            return false;
        }
        const ext = file.name.split('.').pop().toLowerCase();
        const allowed = accept.replace(/\./g, '').split(',');
        if (!allowed.includes(ext)) {
            setError(`Invalid file type. Allowed: ${accept}`);
            return false;
        }
        setError(null);
        return true;
    };

    const handleFileProcess = (file) => {
        if (validateFile(file)) {
            setSelectedFile(file);
            onFileSelect(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFileProcess(files[0]);
    };

    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files.length > 0) handleFileProcess(files[0]);
    };

    const removeFile = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
        onFileSelect(null);
        // Reset input value so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const truncateName = (name, maxLength = 20) => {
        if (name.length <= maxLength) return name;
        const extension = name.split('.').pop();
        const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
        const truncated = nameWithoutExt.substring(0, maxLength - extension.length - 3);
        return `${truncated}...${extension}`;
    };

    if (selectedFile) {
        return (
            <div className="file-card-wrapper">
                <div className="folder-icon-wrapper">
                    <Folder size={64} fill="#a78bfa" color="#a78bfa" strokeWidth={1} />
                    <div style={{ position: 'absolute', bottom: 12, left: 18 }}>
                        <File size={28} color="white" fill="white" />
                    </div>
                </div>
                <div className="file-meta">
                    <div className="file-name" title={selectedFile.name}>
                        {truncateName(selectedFile.name)}
                    </div>
                    <div className="file-details">
                        <span>{formatSize(selectedFile.size)}</span>
                        <span>•</span>
                        <span style={{ textTransform: 'uppercase' }}>{selectedFile.name.split('.').pop()}</span>
                    </div>
                </div>
                <button className="remove-btn" onClick={removeFile} title="Remove File">
                    <X size={18} />
                </button>
            </div>
        );
    }

    return (
        <div
            className={`upload-zone ${isDragging ? 'active' : ''} ${error ? 'error' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept={accept}
                onChange={handleFileChange}
            />

            <div className="upload-icon">
                {error ? <AlertCircle size={48} color="var(--error)" /> : <UploadCloud size={48} />}
            </div>

            <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                Drag & Drop your {label} here
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Supports PDF, DOCX, TXT (Max 5MB)
            </p>

            {error && <p style={{ color: 'var(--error)', fontSize: '0.9rem', marginTop: '1rem' }}>{error}</p>}
        </div>
    );
};

export default FileUpload;
