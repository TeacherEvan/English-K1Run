/**
 * Home Menu Audio Hook
 *
 * Plays only the mission-complete sticker line when returning to home menu.
 * Non-instruction menu audio is intentionally disabled.
 *
 * @module hooks/use-home-menu-audio
 */

import { useEffect, useRef } from "react";
import { audioContextManager } from "../lib/audio/audio-context-manager";
import { playSoundEffect } from "../lib/sound-manager";
import { consumeMissionCompleteStickerPending } from "./home-menu-audio-state";

/**
 * Custom hook to play mission completion sticker audio when home menu loads
 *
 * Features:
 * - Plays only after mission completion
 * - Plays once per pending mission completion marker
 * - Gracefully handles audio context suspension
 * - Non-blocking (errors won't prevent menu interaction)
 * - Automatic cleanup on unmount
 */
export const useHomeMenuAudio = () => {
  const audioPlayedRef = useRef(false);

  useEffect(() => {
    if (audioPlayedRef.current) return;
    const shouldPlaySticker = consumeMissionCompleteStickerPending();
    if (!shouldPlaySticker) {
      return;
    }

    audioPlayedRef.current = true;

    const playSticker = async () => {
      try {
        const context = audioContextManager.getContext();
        if (context?.state === "suspended") {
          await context.resume();
        }

        if (import.meta.env.DEV) {
          console.log("[HomeMenuAudio] Playing mission-complete sticker audio");
        }

        await playSoundEffect.sticker();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn(
            "[HomeMenuAudio] Sticker playback failed:",
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    };

    const timer = setTimeout(() => {
      void playSticker();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, []);
};
