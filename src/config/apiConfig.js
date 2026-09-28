// Central API configuration for Dentist App
const getBaseUrl = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    // If running in browser on localhost/127.0.0.1, use relative path so Vite proxy routes to backend
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return '';
        }
    }
    return 'https://dentist-api-dev.vitonta.com';
};

export const API_BASE_URL = getBaseUrl();

export default API_BASE_URL;
