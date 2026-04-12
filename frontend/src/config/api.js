const DEFAULT_API_BASE = 'http://localhost:8000';

const rawBase = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE).trim();

// Prevent trailing slash issues when concatenating endpoint paths.
export const API_BASE_URL = rawBase.replace(/\/+$/, '');

export const apiUrl = (path) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
};
