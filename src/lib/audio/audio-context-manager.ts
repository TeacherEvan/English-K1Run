/**
 * Audio Context Manager Module
 *
 * Handles AudioContext lifecycle, initialization, and platform detection.
 * Extracted from sound-manager.ts for better organization.
 *
 * @module audio/audio-context-manager
 */

import { audioBufferLoader } from "./audio-buffer-loader";
import { audioSpritePlayer } from "./audio-sprite";

/**
 * Audio Context Manager
 * Manages the Web Audio API context and its lifecycle
 */
export class AudioContextManager {
  private audioContext: AudioContext | null = null;
  private initAttempted = false;
  private userInteractionReceived = false;
  private isMobile = false;
  private onReadyCallbacks: Array<() => void> = [];

  constructor() {
    this.detectMobile();
    void this.initializeAudioContext();
    this.setupUserInteractionListener();
  }

  /**
   * Detect if running on a mobile device
   */
  private detectMobile(): void {
    if (typeof navigator === "undefined") {
      this.isMobile = false;
      return;
    }
    const ua = navigator.userAgent.toLowerCase();
    this.isMobile =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);

    if (this.isMobile && import.meta.env.DEV) {
      console.log(
        "[AudioContextManager] Mobile device detected - using Web Audio API",
      );
    }
  }

  /**
   * Set up listener for user interaction to unlock audio
   */
  private setupUserInteractionListener(): void {
    if (typeof document === "undefined") return;

    const handleInteraction = async () => {
      if (this.userInteractionReceived) return;
      this.userInteractionReceived = true;

      if (import.meta.env.DEV) {
        console.log(
          "[AudioContextManager] User interaction detected, initializing...",
        );
      }

      await this.ensureInitialized();

      // Notify callbacks
      this.onReadyCallbacks.forEach((callback) => callback());
      this.onReadyCallbacks = [];

      // Remove listeners
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };

    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });
    document.addEventListener("keydown", handleInteraction, { once: true });
  }

  /**
   * Initialize the AudioContext
   */
  private async initializeAudioContext(): Promise<void> {
    if (this.audioContext || this.initAttempted) return;
    if (typeof window === "undefined") return;
    this.initAttempted = true;

    try {
      const ContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;

      this.audioContext = new ContextClass();

      if (import.meta.env.DEV) {
        console.log(
          "[AudioContextManager] Audio context created, state:",
          this.audioContext.state,
        );
      }

      // Share context with buffer loader
      audioBufferLoader.setAudioContext(this.audioContext);

      // Share with sprite player if enabled
      try {
        audioSpritePlayer.setAudioContext(this.audioContext);
      } catch {
        // Sprite player not configured, ignore
      }
    } catch (error) {
      console.error("[AudioContextManager] Initialization failed:", error);
    }
  }

  /**
   * Ensure AudioContext is initialized and running
   */
  async ensureInitialized(): Promise<void> {
    await this.initializeAudioContext();

    if (this.audioContext && this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
        if (import.meta.env.DEV) {
          console.log("[AudioContextManager] Audio context resumed");
        }
      } catch (error) {
        console.error("[AudioContextManager] Failed to resume:", error);
      }
    }
  }

  /**
   * Get the current AudioContext
   */
  getContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Check if the context is initialized
   */
  isInitialized(): boolean {
    return this.audioContext !== null && this.audioContext.state === "running";
  }

  /**
   * Check if on mobile device
   */
  isMobileDevice(): boolean {
    return this.isMobile;
  }

  /**
   * Register a callback to be called when audio is ready
   */
  onReady(callback: () => void): void {
    if (this.userInteractionReceived && this.isInitialized()) {
      callback();
    } else {
      this.onReadyCallbacks.push(callback);
    }
  }
}

// Export singleton instance
export const audioContextManager = new AudioContextManager();
