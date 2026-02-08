/**
 * Global typings for sound manager debug state.
 */

declare global {
  interface Window {
    __audioDebug?: {
      active: number;
      current: number;
      peak: number;
      total: number;
      lastSound?: string;
    };
  }
}

export {};
