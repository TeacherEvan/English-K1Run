import type { VitePWAOptions } from "vite-plugin-pwa";

export const englishK1RunPwaConfig: VitePWAOptions = {
  registerType: "autoUpdate",
  includeAssets: [
    "favicon.ico",
    "favicon.svg",
    "apple-touch-icon.png",
    "og-image.png",
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
