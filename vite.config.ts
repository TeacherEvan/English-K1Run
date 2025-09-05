import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path'

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
    }
  },
  css: {
    devSourcemap: true
  },
  assetsInclude: ['**/*.css']
});
