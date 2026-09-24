import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { recordDoctorActivity } from './components/IdleSessionManager'

// Global API Configuration & Token Authorization Interceptors
const API_HOST = 'https://dentist-api-dev.vitonta.com';
const isRemoteHostNeeded = typeof window !== 'undefined' && 
  !window.location.hostname.includes('vitonta.com') && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1';

// Auto-recover from dynamic chunk load failures when a new version is deployed to Vercel
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Vite] Dynamic chunk preload failed due to a new deployment. Auto-refreshing page...');
    event.preventDefault();
    const reloadKey = 'dentia_chunk_reload_' + window.location.pathname;
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, Date.now().toString());
      window.location.reload();
    }
  });
}

if (isRemoteHostNeeded) {
  axios.defaults.baseURL = API_HOST;
}

// Intercept Axios requests to attach Authorization header and record activity
axios.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('doctor');
    if (stored) {
      const doctor = JSON.parse(stored);
      if (doctor && doctor.token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${doctor.token}`;
        recordDoctorActivity();
      }
    }
  } catch {}
  return config;
});

// Intercept Axios responses for 401 Unauthorized
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && !error.config?.url?.includes('/api/auth/login')) {
      localStorage.removeItem('doctor');
      localStorage.removeItem('dentia_last_active');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Intercept window.fetch to automatically attach Authorization header and redirect on 401
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (resource, init = {}) {
    let url = typeof resource === 'string' ? resource : (resource?.url || '');

    // Prefix API_HOST when running on Vercel or external origin
    if (isRemoteHostNeeded && typeof resource === 'string' && resource.startsWith('/api')) {
      resource = API_HOST + resource;
    }

    // Attach doctor token if logged in
    let doctor = null;
    try {
      const stored = localStorage.getItem('doctor');
      if (stored) doctor = JSON.parse(stored);
    } catch {}

    if (doctor && doctor.token) {
      init = init || {};
      if (!init.headers) {
        init.headers = {};
      }
      if (init.headers instanceof Headers) {
        if (!init.headers.has('Authorization')) {
          init.headers.set('Authorization', `Bearer ${doctor.token}`);
        }
      } else if (Array.isArray(init.headers)) {
        init.headers.push(['Authorization', `Bearer ${doctor.token}`]);
      } else {
        init.headers['Authorization'] = init.headers['Authorization'] || `Bearer ${doctor.token}`;
      }
      recordDoctorActivity();
    }

    return originalFetch.call(this, resource, init).then((response) => {
      if (response.status === 401 && typeof url === 'string' && url.includes('/api/') && !url.includes('/api/auth/login')) {
        localStorage.removeItem('doctor');
        localStorage.removeItem('dentia_last_active');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
      return response;
    });
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
