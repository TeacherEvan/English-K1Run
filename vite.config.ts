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
    watch: {},
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
          const normalizedId = id.replace(/\\/g, "/");
          const useSingleVendorChunk = true;

          // Create vendor chunk for node_modules with intelligent splitting
          if (normalizedId.includes("/node_modules/")) {
            // Simplify to a single vendor chunk to avoid runtime ordering issues
            if (useSingleVendorChunk) {
              return "vendor";
            }

            // CRITICAL FIX: Group EVERYTHING related to the React framework into one chunk.
            // Must handle pnpm paths like: node_modules/.pnpm/react@x/node_modules/react/...
            // IMPORTANT: Include i18next and react-i18next to prevent module loading order issues
            // in Vite 7 where vendor-other might load before vendor-react
            const reactRuntimePattern =
              /\/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(react|react-dom|scheduler|react-is|react-error-boundary|react-i18next|i18next|lucide-react|i18next-browser-languagedetector)\//;
            const isReactRuntime =
              reactRuntimePattern.test(normalizedId) ||
              normalizedId.includes("/node_modules/react/jsx-runtime") ||
              normalizedId.includes("/node_modules/react/jsx-dev-runtime");

            if (isReactRuntime) {
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
