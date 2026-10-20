import apiFetch from '../utils/apiClient';

/**
 * 📱 Dentia WhatsApp Service (OpenWA Gateway Client)
 * Handles live gateway connectivity telemetry, QR code generation, message queue logs,
 * manual test sends, and patient opt-in management.
 */

export async function getWhatsAppStatus() {
    const response = await apiFetch('/api/whatsapp/status');
    if (!response.ok) {
        throw new Error(`Failed to fetch WhatsApp gateway status: ${response.statusText}`);
    }
    return await response.json();
}

export async function getWhatsAppQR() {
    const response = await apiFetch('/api/whatsapp/qr');
    if (!response.ok) {
        throw new Error(`Failed to fetch WhatsApp QR code: ${response.statusText}`);
    }
    return await response.json();
}

export async function startWhatsAppSession() {
    const response = await apiFetch('/api/whatsapp/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        throw new Error(`Failed to start WhatsApp session: ${response.statusText}`);
    }
    return await response.json();
}

export async function getWhatsAppLogs(limit = 50, status = null) {
    let url = `/api/whatsapp/logs?limit=${limit}`;
    if (status && status !== 'ALL') {
        url += `&status=${encodeURIComponent(status)}`;
    }
    const response = await apiFetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch WhatsApp message logs: ${response.statusText}`);
    }
    return await response.json();
}

export async function sendWhatsAppTest(phone, message = null) {
    const response = await apiFetch('/api/whatsapp/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || 'Failed to dispatch test WhatsApp message');
    }
    return data;
}

export async function updatePatientWhatsAppOptIn(patientId, optIn) {
    const response = await apiFetch(`/api/whatsapp/patients/${patientId}/opt-in`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optIn })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || 'Failed to update patient WhatsApp opt-in status');
    }
    return data;
}

export async function getPatientWhatsAppStatus(patientId) {
    const response = await apiFetch(`/api/whatsapp/patients/${patientId}/status`);
    if (!response.ok) {
        throw new Error(`Failed to fetch patient WhatsApp eligibility: ${response.statusText}`);
    }
    return await response.json();
}

export async function resendAppointmentWhatsApp(appointmentId) {
    console.log(`[whatsappService] Dispatching manual WhatsApp resend for appointment #${appointmentId}`);
    const response = await apiFetch(`/api/whatsapp/appointments/${appointmentId}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || 'Failed to resend WhatsApp confirmation');
    }
    console.log(`[whatsappService] Manual resend successful for appointment #${appointmentId}:`, data);
    return data;
}

/**
 * ⚡ Generates a zero-dependency wa.me Click-to-Chat URL.
 * Automatically normalizes Pakistani mobile numbers (e.g. 03455097066 -> 923455097066).
 * Enables instant 1-click dispatch directly from WhatsApp Web or WhatsApp Desktop/Mobile app.
 */
export function getWhatsAppClickToChatUrl(phone, text = '') {
    if (!phone) return null;
    const cleanDigits = phone.toString().replace(/[^0-9]/g, '');
    let international = cleanDigits;
    if (international.startsWith('0')) {
        international = '92' + international.slice(1);
    } else if (international.startsWith('3') && international.length === 10) {
        international = '92' + international;
    }
    return `https://wa.me/${international}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/**
 * Retries a specific failed WhatsApp message via the backend queue.
 */
export async function retryWhatsAppMessage(messageId) {
    try {
        const response = await apiFetch(`/api/whatsapp/messages/${messageId}/retry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `Failed to retry message #${messageId}`);
        }
        return data;
    } catch (err) {
        console.warn(`[whatsappService] Retry API call failed for message #${messageId}:`, err);
        throw err;
    }
}

/**
 * Retries all failed WhatsApp messages via the backend queue.
 */
export async function retryAllFailedWhatsAppMessages() {
    try {
        const response = await apiFetch('/api/whatsapp/messages/retry-failed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || 'Failed to retry failed WhatsApp messages');
        }
        return data;
    } catch (err) {
        console.warn('[whatsappService] Retry all failed API call failed:', err);
        throw err;
    }
}


