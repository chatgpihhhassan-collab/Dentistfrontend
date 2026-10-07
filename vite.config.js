import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import tailwindcss from '@tailwindcss/vite'
import { spawn, exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import http from 'http'


function nanopixHardwarePlugin() {
  const launchEighteethUi = () => {
    const userHome = os.homedir();
    const candidateLaunchers = [
      path.join(userHome, 'Downloads', 'NanoPix', 'NanoPix', '1.1.1.9', 'NanoPix.exe'),
      'C:\\NanoPix\\1.1.1.9\\NanoPix.exe',
      path.resolve(process.cwd(), 'drivers', 'eighteeth_engine', '1.1.1.9', 'NanoPix.exe'),
      path.resolve(process.cwd(), 'drivers', 'eighteeth_engine', 'NanoPix.exe'),
      path.join(userHome, 'Downloads', 'NanoPix', 'NanoPix', 'Launch.exe'),
      'C:\\NanoPix\\Launch.exe'
    ];

    const targetExe = candidateLaunchers.find(p => p && fs.existsSync(p));
    if (targetExe) {
      const workingDir = path.dirname(targetExe);
      console.log(`\x1b[35m[VITE HARDWARE]\x1b[0m 🚀 Launching Eighteeth Official UI on Desktop: ${targetExe}`);
      
      try {
        exec('taskkill /F /IM NanoPix.exe /T', () => {
          const cmd = `cmd /c start "" /d "${workingDir}" "${targetExe}"`;
          exec(cmd);
        });
        return true;
      } catch (e) {
        const cmd = `cmd /c start "" /d "${workingDir}" "${targetExe}"`;
        exec(cmd);
        return true;
      }
    }
    return false;
  };

  return {
    name: 'vite-plugin-nanopix-hardware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/nanopix/launch-engine') {
          const launched = launchEighteethUi();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            launched,
            message: launched ? 'Eighteeth UI successfully launched on desktop.' : 'Eighteeth executable not found.'
          }));
          return;
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nanopixHardwarePlugin(),
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
