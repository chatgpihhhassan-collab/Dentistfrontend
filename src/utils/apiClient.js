/**
 * 🌐 Dentia Centralized API Client
 * Automatically attaches Authorization: Bearer <token> from active Doctor/Patient session.
 * Prevents 401 Unauthorized rejections across all clinical & practice management pages.
 */

import { API_BASE_URL } from '../config/apiConfig';

export function getAuthToken() {
    try {
        const doc = JSON.parse(localStorage.getItem('doctor') || '{}');
        if (doc && doc.token) return doc.token;

        const patient = JSON.parse(localStorage.getItem('patient') || '{}');
        if (patient && patient.token) return patient.token;
    } catch (e) {
        // Fallback gracefully on parsing failure
    }
    return null;
}

export async function apiFetch(url, options = {}) {
    const token = getAuthToken();
    const headers = new Headers(options.headers || {});

    // Automatically inject Bearer token if not already explicitly provided
    if (token && !headers.has('Authorization') && !headers.has('authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Automatically set Content-Type: application/json for stringified payloads
    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type') && !headers.has('content-type')) {
        headers.set('Content-Type', 'application/json');
    }

    let targetUrl = url;
    if (typeof url === 'string' && url.startsWith('/api') && API_BASE_URL) {
        targetUrl = `${API_BASE_URL.replace(/\/+$/, '')}${url}`;
    }

    try {
        const response = await fetch(targetUrl, {
            ...options,
            headers
        });
        return response;
    } catch (networkError) {
        // Fallback to relative URL if direct call fails (e.g. proxy or local tunnel)
        if (targetUrl !== url) {
            console.warn(`[apiClient] Direct call to ${targetUrl} failed, falling back to ${url}:`, networkError);
            return fetch(url, {
                ...options,
                headers
            });
        }
        throw networkError;
    }
}

export default apiFetch;
