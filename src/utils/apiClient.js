/**
 * 🌐 Dentia Centralized API Client
 * Automatically attaches Authorization: Bearer <token> from active Doctor/Patient session.
 * Prevents 401 Unauthorized rejections across all clinical & practice management pages.
 */

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

    return fetch(url, {
        ...options,
        headers
    });
}

export default apiFetch;
