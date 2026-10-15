/**
 * 🤖 Dentia Unified AI Client (aiClient.js)
 * Standardized API client for all clinical AI features adhering to Dentia UX Principles:
 * - Standardized response envelopes: { success, data, error: { code, message, userMessage }, meta }
 * - AbortController support for instant chairside cancellation
 * - Perceived performance with timeout handling (default 25s)
 * - Exponential backoff retry for transient 429/503 errors
 * - Plain-language dental-specific error messages with zero lost work
 */

// Determine base API endpoint
function getApiBaseUrl() {
  try {
    if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
    }
  } catch {}
  return '';
}

const DEFAULT_TIMEOUT_MS = 25000;

export const AIErrorCodes = {
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  OFFLINE: 'OFFLINE',
  RATE_LIMITED: 'RATE_LIMITED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  SAFETY_BLOCKED: 'SAFETY_BLOCKED',
  ABORTED: 'ABORTED',
  AUTH_REQUIRED: 'AUTH_REQUIRED'
};

/**
 * Maps raw error codes/statuses to friendly, actionable clinical messages
 */
export function getFriendlyErrorMessage(code, rawMsg = '') {
  switch (code) {
    case AIErrorCodes.TIMEOUT_ERROR:
      return "The AI analysis took longer than expected. You can retry or complete documentation manually.";
    case AIErrorCodes.OFFLINE:
      return "Unable to reach clinic network. Please check your internet connection.";
    case AIErrorCodes.RATE_LIMITED:
      return "Dental AI copilot is experiencing high traffic. Please retry in a few moments.";
    case AIErrorCodes.VALIDATION_ERROR:
      return rawMsg || "Please ensure all required clinical details are entered before AI processing.";
    case AIErrorCodes.SAFETY_BLOCKED:
      return "AI was unable to verify this clinical pattern. Please document manually.";
    case AIErrorCodes.ABORTED:
      return "AI generation was cancelled.";
    case AIErrorCodes.AUTH_REQUIRED:
      return "Clinician session expired. Please sign in again to use AI features.";
    case AIErrorCodes.SERVER_ERROR:
    default:
      return "Dental AI service is temporarily unavailable. Your inputs are safely preserved.";
  }
}

/**
 * Normalizes any backend or external AI response to the unified format
 */
export function normalizeAIResponse(rawResponse, meta = {}) {
  if (!rawResponse) {
    return {
      success: false,
      error: {
        code: AIErrorCodes.SERVER_ERROR,
        message: 'Empty response received from AI service',
        userMessage: getFriendlyErrorMessage(AIErrorCodes.SERVER_ERROR)
      },
      meta
    };
  }

  // Already standard format
  if (typeof rawResponse.success === 'boolean') {
    return {
      ...rawResponse,
      meta: { ...meta, ...(rawResponse.meta || {}) }
    };
  }

  // Legacy format { data: ..., ... }
  if (rawResponse.data !== undefined) {
    return {
      success: true,
      data: rawResponse.data,
      meta: {
        ...meta,
        confidence: rawResponse.confidence || rawResponse.Confidence || null
      }
    };
  }

  // Chatbot / Jarvis format { ai_response: ... } or { response: ... }
  if (rawResponse.ai_response !== undefined || rawResponse.response !== undefined) {
    return {
      success: true,
      data: rawResponse.ai_response || rawResponse.response,
      meta
    };
  }

  // AIDentalNotes format { Status: ..., Note: ... } or { SessionId, Transcript }
  if (rawResponse.Note !== undefined || rawResponse.Transcript !== undefined) {
    return {
      success: true,
      data: rawResponse,
      meta
    };
  }

  // Fallback: wrap raw response as data
  return {
    success: true,
    data: rawResponse,
    meta
  };
}

/**
 * Core Universal Request Handler
 */
async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal = null,
    retries = 1,
    meta = {}
  } = options;

  // Check offline status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      error: {
        code: AIErrorCodes.OFFLINE,
        message: 'Client device is offline',
        userMessage: getFriendlyErrorMessage(AIErrorCodes.OFFLINE),
        status: 0
      },
      meta
    };
  }

  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // Build auth header if clinician token exists
  const authHeaders = {};
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt');
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
  } catch {}

  // Setup abort controller with timeout
  const internalController = new AbortController();
  const timeoutId = setTimeout(() => {
    internalController.abort('TIMEOUT');
  }, timeoutMs);

  // Link external signal if provided
  if (signal) {
    signal.addEventListener('abort', () => {
      internalController.abort('USER_CANCELLED');
    });
  }

  let attempt = 0;
  while (attempt <= retries) {
    try {
      const fetchHeaders = {
        'Accept': 'application/json',
        ...authHeaders,
        ...headers
      };

      let fetchBody = body;
      if (body && !(body instanceof FormData) && typeof body === 'object') {
        fetchHeaders['Content-Type'] = 'application/json';
        fetchBody = JSON.stringify(body);
      }

      const res = await fetch(url, {
        method,
        headers: fetchHeaders,
        body: fetchBody,
        signal: internalController.signal
      });

      clearTimeout(timeoutId);

      // Handle non-OK HTTP status
      if (!res.ok) {
        let errJson = null;
        try {
          errJson = await res.json();
        } catch {
          const errText = await res.text().catch(() => '');
          errJson = { message: errText };
        }

        let errorCode = AIErrorCodes.SERVER_ERROR;
        if (res.status === 401 || res.status === 403) errorCode = AIErrorCodes.AUTH_REQUIRED;
        else if (res.status === 429) errorCode = AIErrorCodes.RATE_LIMITED;
        else if (res.status === 400 || res.status === 422) errorCode = AIErrorCodes.VALIDATION_ERROR;

        // If rate limited or 503 and retries left, wait and retry
        if ((res.status === 429 || res.status === 503) && attempt < retries) {
          attempt++;
          await new Promise(r => setTimeout(r, 1500 * attempt));
          continue;
        }

        return {
          success: false,
          error: {
            code: errorCode,
            message: errJson?.message || errJson?.error || `HTTP ${res.status}`,
            userMessage: getFriendlyErrorMessage(errorCode, errJson?.message),
            status: res.status
          },
          meta
        };
      }

      // Success parse JSON
      const json = await res.json().catch(() => ({}));
      return normalizeAIResponse(json, meta);

    } catch (err) {
      if (err.name === 'AbortError' || internalController.signal.aborted) {
        clearTimeout(timeoutId);
        const isTimeout = internalController.signal.reason === 'TIMEOUT';
        const code = isTimeout ? AIErrorCodes.TIMEOUT_ERROR : AIErrorCodes.ABORTED;
        return {
          success: false,
          error: {
            code,
            message: isTimeout ? 'Request timed out' : 'User cancelled AI request',
            userMessage: getFriendlyErrorMessage(code)
          },
          meta
        };
      }

      // Transient network failure retry
      if (attempt < retries) {
        attempt++;
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }

      clearTimeout(timeoutId);
      return {
        success: false,
        error: {
          code: AIErrorCodes.SERVER_ERROR,
          message: err.message || 'Network error',
          userMessage: getFriendlyErrorMessage(AIErrorCodes.SERVER_ERROR)
        },
        meta
      };
    }
  }
}

/**
 * Public AI Client API
 */
export const aiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),

  /**
   * Post Radiograph for live AI Vision Analysis
   */
  async analyzeRadiograph(formData, options = {}) {
    return request('/api/radiographs/upload', {
      method: 'POST',
      body: formData,
      timeoutMs: 45000, // Vision takes up to 45s on large OPG scans
      meta: { feature: 'radiology-vision', promptId: 'radiograph-caries-detector' },
      ...options
    });
  },

  /**
   * Plain-Language Explanation of Odontogram / Treatment Plan for Patient
   */
  async explainOdontogram(teethState, options = {}) {
    return request('/api/ai/patient-explanation', {
      method: 'POST',
      body: { teethState },
      timeoutMs: 20000,
      meta: { feature: 'patient-education', promptId: 'plain-language-odontogram' },
      ...options
    });
  },

  /**
   * Ask Copilot / Jarvis Clinical Q&A
   */
  async queryCopilot(question, context = {}, options = {}) {
    return request('/api/ai/copilot-qa', {
      method: 'POST',
      body: { question, context },
      timeoutMs: 25000,
      meta: { feature: 'copilot-qa', promptId: 'clinical-copilot-qa' },
      ...options
    });
  }
};

export default aiClient;
