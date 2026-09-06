import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// When deployed on Vercel, route all /api calls directly from the browser to the remote backend
if (typeof window !== 'undefined' && !window.location.hostname.includes('vitonta.com') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  const API_HOST = 'https://dentist-api-dev.vitonta.com';
  axios.defaults.baseURL = API_HOST;

  const originalFetch = window.fetch;
  window.fetch = function (resource, init) {
    if (typeof resource === 'string' && resource.startsWith('/api')) {
      resource = API_HOST + resource;
    }
    return originalFetch.call(this, resource, init);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
