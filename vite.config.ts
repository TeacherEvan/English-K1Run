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
      '@radix-ui/react-progress'
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
        manualChunks(id) {
          // Create vendor chunk for node_modules
          if (id.includes('node_modules')) {
            // Split React into smaller chunks to avoid large bundle warning
            if (id.includes('react-dom')) {
              return 'vendor-react-dom';
            }
            if (id.includes('react/jsx-runtime')) {
              return 'vendor-react-jsx';
            }
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react-core';
            }
            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            // Animation and styling libraries
            if (id.includes('framer-motion') || id.includes('lucide-react') ||
              id.includes('class-variance-authority') || id.includes('clsx') ||
              id.includes('tailwind-merge')) {
              return 'vendor-ui-utils';
            }
            // Large utility libraries
            if (id.includes('d3') || id.includes('recharts') || id.includes('three') ||
              id.includes('@tanstack')) {
              return 'vendor-large-utils';
            }
            // Other node_modules
            return 'vendor-other';
          }
          // Create separate chunks for large application modules
          if (id.includes('src/components')) {
            if (id.includes('ui/')) {
              return 'ui-components';
            }
            return 'game-components';
          }
          if (id.includes('src/hooks')) {
            return 'game-hooks';
          }
          if (id.includes('src/lib')) {
            return 'game-utils';
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: () => {
          return `assets/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name!.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash].[ext]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash].[ext]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash].[ext]`;
          }
          return `assets/[name]-[hash].[ext]`;
        }
      }
    },
    // Increase chunk size warning limit (React 19 is legitimately large)
    chunkSizeWarningLimit: 1500,
    // Enable tree shaking optimizations
    minify: 'esbuild',
    target: 'es2020'
  },
  css: {
    devSourcemap: false
  },
  assetsInclude: [
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
