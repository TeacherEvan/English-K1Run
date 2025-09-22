import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from 'path';
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve('./src')
    }
  },
  server: {
    fs: {
      strict: false
    },
    headers: {
      'Cache-Control': 'no-cache'
    },
    host: 'localhost',
    port: 5173,
    strictPort: false,
    watch: {
      usePolling: true,
      interval: 100
    },
    hmr: {
      overlay: true,
      port: 5173,
      host: 'localhost'
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@radix-ui/react-slot',
      '@radix-ui/react-progress',
      '@radix-ui/react-card'
    ],
    force: false,
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    sourcemap: 'inline',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined,
        sourcemap: 'inline'
      }
    }
  },
  css: {
    devSourcemap: false
  },
  assetsInclude: [
    '**/*.css',
    '**/*.woff',
    '**/*.woff2',
    '**/*.ttf',
    '**/*.eot',
    '**/*.mp3',
    '**/*.wav',
    '**/*.ogg'
  ],
  clearScreen: false
});
