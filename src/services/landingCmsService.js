/**
 * 🦷 Dentia Platform: Landing Page CMS Service
 * Connects frontend views (LandingDashboard, Navigation, Footer) to the dynamic
 * landing configuration managed by the clinic doctor in ClinicWebsiteStudio.
 */

import {
  DEFAULT_LANDING_CONFIG,
  getStoredLandingConfig,
  saveStoredLandingConfig,
  resetLandingConfig,
  LANDING_CONFIG_UPDATE_EVENT
} from '../config/landingConfigDefaults';
import apiFetch from '../utils/apiClient';

class LandingCmsService {
  constructor() {
    this.currentConfig = getStoredLandingConfig();
    this.listeners = new Set();

    if (typeof window !== 'undefined') {
      window.addEventListener(LANDING_CONFIG_UPDATE_EVENT, (event) => {
        this.currentConfig = event.detail || getStoredLandingConfig();
        this.notifyListeners();
      });

      // Synchronize across multiple browser tabs
      window.addEventListener('storage', (event) => {
        if (event.key === 'dentia_clinic_landing_config') {
          this.currentConfig = getStoredLandingConfig();
          this.notifyListeners();
        }
      });
    }
  }

  /**
   * Get current landing page configuration synchronously (instant render)
   */
  getConfig() {
    return this.currentConfig || getStoredLandingConfig();
  }

  /**
   * Fetch configuration from backend API if available, falling back to local storage
   */
  async fetchConfigFromBackend() {
    try {
      const response = await apiFetch('/api/clinic/landing-config');
      if (response && response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object') {
          const merged = {
            ...DEFAULT_LANDING_CONFIG,
            ...data
          };
          saveStoredLandingConfig(merged);
          this.currentConfig = merged;
          this.notifyListeners();
          return merged;
        }
      }
    } catch (err) {
      // Backend endpoint may be optional/offline in some dev environments
      console.log('[landingCmsService] Remote config not fetched, using local storage.');
    }
    return this.getConfig();
  }

  /**
   * Save configuration to local storage and sync to backend API
   */
  async saveConfig(newConfig) {
    const success = saveStoredLandingConfig(newConfig);
    this.currentConfig = getStoredLandingConfig();
    this.notifyListeners();

    // Async attempt to push to backend
    try {
      await apiFetch('/api/clinic/landing-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.currentConfig)
      }).catch(() => null);
    } catch (err) {
      console.warn('[landingCmsService] Backend sync failed, local changes preserved.');
    }

    return success;
  }

  /**
   * Reset configuration to initial defaults
   */
  resetConfig() {
    const def = resetLandingConfig();
    this.currentConfig = def;
    this.notifyListeners();
    return def;
  }

  /**
   * Subscribe to live configuration changes
   */
  subscribe(callback) {
    if (typeof callback !== 'function') return () => {};
    this.listeners.add(callback);
    // Initial call
    callback(this.currentConfig);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentConfig);
      } catch (err) {
        console.error('[landingCmsService] Listener error:', err);
      }
    });
  }
}

export const landingCmsService = new LandingCmsService();
export default landingCmsService;
