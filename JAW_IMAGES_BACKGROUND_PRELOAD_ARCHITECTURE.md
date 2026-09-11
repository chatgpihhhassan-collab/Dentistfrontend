# ⚡ Architecture Specification: Background Jaw Template Preloading & Cache-Warming

**Feature:** Background Pre-caching of `/empty_maxilla_jaw.jpg` and `/empty_mandible_jaw.jpg`  
**Target:** Eliminate perceived latency and image load delay on `https://dentistfrontend.vercel.app/chart/:id` over slow internet connections.  
**Trigger:** Background prefetch initiates automatically while doctor is on `/directory` (Patient Directory) and dashboard pages.

---

## 1. Problem Statement & Root Cause

When a clinician navigates directly to `/chart/34`:
1. The chart view immediately renders the Three.js viewport and mounts the jaw template `<img>` tags.
2. The current template images are:
   - `/empty_maxilla_jaw.jpg`: **422.5 KB**
   - `/empty_mandible_jaw.jpg`: **373.2 KB**
   - Combined payload: **~795.7 KB**
3. On a slow 3G or constrained Wi-Fi connection (50–100 KB/s transfer rate), downloading ~800 KB takes **8 to 15 seconds**. During this time, the doctor sees a blank white canvas or a partially rendering jaw arch, creating a jarring, sluggish user experience.

---

## 2. Is It Possible to Load Them on the Directory Page in the Background?

### **YES, 100% Possible — Standard High-Performance Web Architecture**

In modern web applications, clinicians spend **10 to 45 seconds** on `/directory` (searching patient names, filtering records, checking appointments, or selecting teeth treatments) before clicking *"View Odontogram Chart"*.

During this time, the doctor's network connection is **completely idle**. We can silently download and warm the browser's HTTP Disk Cache and In-Memory Image Cache with the jaw templates. When the doctor clicks *"View Odontogram Chart"*, the browser serves the images directly from local memory/disk cache in **0 milliseconds**.

---

## 3. 4-Tier Zero-Latency Solution Architecture

```
                                  DOCTOR BROWSING
                               [/directory /dashboard]
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
Tier 1: HTML5 Native Prefetch                        Tier 2: Idle Worker Preloader
<link rel="prefetch" as="image">                     requestIdleCallback(() => {
Downloads in background during                       preloadJawImages();
idle browser cycles.                                 });
             │                                                     │
             └──────────────────────────┬──────────────────────────┘
                                        ▼
                         BROWSER HTTP & MEMORY CACHE
                          [empty_maxilla_jaw: 0ms]
                         [empty_mandible_jaw: 0ms]
                                        │
                                        ▼
                         DOCTOR NAVIGATES TO /chart/34
                        (Clicks "View Odontogram Chart")
                                        │
                                        ▼
                     INSTANT DISPLAY (0ms Network Request)
                     • No blank canvas
                     • Three.js overlays snap into place instantly
                     • Smooth progressive visual transition
```

### Tier 1: Dedicated Background Image Preloader Utility (`src/utils/jawImagePreloader.js`)
A non-blocking background utility that:
1. Uses `window.requestIdleCallback` (with a `setTimeout` fallback for Safari/older browsers) so it **never** competes with UI rendering, patient searching, or directory typing.
2. Preloads the primary templates:
   - `/empty_maxilla_jaw.jpg`
   - `/empty_mandible_jaw.jpg`
   - `/empty_pediatric_maxilla_jaw.jpg`
   - `/empty_pediatric_mandible_jaw.jpg`
3. Instantiates `new Image()` and sets `.src`, forcing the browser engine to fetch, decode, and store the decompressed bitmap in memory.
4. Includes a singleton guard (`hasPrefetched = true`) so network resources are never duplicated.

### Tier 2: Lifecycle Integration on `PatientDirectory.jsx`
1. **On Page Mount (`useEffect`):** When `/directory` loads, the prefetch worker starts after an unobtrusive 1.5-second delay to prioritize patient list data first.
2. **On Button / Card Hover (`onPointerEnter`):** When the doctor hovers over any patient card or the *"View Odontogram Chart"* button, an immediate high-priority cache-warm event is triggered.

### Tier 3: HTML5 `<link rel="prefetch">` in `index.html`
Add low-priority browser prefetch hints to `<head>`:
```html
<link rel="prefetch" href="/empty_maxilla_jaw.jpg" as="image" />
<link rel="prefetch" href="/empty_mandible_jaw.jpg" as="image" />
```
The browser's native network stack will automatically download these assets in the background during network idle periods across any initial entry page.

### Tier 4: Modern WebP Format Optimization (80% File Size Reduction)
In addition to prefetching, we will generate compressed `.webp` versions:
- `/empty_maxilla_jaw.webp`: **~70 KB** (reduced from 422.5 KB — **83% reduction**)
- `/empty_mandible_jaw.webp`: **~60 KB** (reduced from 373.2 KB — **84% reduction**)

Total download payload drops from **795 KB down to ~130 KB**. On a slow 3G connection, 130 KB downloads in under **1.2 seconds**, meaning even on a cold cache without prefetch, the speed improves by over 5x!

---

## 4. Expected Performance Impact

| Metric | Current Behavior (Slow Network) | With Background Preloading + WebP |
| :--- | :--- | :--- |
| **Initial Jaw Image Download** | 8 – 15 seconds (on `/chart/:id`) | **0 ms (Instant from Cache on `/chart/:id`)** |
| **Directory Page Performance Impact** | None | **Zero (Runs in `requestIdleCallback`)** |
| **Payload Over-the-Wire** | ~800 KB (JPEG) | **~130 KB (WebP)** |
| **Perceived Doctor Experience** | White screen, lagging Three.js mount | **Instantaneous high-resolution odontogram** |

---

## 5. Implementation Files Checklist

1. [NEW] `src/utils/jawImagePreloader.js` (Root & `Dentistfrontend`)
2. [MODIFY] `src/pages/PatientDirectory.jsx` & `Dentistfrontend/src/pages/PatientDirectory.jsx` (Idle prefetch trigger on mount + hover)
3. [MODIFY] `index.html` & `Dentistfrontend/index.html` (Native prefetch links)
4. [MODIFY] `src/components/ThreeDentalJawArch.jsx` & `src/components/InteractiveJawArch.jsx` (Support WebP with JPEG fallback + smooth progressive fade-in)
5. [NEW] Generated WebP assets in `public/` and `Dentistfrontend/public/`
