/// <reference types="vite/client" />

// Global window extensions
declare global {
  interface Window {
    __APP_BOOTED__?: boolean;
  }
}

export {};
