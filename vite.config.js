import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: [
        'chrome >= 80',
        'edge >= 80',
        'firefox >= 78',
        'safari >= 13',
        'not dead'
      ],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderModernChunks: true
    })
  ],
  server: {
    proxy: {
      '/digora': {
        target: 'http://127.0.0.1:5055',
        changeOrigin: true,
        secure: false,
        timeout: 3000,
        proxyTimeout: 3000,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (!res.headersSent && res.writeHead) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ bridgeOnline: false, hasScan: false, note: 'Digora hardware bridge is standby/offline' }));
            }
          });
        }
      },
      '/nanopix': {
        target: 'http://127.0.0.1:5066',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (!res.headersSent && res.writeHead) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ bridgeOnline: false, hasScan: false, note: 'NanoPix hardware bridge is standby' }));
            }
          });
        }
      },
      '/hubs': {
        target: 'https://dentist-api-dev.vitonta.com',
        changeOrigin: true,
        ws: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (!res.headersSent && res.writeHead) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'SignalR Hub proxy unavailable in local dev' }));
            }
          });
        }
      },
      '/api': {
        target: 'https://dentist-api-dev.vitonta.com',
        changeOrigin: true,
        secure: false,
        timeout: 120000,
        proxyTimeout: 120000,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error(`\x1b[31m[PROXY ERROR]\x1b[0m ${req.method} ${req.url} -> Error: ${err.message}`);
            if (!res.headersSent && res.writeHead) {
              res.writeHead(504, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Proxy Gateway Timeout / Connection Error', details: err.message }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const time = new Date().toLocaleTimeString();
            console.log(`\x1b[36m[PROXY REQ ${time}]\x1b[0m ${req.method} ${req.url} ➔ ${options.target}${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const statusColor = proxyRes.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
            console.log(`${statusColor}[PROXY RES]\x1b[0m ${req.method} ${req.url} ➔ Status: ${proxyRes.statusCode} (${proxyRes.headers['content-type'] || 'no-type'})`);
          });
        }
      }
    }
  },
  build: {
    target: ['chrome80', 'es2020'],
    cssTarget: 'chrome80',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
          }
        }
      }
    }
  }
})
