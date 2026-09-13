# 10-Minute Inactivity Session Timeout & Sliding Expiration Architecture

## Executive Summary & Clinical Context

In medical and dental clinical practice management systems (PMS / EHR), patient health information (PHI) must be strictly protected against unauthorized access when a computer terminal or tablet is left unattended in an operatory, consult room, or reception desk.

This document outlines the architecture, interaction mechanics, and implementation specifications for an **automatic 10-Minute Inactivity Session Timeout** with **Sliding Window Extension** for Dentia.

---

## Core Requirements & Specifications

1. **Inactivity Duration**: **10 minutes** (`600,000 ms` / `600 seconds`).
2. **Sliding Session Renewal**: Every single clinician action performed on the site within the 10-minute window extends the session by another **full 10 minutes** from that exact moment.
3. **Monitored Interaction Events**:
   - `mousedown` / `click` / `pointerdown`
   - `keydown` (typing in dental notes, search bars, modals)
   - `mousemove` / `pointermove` (throttled to avoid CPU overhead)
   - `scroll` / `wheel` (viewing dental history, patient directory, treatment tables)
   - `touchstart` / `touchmove` (iPad / tablet operatory interaction)
   - Background API requests (`fetch` / `axios`)
4. **Session Expiration Action**:
   - When 10 continuous minutes pass with zero doctor interaction:
     - The clinician credentials and tokens are removed (`localStorage.removeItem('doctor')`).
     - Temporary active timestamps are purged (`localStorage.removeItem('dentia_last_active')`).
     - In-memory API caches are purged.
     - The clinician is immediately redirected to `/login?expired=true`.
     - An explicit medical privacy notification is shown:
       > *"⏱️ Session Expired: For patient data privacy and security, your session ended after 10 minutes of inactivity. Please sign in to resume."*
5. **Cross-Tab & Multi-Window Synchronization**:
   - If the doctor has multiple tabs open (e.g. Patient Directory in Tab 1, Odontogram Chart in Tab 2):
     - An action in Tab 2 **resets the 10-minute timer across all open tabs** via `BroadcastChannel` and `storage` events.
     - If the session expires, **all open tabs cleanly redirect to `/login` simultaneously**, preventing orphaned unlocked sessions.
6. **Graceful Warning Notice (Final 60 Seconds)**:
   - At the 9-minute mark (60 seconds remaining), a non-intrusive floating security pill appears:
     > *"⚠️ Inactivity Warning: Your session will lock in 60s. Click anywhere to stay signed in."*
   - Clicking anywhere or pressing any key automatically dismisses the warning and resets the session to 10 minutes.

---

## Technical Architecture & State Machine

```
[ Doctor Logged In ]
        │
        ▼
[ Record Initial Activity: dentia_last_active = Date.now() ]
        │
        ├── Doctor Interacts (Click / Type / Scroll / Mouse / API) ──┐
        │                                                           │
        │   ◄─── Reset 10-Minute Window (Extend Session) ───────────┘
        │
        ▼ (9 Minutes Inactive)
[ Display Floating 60s Countdown Warning Notice ]
        │
        ├── Doctor Interacts (Any Click / Keypress / Touch) ─────────┐
        │                                                           │
        │   ◄─── Dismiss Warning & Reset Timer to 10 Minutes ───────┘
        │
        ▼ (10 Minutes Complete Inactivity Reached)
[ SESSION EXPIRED TRIGGERED ]
        ├── 1. localStorage.removeItem('doctor')
        ├── 2. localStorage.removeItem('dentia_last_active')
        ├── 3. BroadcastChannel.postMessage({ type: 'SESSION_EXPIRED' })
        ├── 4. Invalidate In-Memory API Cache
        └── 5. window.location.href = '/login?expired=true'
```

---

## Component Architecture

### 1. `IdleSessionManager.jsx` ([`src/components/IdleSessionManager.jsx`](file:///f:/DentistApp_Theme2/src/components/IdleSessionManager.jsx))
* Runs as a singleton listener inside `<BrowserRouter>` in [`App.jsx`](file:///f:/DentistApp_Theme2/src/App.jsx).
* Only activates when `localStorage.getItem('doctor')` exists (authenticated session).
* Uses high-frequency event throttling (maximum 1 timestamp write per 3 seconds) to ensure **steady 60 FPS** UI performance.
* Features a high-precision `setInterval` (checking every 1,000ms) comparing `Date.now() - lastActiveTime`.
* Handles cross-tab synchronization with `new BroadcastChannel('dentia_session_channel')` and `window.addEventListener('storage')`.

### 2. Global Request Interceptor Integration ([`src/main.jsx`](file:///f:/DentistApp_Theme2/src/main.jsx))
* Whenever `window.fetch` or `axios` executes an authenticated API call, it signals `IdleSessionManager.recordActivity()` so heavy background work or voice transcription extends the session seamlessly.

### 3. Login Notification Banner ([`src/pages/Auth.jsx`](file:///f:/DentistApp_Theme2/src/pages/Auth.jsx))
* Detects `?expired=true` query parameter or `location.state?.sessionExpired`.
* Renders a warm amber clinical security banner above the sign-in form explaining why the doctor was logged out.

---

## File Modification Plan

| File | Change Type | Responsibility |
| :--- | :--- | :--- |
| [`src/components/IdleSessionManager.jsx`](file:///f:/DentistApp_Theme2/src/components/IdleSessionManager.jsx) | **NEW** | Core inactivity tracker, sliding 10-min renewal, cross-tab sync, 60s warning banner |
| [`src/App.jsx`](file:///f:/DentistApp_Theme2/src/App.jsx) | **MODIFY** | Mount `<IdleSessionManager />` inside `<BrowserRouter>` |
| [`src/pages/Auth.jsx`](file:///f:/DentistApp_Theme2/src/pages/Auth.jsx) | **MODIFY** | Display session expiration alert message upon redirect |
| [`src/main.jsx`](file:///f:/DentistApp_Theme2/src/main.jsx) | **MODIFY** | Broadcast activity on successful API network requests |
| `IDLE_SESSION_TIMEOUT_ARCHITECTURE.md` | **NEW** | Complete technical and clinical specification document |

---

## Verification & Validation Protocol

1. **Sliding Timer Extension Test**:
   - Perform clicks, keyboard input, and scrolls at minutes 2, 5, and 8. Verify the 10-minute timer resets each time.
2. **Inactivity Expiration Test**:
   - Leave the browser idle for the full timeout duration.
   - Verify that at 9:00 the 60-second warning banner appears.
   - Verify that at 10:00 `localStorage.getItem('doctor')` is purged and navigation transitions to `/login?expired=true`.
3. **Cross-Tab Synchronization Test**:
   - Open `/directory` in Tab 1 and `/chart/34` in Tab 2.
   - Interact in Tab 2; verify Tab 1's timer is extended.
   - Let both idle; verify both redirect to `/login` simultaneously when 10 minutes elapse.
4. **Build & Parity Test**:
   - Run `npm run build` in `Dentistfrontend` to confirm zero compilation errors.
   - Mirror all changes to both repositories.
