/**
 * High-performance In-Memory Stale-While-Revalidate (SWR) API Cache.
 * Provides instant 0ms responses for clinical directory, charts, and odontograms.
 */

const memoryCache = new Map();
const inFlightRequests = new Map();

const DEFAULT_TTL_MS = 3 * 60 * 1000; // 3 minutes default

/**
 * Retrieves data from cache or fetches from API with SWR (Stale-While-Revalidate).
 * @param {string} key - Unique cache key
 * @param {Function} fetcher - Async function returning fresh data
 * @param {Object} [options]
 * @param {number} [options.ttlMs=180000] - Time to live in milliseconds
 * @param {boolean} [options.revalidateOnStale=true] - Revalidate in background if stale
 * @param {boolean} [options.forceFresh=false] - Bypass cache and fetch fresh
 * @returns {Promise<{ data: any, fromCache: boolean, isStale: boolean }>}
 */
export async function fetchWithCache(key, fetcher, options = {}) {
    const {
        ttlMs = DEFAULT_TTL_MS,
        revalidateOnStale = true,
        forceFresh = false
    } = options;

    const now = Date.now();
    const cached = memoryCache.get(key);

    // 1. Fresh Cache Hit -> Instant Return (0ms)
    if (!forceFresh && cached) {
        const isExpired = now - cached.timestamp > ttlMs;

        if (!isExpired) {
            return { data: cached.data, fromCache: true, isStale: false };
        }

        // Cache is stale: return stale data immediately (0ms), revalidate in background
        if (revalidateOnStale) {
            triggerBackgroundRevalidation(key, fetcher);
            return { data: cached.data, fromCache: true, isStale: true };
        }
    }

    // 2. In-flight request deduplication
    if (inFlightRequests.has(key)) {
        const data = await inFlightRequests.get(key);
        return { data, fromCache: false, isStale: false };
    }

    // 3. Fetch fresh
    const requestPromise = fetcher()
        .then((data) => {
            memoryCache.set(key, { data, timestamp: Date.now() });
            inFlightRequests.delete(key);
            return data;
        })
        .catch((err) => {
            inFlightRequests.delete(key);
            // If fetch fails but we have stale data, fallback to stale data gracefully
            if (cached) {
                return cached.data;
            }
            throw err;
        });

    inFlightRequests.set(key, requestPromise);
    const data = await requestPromise;
    return { data, fromCache: false, isStale: false };
}

/**
 * Silently revalidates stale cache in background off the main UI loop.
 */
function triggerBackgroundRevalidation(key, fetcher) {
    if (inFlightRequests.has(key)) return;

    const promise = fetcher()
        .then((data) => {
            memoryCache.set(key, { data, timestamp: Date.now() });
            inFlightRequests.delete(key);
        })
        .catch(() => {
            inFlightRequests.delete(key);
        });

    inFlightRequests.set(key, promise);
}

/**
 * Read directly from cache synchronously.
 */
export function getCachedData(key) {
    const entry = memoryCache.get(key);
    return entry ? entry.data : null;
}

/**
 * Set cache value directly (e.g. optimistic updates).
 */
export function setCachedData(key, data) {
    memoryCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Invalidate specific cache key or keys matching prefix/pattern.
 * @param {string | RegExp} [pattern]
 */
export function invalidateCache(pattern) {
    if (!pattern) {
        memoryCache.clear();
        return;
    }

    for (const key of memoryCache.keys()) {
        if (typeof pattern === 'string') {
            if (key === pattern || key.startsWith(pattern) || key.includes(pattern)) {
                memoryCache.delete(key);
            }
        } else if (pattern instanceof RegExp) {
            if (pattern.test(key)) {
                memoryCache.delete(key);
            }
        }
    }
}

/**
 * Speculative prefetch for predictive hover interaction.
 */
export function prefetchApi(key, fetcher, ttlMs = DEFAULT_TTL_MS) {
    if (memoryCache.has(key) || inFlightRequests.has(key)) return;
    triggerBackgroundRevalidation(key, fetcher);
}

export default {
    fetchWithCache,
    getCachedData,
    setCachedData,
    invalidateCache,
    prefetchApi
};
