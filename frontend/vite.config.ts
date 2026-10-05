import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'ascend-tts-middleware',
      configureServer(server) {
        server.middlewares.use('/api/tts', async (req, res) => {
          try {
            const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
            const text = urlObj.searchParams.get('text') || urlObj.searchParams.get('q') || '';
            if (!text.trim()) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Text query parameter is required' }));
              return;
            }

            // Split into sentences / phrase chunks <= 150 characters
            const chunks: string[] = [];
            let remaining = text.trim();
            while (remaining.length > 0) {
              if (remaining.length <= 150) {
                chunks.push(remaining);
                break;
              }
              let idx = remaining.lastIndexOf('.', 150);
              if (idx === -1) idx = remaining.lastIndexOf('?', 150);
              if (idx === -1) idx = remaining.lastIndexOf('!', 150);
              if (idx === -1) idx = remaining.lastIndexOf(',', 150);
              if (idx === -1) idx = remaining.lastIndexOf(' ', 150);
              if (idx === -1) idx = 150;
              chunks.push(remaining.substring(0, idx + 1).trim());
              remaining = remaining.substring(idx + 1).trim();
            }

            const buffers: Buffer[] = [];
            for (const chunk of chunks) {
              if (!chunk) continue;
              const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=en&client=tw-ob`;
              const ttsRes = await fetch(ttsUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              });
              if (ttsRes.ok) {
                const arrayBuffer = await ttsRes.arrayBuffer();
                buffers.push(Buffer.from(arrayBuffer));
              }
            }

            if (buffers.length === 0) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to fetch TTS audio chunks' }));
              return;
            }

            const combined = Buffer.concat(buffers);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Length', combined.length.toString());
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.end(combined);
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Internal TTS server error' }));
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-spline': ['@splinetool/react-spline', '@splinetool/runtime'],
          'vendor-recharts': ['recharts'],
          'vendor-motion': ['framer-motion', 'gsap'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});

