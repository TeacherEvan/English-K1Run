import type { VitePWAOptions } from "vite-plugin-pwa";

export const englishK1RunPwaConfig: VitePWAOptions = {
  registerType: "autoUpdate",
  includeAssets: [
    "favicon.ico",
    "favicon.svg",
    "icons/icon-192x192.png",
    "og-image.png",
  ],
  manifest: {
    name: "English K1 Run",
    short_name: "English K1 Run",
    description:
      "A teacher-launched, child-played classroom vocabulary game for kindergarten learners to build listening, recognition, and confidence through quick touch-friendly rounds.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "landscape",
    theme_color: "#fff8ed",
    background_color: "#fff8ed",
    categories: ["education", "games", "kids"],
    lang: "en-US",
    dir: "ltr",
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,ttf,eot}"],
    globIgnores: [
      "**/welcome-sangsom.png",
      "**/Gemini_Generated_Image_895eeq895eeq895e.png",
      "**/backgrounds/**",
    ],
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    runtimeCaching: [
      {
        urlPattern: /\.(?:wav|mp3|ogg)$/i,
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
      {
        urlPattern:
          /\/(?:backgrounds\/.*\.(?:jpg|jpeg|png|webp)|welcome-sangsom\.png)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "classroom-image-cache-v1",
          cacheableResponse: { statuses: [0, 200] },
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 30 * 24 * 60 * 60,
            purgeOnQuotaError: true,
          },
        },
      },
    ],
  },
};
