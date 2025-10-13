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
      'react/jsx-runtime',
      '@radix-ui/react-slot',
      '@radix-ui/react-progress',
      'class-variance-authority',
      'clsx',
      'tailwind-merge'
    ],
    exclude: [
      // Exclude large dependencies that should be chunked separately
      'lucide-react'
    ],
    force: false,
    esbuildOptions: {
      target: 'es2020',
      keepNames: false, // Better minification
      treeShaking: true
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
            // React DOM - Split into smaller sub-chunks by internal modules
            if (id.includes('react-dom')) {
              // Split react-dom by common internal paths to create smaller chunks
              if (id.includes('react-dom/client') || id.includes('createRoot')) {
                return 'vendor-react-dom-client';
              }
              if (id.includes('react-dom/server') || id.includes('renderToString')) {
                return 'vendor-react-dom-server';
              }
              if (id.includes('scheduler')) {
                return 'vendor-react-scheduler';
              }
              // Fallback for main react-dom bundle
              return 'vendor-react-dom-core';
            }

            // React core components
            if (id.includes('react/jsx-runtime') || id.includes('jsx-runtime')) {
              return 'vendor-react-jsx';
            }
            if (id.includes('react') && !id.includes('react-dom')) {
              return 'vendor-react-core';
            }

            // Radix UI - Split by component groups to avoid large single chunk
            if (id.includes('@radix-ui')) {
              // Group dialog-related components
              if (id.includes('dialog') || id.includes('alert-dialog') ||
                id.includes('popover') || id.includes('tooltip')) {
                return 'vendor-radix-dialogs';
              }
              // Group form-related components
              if (id.includes('checkbox') || id.includes('radio') ||
                id.includes('select') || id.includes('slider') ||
                id.includes('switch') || id.includes('toggle')) {
                return 'vendor-radix-forms';
              }
              // Group navigation components
              if (id.includes('navigation') || id.includes('menubar') ||
                id.includes('dropdown') || id.includes('context-menu') ||
                id.includes('accordion') || id.includes('tabs')) {
                return 'vendor-radix-navigation';
              }
              // Other radix components
              return 'vendor-radix-core';
            }

            // UI utilities and styling
            if (id.includes('lucide-react')) {
              return 'vendor-lucide-icons';
            }
            if (id.includes('class-variance-authority') || id.includes('clsx') ||
              id.includes('tailwind-merge')) {
              return 'vendor-ui-utils';
            }

            // Animation libraries
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }

            // Large utility libraries (if any)
            if (id.includes('d3') || id.includes('recharts') || id.includes('three') ||
              id.includes('@tanstack')) {
              return 'vendor-large-utils';
            }

            // Date/time utilities
            if (id.includes('react-day-picker') || id.includes('date-fns')) {
              return 'vendor-date-utils';
            }

            // Theme utilities
            if (id.includes('next-themes')) {
              return 'vendor-theme-utils';
            }

            // Other node_modules - catch-all for smaller dependencies
            return 'vendor-misc';
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
    // Adjust chunk size warning limit for React 19 (React DOM core is legitimately large)
    chunkSizeWarningLimit: 1400, // Increased to accommodate React 19 DOM core, while encouraging chunking for other modules
    // Enable tree shaking optimizations
    minify: 'esbuild',
    target: 'es2020',
    // Additional build optimizations
    cssCodeSplit: true,
    emptyOutDir: true,
    reportCompressedSize: false // Faster builds
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
