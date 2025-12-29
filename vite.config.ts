import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    fs: {
      strict: false,
    },
    headers: {
      "Cache-Control": "no-cache",
    },
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      overlay: true,
      port: 5173,
      host: "localhost",
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@radix-ui/react-slot",
      "@radix-ui/react-progress",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "lucide-react",
    ],
    force: false,
    esbuildOptions: {
      target: "es2020",
      keepNames: false, // Better minification
      treeShaking: true,
      // Enable modern JS optimizations
      legalComments: "none",
      minify: true,
    },
  },
  build: {
    sourcemap: false,
    // Enable faster builds with modern targets
    target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],
    rollupOptions: {
      external: [],
      output: {
        manualChunks(id) {
          // Create vendor chunk for node_modules with intelligent splitting
          if (id.includes("node_modules")) {
            // Consolidate all React-related packages into a single chunk for stability
            // React 19 is sensitive to internal module splitting
            if (id.includes("react") || id.includes("scheduler")) {
              return "vendor-react";
            }

            // Radix UI - Group all Radix components together for better stability
            if (id.includes("@radix-ui")) {
              return "vendor-radix";
            }

            // UI utilities and styling
            if (id.includes("lucide-react")) {
              return "vendor-lucide-icons";
            }
            if (
              id.includes("class-variance-authority") ||
              id.includes("clsx") ||
              id.includes("tailwind-merge")
            ) {
              return "vendor-ui-utils";
            }

            // Animation libraries
            if (id.includes("framer-motion")) {
              return "vendor-animation";
            }

            // Large utility libraries (if any)
            if (
              id.includes("d3") ||
              id.includes("recharts") ||
              id.includes("three") ||
              id.includes("@tanstack")
            ) {
              return "vendor-large-utils";
            }

            // Date/time utilities
            if (id.includes("react-day-picker") || id.includes("date-fns")) {
              return "vendor-date-utils";
            }

            // Theme utilities
            if (id.includes("next-themes")) {
              return "vendor-theme-utils";
            }

            // Other node_modules - catch-all for smaller dependencies
            return "vendor-misc";
          }

          // Create separate chunks for large application modules
          if (id.includes("src/components")) {
            if (id.includes("ui/")) {
              return "ui-components";
            }
            return "game-components";
          }
          if (id.includes("src/hooks")) {
            return "game-hooks";
          }
          if (id.includes("src/lib")) {
            // Split utilities separately for better caching
            if (id.includes("utils/")) {
              return "app-utils";
            }
            return "game-utils";
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: () => {
          return `assets/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name!.split(".");
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
        },
      },
    },
    // Adjust chunk size warning limit for React 19 (React DOM core is legitimately large)
    chunkSizeWarningLimit: 1400, // Increased to accommodate React 19 DOM core, while encouraging chunking for other modules
    // Enable tree shaking optimizations
    minify: "esbuild",
    // Additional build optimizations
    cssCodeSplit: true,
    cssMinify: true,
    emptyOutDir: true,
    reportCompressedSize: false, // Faster builds
    // Enable modern module preloading
    modulePreload: {
      polyfill: true,
    },
  },
  css: {
    devSourcemap: false,
    // Enable CSS module optimization
    modules: {
      localsConvention: "camelCase",
    },
  },
  assetsInclude: [
    "**/*.woff",
    "**/*.woff2",
    "**/*.ttf",
    "**/*.eot",
    "**/*.mp3",
    "**/*.wav",
    "**/*.ogg",
  ],
  clearScreen: false,
  // Enable JSON optimization
  json: {
    stringify: true, // Faster JSON imports
  },
});
