/**
 * Encapsulates welcome screen audio, timing, and interaction flow.
 * Used by `WelcomeScreen` to keep the component focused on rendering.
 */
import { useWelcomeAudioSequence } from "@/components/welcome/use-welcome-audio-sequence";
import {
  getWelcomePhase,
  isWelcomeInteractionLocked,
  type WelcomePhase,
} from "@/components/welcome/welcome-phase";
import {
  stopWelcomeSequence,
  type WelcomeAudioConfig,
  type WelcomePlaybackDiagnostic,
} from "@/lib/audio/welcome-audio-sequencer";
import { soundManager } from "@/lib/sound-manager";
import { startTransition, useCallback, useEffect, useState } from "react";

interface WelcomeSequenceOptions {
  onComplete: () => void;
  audioConfig?: Partial<WelcomeAudioConfig>;
}

export interface WelcomeSequenceState {
  fadeOut: boolean;
  phase: WelcomePhase;
  readyToContinue: boolean;
  isSequencePlaying: boolean;
  videoLoaded: boolean;
  showFallbackImage: boolean;
  currentAudioIndex: number;
  totalAudioCount: number;
  lastDiagnostic: WelcomePlaybackDiagnostic | null;
  handlePrimaryAction: () => void;
  handleVideoCanPlay: () => void;
  handleVideoEnded: () => void;
  handleVideoError: () => void;
}

export const useWelcomeSequence = ({
  onComplete,
  audioConfig,
}: WelcomeSequenceOptions): WelcomeSequenceState => {
  const [fadeOut, setFadeOut] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showFallbackImage, setShowFallbackImage] = useState(false);

  const isE2E =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("e2e");

  const {
    readyToContinue,
    isSequencePlaying,
    currentAudioIndex,
    totalAudioCount,
    lastDiagnostic,
    requestStart,
    markReadyToContinue,
  } = useWelcomeAudioSequence({ audioConfig, isE2E });

  const phase = getWelcomePhase({
    fadeOut,
    readyToContinue,
    isSequencePlaying,
  });

  const proceed = useCallback(() => {
    stopWelcomeSequence();
    soundManager.fadeOutAll(350);
    startTransition(() => setFadeOut(true));
    setTimeout(onComplete, 350);
  }, [onComplete]);

  const handlePrimaryAction = useCallback(() => {
    if (fadeOut || isWelcomeInteractionLocked(phase)) {
      return;
    }

    if (isE2E) {
      proceed();
      return;
    }

    if (!readyToContinue) {
      requestStart();
      return;
    }

    proceed();
  }, [fadeOut, isE2E, phase, proceed, readyToContinue, requestStart]);

  useEffect(() => {
    if (!isE2E) return;
    const readyTimer = setTimeout(markReadyToContinue, 0);
    const completeTimer = setTimeout(onComplete, 500);
    return () => {
      clearTimeout(readyTimer);
      clearTimeout(completeTimer);
    };
  }, [isE2E, markReadyToContinue, onComplete]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handlePrimaryAction();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [handlePrimaryAction]);

  // Don't auto-start audio on video load - wait for user interaction
  // to comply with browser autoplay policies
  useEffect(() => {
    if (!videoLoaded || isE2E) return;
    if (import.meta.env.DEV) {
      console.log("[WelcomeScreen] Video loaded, ready for user interaction");
    }
    // Audio will start when user taps via handlePrimaryAction
  }, [isE2E, videoLoaded]);

  useEffect(
    () => () => {
      stopWelcomeSequence();
      soundManager.fadeOutAll(250);
    },
    [],
  );

  const handleVideoCanPlay = useCallback(() => setVideoLoaded(true), []);
  const handleVideoEnded = useCallback(() => {
    setShowFallbackImage(true);
    markReadyToContinue();
  }, [markReadyToContinue]);
  const handleVideoError = useCallback(() => setVideoLoaded(false), []);

  return {
    fadeOut,
    phase,
    readyToContinue,
    isSequencePlaying,
    videoLoaded,
    showFallbackImage,
    currentAudioIndex,
    totalAudioCount,
    lastDiagnostic,
    handlePrimaryAction,
    handleVideoCanPlay,
    handleVideoEnded,
    handleVideoError,
  };
};
