import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://dentist-api-dev.vitonta.com',
        changeOrigin: true,
        secure: false,
        timeout: 10000,
        proxyTimeout: 10000,
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
  }
})
