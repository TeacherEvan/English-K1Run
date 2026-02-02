/**
 * Home Menu Audio Hook
 *
 * Plays "in association with Sangsom Kindergarten" audio sequence
 * automatically when the home menu is displayed.
 *
 * Sequence:
 * 1. English: "In association with Sangsom Kindergarten"
 * 2. Thai: "ร่วมกับโรงเรียนอนุบาลสังสม"
 *
 * Note: Requires audio files to be present in public/sounds/:
 * - welcome_sangsom_association.mp3
 * - welcome_sangsom_association_thai.mp3
 *
 * @module hooks/use-home-menu-audio
 */

import { useEffect, useRef } from "react";
import { audioContextManager } from "../lib/audio/audio-context-manager";
import { soundManager } from "../lib/sound-manager";

/**
 * Custom hook to play association audio when home menu loads
 *
 * Features:
 * - Plays only once per mount
 * - Gracefully handles audio context suspension
 * - Non-blocking (errors won't prevent menu interaction)
 * - Automatic cleanup on unmount
 * - Handles missing audio files gracefully with fallback
 */
export const useHomeMenuAudio = () => {
  const audioPlayedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate playback
    if (audioPlayedRef.current) return;
    audioPlayedRef.current = true;

    // Play sequence after small delay to ensure audio context is ready
    const playSequence = async () => {
      try {
        // Ensure AudioContext is ready
        const context = audioContextManager.getContext();
        if (context?.state === "suspended") {
          if (import.meta.env.DEV) {
            console.log("[HomeMenuAudio] Resuming suspended AudioContext");
          }
          await context.resume();
        }

        // Play English version (ElevenLabs Sangsom association)
        if (import.meta.env.DEV) {
          console.log("[HomeMenuAudio] Playing English association message");
        }
        
        try {
          await soundManager.playSound("welcome_sangsom_association", 1.0, 0.85);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn(
              "[HomeMenuAudio] English association audio not available:",
              error instanceof Error ? error.message : String(error),
              "\nMake sure welcome_sangsom_association.mp3 exists in public/sounds/"
            );
          }
        }

        // 300ms pause between languages
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Play Thai version (ElevenLabs Sangsom association)
        if (import.meta.env.DEV) {
          console.log("[HomeMenuAudio] Playing Thai association message");
        }
        
        try {
          await soundManager.playSound(
            "welcome_sangsom_association_thai",
            0.9,
            0.85,
          );
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn(
              "[HomeMenuAudio] Thai association audio not available:",
              error instanceof Error ? error.message : String(error),
              "\nMake sure welcome_sangsom_association_thai.mp3 exists in public/sounds/"
            );
          }
        }

        if (import.meta.env.DEV) {
          console.log("[HomeMenuAudio] Audio sequence completed");
        }
      } catch (error) {
        // Non-blocking error - log but don't throw
        if (import.meta.env.DEV) {
          console.warn(
            "[HomeMenuAudio] Audio playback sequence failed:",
            error instanceof Error ? error.message : String(error),
            "\nThis is non-critical - menu will function normally."
          );
        }
      }
    };

    // Start playback after 500ms delay to avoid audio context issues
    const timer = setTimeout(playSequence, 500);

    return () => {
      clearTimeout(timer);
      // Note: Don't stop audio on unmount - let it complete naturally
    };
  }, []);
};
