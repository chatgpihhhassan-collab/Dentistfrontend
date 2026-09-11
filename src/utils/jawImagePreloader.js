/**
 * Background speculative cache-warming utility for dental jaw arch templates.
 * Eliminates visual load delay on Chart and Odontogram views over slow internet connections.
 */

export const JAW_TEMPLATES = [
    // WebP modern high-performance templates (approx. 35KB - 50KB)
    '/empty_maxilla_jaw.webp',
    '/empty_mandible_jaw.webp',
    '/empty_pediatric_maxilla_jaw.webp',
    '/empty_pediatric_mandible_jaw.webp',
    // Fallback JPEG templates (approx. 370KB - 560KB)
    '/empty_maxilla_jaw.jpg',
    '/empty_mandible_jaw.jpg',
    '/empty_pediatric_maxilla_jaw.jpg',
    '/empty_pediatric_mandible_jaw.jpg',
];

const loadedCache = new Set();
const inFlightPromises = new Map();
let hasScheduledIdlePreload = false;

/**
 * Preloads a single image URL into the browser HTTP disk cache and GPU/RAM memory cache.
 * @param {string} url - The URL of the image asset to preload.
 * @returns {Promise<string>}
 */
export function preloadImage(url) {
    if (typeof window === 'undefined') return Promise.resolve(url);
    if (loadedCache.has(url)) return Promise.resolve(url);
    if (inFlightPromises.has(url)) return inFlightPromises.get(url);

    const promise = new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';

        img.onload = () => {
            loadedCache.add(url);
            inFlightPromises.delete(url);
            if ('decode' in img && typeof img.decode === 'function') {
                img.decode().then(() => resolve(url)).catch(() => resolve(url));
            } else {
                resolve(url);
            }
        };

        img.onerror = () => {
            inFlightPromises.delete(url);
            // Non-fatal resolve to allow other assets to continue
            resolve(url);
        };

        img.src = url;
    });

    inFlightPromises.set(url, promise);
    return promise;
}

/**
 * Speculatively warms the cache for all jaw arch templates.
 * Priority: WebP templates first (sub-50ms), then pediatric and legacy fallbacks.
 * @param {Object} [options]
 * @param {boolean} [options.immediate=false] - If true, bypasses requestIdleCallback for instant prefetch (e.g. on pointer hover)
 * @param {string[]} [options.urls] - Custom subset of URLs to preload
 */
export function preloadJawImages({ immediate = false, urls = JAW_TEMPLATES } = {}) {
    if (typeof window === 'undefined') return;

    const executePreload = () => {
        // Run priority batch (adult WebP templates first)
        const primaryTemplates = urls.slice(0, 4);
        const secondaryTemplates = urls.slice(4);

        Promise.allSettled(primaryTemplates.map(preloadImage)).then(() => {
            // Then background fetch secondary/fallbacks during subsequent idle cycles
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => {
                    Promise.allSettled(secondaryTemplates.map(preloadImage));
                }, { timeout: 4000 });
            } else {
                setTimeout(() => {
                    Promise.allSettled(secondaryTemplates.map(preloadImage));
                }, 1000);
            }
        });
    };

    if (immediate) {
        executePreload();
        return;
    }

    if (hasScheduledIdlePreload) return;
    hasScheduledIdlePreload = true;

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(executePreload, { timeout: 2500 });
    } else {
        setTimeout(executePreload, 300);
    }
}

/**
 * Preload specifically for a patient's dentition category on hover or selection.
 * @param {'pediatric' | 'adult' | 'mixed'} dentitionType
 */
export function preloadPatientJawTemplates(dentitionType = 'adult') {
    const isPed = dentitionType === 'pediatric';
    const targets = isPed
        ? [
            '/empty_pediatric_maxilla_jaw.webp',
            '/empty_pediatric_mandible_jaw.webp',
            '/empty_pediatric_maxilla_jaw.jpg',
            '/empty_pediatric_mandible_jaw.jpg'
        ]
        : [
            '/empty_maxilla_jaw.webp',
            '/empty_mandible_jaw.webp',
            '/empty_maxilla_jaw.jpg',
            '/empty_mandible_jaw.jpg'
        ];

    preloadJawImages({ immediate: true, urls: targets });
}

export default preloadJawImages;
