import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "apple-touch-icon.png",
        "og-image.png",
        "welcome-sangsom.png",
        "backgrounds/**",
      ],
      manifest: {
        name: "Kindergarten Race - Educational Game",
        short_name: "K-Race",
        description:
          "An engaging educational racing game where students compete by identifying falling objects. Perfect for kindergarten students to learn pattern recognition while having fun!",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "landscape",
        theme_color: "#6366f1",
        background_color: "#ffffff",
        categories: ["education", "games", "kids"],
        lang: "en-US",
        dir: "ltr",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,ttf,eot}"],
        // Increase limit to 10MB for large background images
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\\.(?:wav|mp3|ogg)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "audio-cache-v2",
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 250,
                maxAgeSeconds: 90 * 24 * 60 * 60,
                purgeOnQuotaError: true,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
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
    ],
    force: false,
    esbuildOptions: {
      target: "chrome87", // Chrome Android compatibility
      keepNames: false, // Better minification
      treeShaking: true,
      // Enable modern JS optimizations
      legalComments: "none",
      minify: true,
      platform: "browser",
      format: "esm",
    },
    exclude: [],
  },
  build: {
    sourcemap: false,
    // Prioritize Chrome Android for classroom tablets
    target: [
      "chrome87",
      "chrome90",
      "es2020",
      "edge88",
      "firefox78",
      "safari14",
    ],
    rollupOptions: {
      external: [],
      output: {
        manualChunks(id) {
          // Create vendor chunk for node_modules with intelligent splitting
          if (id.includes("node_modules")) {
            // CRITICAL FIX: Keep ALL React packages together in ONE chunk
            // React 19 requires react, react-dom, scheduler, and jsx-runtime to be in the same chunk
            // Splitting them causes "useLayoutEffect of undefined" errors
            if (
              id.includes("react") ||
              id.includes("scheduler") ||
              id.includes("react-dom") ||
              id.includes("jsx-runtime") ||
              id.includes("react-error-boundary")
            ) {
              return "vendor-react";
            }

            // Radix UI - Group all Radix components together for better stability
            if (id.includes("@radix-ui")) {
              return "vendor-radix";
            }

            // UI utilities and styling - CONSOLIDATED to prevent circular deps
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

            // Other node_modules - minimal catch-all
            // This prevents circular dependency issues from overly granular splitting
            return "vendor-other";
          }

          // Application code chunking (lighter strategy)
          if (id.includes("src/components")) {
            if (id.includes("ui/")) {
              return "app-ui";
            }
            return "app-components";
          }
          if (id.includes("src/hooks")) {
            return "app-hooks";
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
