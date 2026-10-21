/**
 * Dentia Clinical System - Centralized Session & Route Security Service
 * Enforces HIPAA/GDPR clinical workstation security rules:
 * 1. Synchronous auth validation before route rendering.
 * 2. Automatic session termination when Google Chrome is closed (via session cookies).
 * 3. 10-minute inactivity sliding timeout.
 * 4. JWT token payload expiration verification.
 * 5. Multi-tab broadcast channel synchronization.
 */

export const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 continuous minutes (600,000 ms)
export const WARNING_THRESHOLD_MS = 60 * 1000;        // 60-second warning banner
export const STORAGE_LAST_ACTIVE_KEY = 'dentia_last_active';
export const SESSION_CHANNEL_NAME = 'dentia_session_channel';
export const SESSION_COOKIE_NAME = 'dentia_session_active';
export const SESSION_STORAGE_ACTIVE_KEY = 'dentia_session_active';

/**
 * Safely decodes base64url JSON payload from a JWT token
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    
    // Scan both parts[0] and parts[1] (DentistAPI uses custom {payload}.{signature})
    for (const segment of [parts[0], parts[1]]) {
      try {
        let clean = segment.replace(/-/g, '+').replace(/_/g, '/');
        while (clean.length % 4) clean += '=';
        const json = atob(clean);
        const parsed = JSON.parse(json);
        if (parsed && (parsed.ExpiresAt || parsed.exp || parsed.DoctorId || parsed.doctorId || parsed.Username)) {
          return parsed;
        }
      } catch {}
    }
  } catch {}
  return null;
}

/**
 * Returns true if JWT token is expired
 */
export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return false; // If untracked dev token, backend handles 401
  const expiry = payload.ExpiresAt || payload.exp;
  if (!expiry) return false;
  
  // Standard unix seconds vs milliseconds normalization
  const expiryMs = expiry > 10000000000 ? expiry : expiry * 1000;
  return Date.now() > expiryMs;
}

/**
 * Checks if the browser session cookie is present
 * Note: Session cookies are destroyed by Chrome/Edge/Firefox when the browser is closed.
 */
export function hasSessionCookie() {
  if (typeof document === 'undefined') return true;
  return document.cookie
    .split(';')
    .some((item) => item.trim().startsWith(`${SESSION_COOKIE_NAME}=`));
}

/**
 * Sets session cookie (no Expires/Max-Age: browser purges it on application close)
 */
export function setSessionCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = `${SESSION_COOKIE_NAME}=true; path=/; SameSite=Lax`;
  }
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(SESSION_STORAGE_ACTIVE_KEY, 'true');
    } catch {}
  }
}

/**
 * Clears session cookie and active sessionStorage
 */
export function clearSessionCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
  }
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_ACTIVE_KEY);
    } catch {}
  }
}

/**
 * Programmatically records clinician activity timestamp
 */
export function recordClinicianActivity() {
  try {
    const now = Date.now();
    localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, String(now));
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(SESSION_CHANNEL_NAME);
      channel.postMessage({ type: 'ACTIVITY', timestamp: now });
      channel.close();
    }
  } catch {}
}

/**
 * Complete synchronous security validation for clinician session.
 * Evaluates:
 * 1. Authentication object presence.
 * 2. Token validity and format.
 * 3. JWT expiration.
 * 4. Browser Closure Check (session cookie / sessionStorage vs rememberMe).
 * 5. 10-minute inactivity limit.
 *
 * @returns {{ isValid: boolean, reason: string, doctor: object | null }}
 */
export function validateClinicianSession() {
  let doctor = null;
  try {
    const raw = localStorage.getItem('doctor');
    if (raw) doctor = JSON.parse(raw);
  } catch {
    doctor = null;
  }

  // 1. Not authenticated
  if (!doctor || !doctor.token) {
    return { isValid: false, reason: 'unauthenticated', doctor: null };
  }

  // 2. JWT token expired
  if (isTokenExpired(doctor.token)) {
    purgeClinicianSession('token_expired');
    return { isValid: false, reason: 'token_expired', doctor: null };
  }

  // 3. Browser Closure Check:
  // If doctor did NOT explicitly select "rememberMe", closing Chrome destroys session cookie
  const isRemembered = Boolean(doctor.rememberMe);
  const cookieActive = hasSessionCookie();
  const sessionActive = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_STORAGE_ACTIVE_KEY) === 'true';

  if (!isRemembered && !cookieActive && !sessionActive) {
    purgeClinicianSession('session_closed');
    return { isValid: false, reason: 'session_closed', doctor: null };
  }

  // 4. Inactivity check (10 minutes)
  const lastActiveStr = localStorage.getItem(STORAGE_LAST_ACTIVE_KEY);
  if (lastActiveStr) {
    const lastActive = parseInt(lastActiveStr, 10);
    if (!isNaN(lastActive) && (Date.now() - lastActive > INACTIVITY_TIMEOUT_MS)) {
      purgeClinicianSession('inactivity_timeout');
      return { isValid: false, reason: 'inactivity_timeout', doctor: null };
    }
  }

  // Ensure active session markers are fresh in current window
  if (!cookieActive) {
    setSessionCookie();
  }

  return { isValid: true, reason: 'valid', doctor };
}

/**
 * Completely purges clinician session and notifies other open windows/tabs
 */
export function purgeClinicianSession(reason = 'logout') {
  try {
    localStorage.removeItem('doctor');
    localStorage.removeItem(STORAGE_LAST_ACTIVE_KEY);
    clearSessionCookie();
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(SESSION_CHANNEL_NAME);
      channel.postMessage({ type: 'SESSION_EXPIRED', reason });
      channel.close();
    }
  } catch {}
}

/**
 * Records doctor login and establishes session security tokens
 */
export function establishDoctorSession(doctorData, rememberMe = false) {
  const sessionData = { ...doctorData, rememberMe: Boolean(rememberMe) };
  try {
    localStorage.setItem('doctor', JSON.stringify(sessionData));
    localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, String(Date.now()));
    setSessionCookie();
  } catch (err) {
    console.warn('Session establishment storage warning:', err);
  }
  return sessionData;
}
