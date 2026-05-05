/**
 * Encapsulates welcome screen audio, timing, and interaction flow.
 * Used by `WelcomeScreen` to keep the component focused on rendering.
 */
import { attemptIntroVideoPlay } from "@/components/welcome/attempt-intro-video-play";
import { createIntroPlaybackGate } from "@/components/welcome/intro-playback-gate";
import { useWelcomeKeyboardShortcut } from "@/components/welcome/use-welcome-keyboard-shortcut";
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
import { startTransition, useCallback, useEffect, useRef, useState } from "react";

interface WelcomeSequenceOptions {
  onComplete: () => void;
  audioConfig?: Partial<WelcomeAudioConfig>;
}

export interface WelcomeSequenceState {
  fadeOut: boolean;
  phase: WelcomePhase;
  readyToContinue: boolean;
  isSequencePlaying: boolean;
  showFallbackImage: boolean;
  showRetryPrompt: boolean;
  currentAudioIndex: number;
  totalAudioCount: number;
  lastDiagnostic: WelcomePlaybackDiagnostic | null;
  handleIntroActivated: (videoElement?: HTMLVideoElement | null) => void;
  handlePrimaryAction: (videoElement?: HTMLVideoElement | null) => void;
  handleVideoCanPlay: () => void;
  handleVideoEnded: () => void;
  handleVideoError: () => void;
  handleVideoPlaying: () => void;
}

export const useWelcomeSequence = ({
  onComplete,
  audioConfig,
}: WelcomeSequenceOptions): WelcomeSequenceState => {
  const [fadeOut, setFadeOut] = useState(false);
  const [showFallbackImage, setShowFallbackImage] = useState(false);
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);
  const gateRef = useRef(createIntroPlaybackGate());
  const introAudioPendingRef = useRef(false);
  const introAudioStartedRef = useRef(false);

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

  useEffect(() => {
    if (!isE2E) return;
    const readyTimer = setTimeout(markReadyToContinue, 0);
    const completeTimer = setTimeout(onComplete, 500);
    return () => {
      clearTimeout(readyTimer);
      clearTimeout(completeTimer);
    };
  }, [isE2E, markReadyToContinue, onComplete]);

  useEffect(
    () => () => {
      stopWelcomeSequence();
      soundManager.fadeOutAll(250);
    },
    [],
  );

  const handleVideoCanPlay = useCallback(() => undefined, []);
  const handleVideoEnded = useCallback(() => {
    markReadyToContinue();
  }, [markReadyToContinue]);
  const handleVideoError = useCallback(() => {
    gateRef.current.onVideoError();
    introAudioPendingRef.current = false;
    setShowRetryPrompt(false);
    setShowFallbackImage(true);
    markReadyToContinue();
  }, [markReadyToContinue]);
  const handleIntroActivated = useCallback(
    (videoElement?: HTMLVideoElement | null) => {
      gateRef.current.onLanguageSelected();
      setShowFallbackImage(false);
      setShowRetryPrompt(false);

      if (!isE2E && !introAudioStartedRef.current) {
        introAudioPendingRef.current = true;
      }

      if (!videoElement) {
        return;
      }

      attemptIntroVideoPlay({
        videoElement,
        onInterrupted: () => {
          introAudioPendingRef.current = false;
          setShowRetryPrompt(true);
        },
        onError: handleVideoError,
      });
    },
    [handleVideoError, isE2E],
  );
  const handlePrimaryAction = useCallback(
    (videoElement?: HTMLVideoElement | null) => {
      if (fadeOut || isWelcomeInteractionLocked(phase)) {
        return;
      }

      if (isE2E) {
        proceed();
        return;
      }

      if (!readyToContinue) {
        if (
          videoElement &&
          !introAudioPendingRef.current &&
          !introAudioStartedRef.current
        ) {
          handleIntroActivated(videoElement);
        }
        return;
      }

      proceed();
    },
    [fadeOut, handleIntroActivated, isE2E, phase, proceed, readyToContinue],
  );
  useWelcomeKeyboardShortcut({ handlePrimaryAction, isE2E, phase });

  const handleVideoPlaying = () => {
    if (
      isE2E ||
      introAudioStartedRef.current ||
      !introAudioPendingRef.current ||
      !gateRef.current.onVideoPlaying()
    ) {
      return;
    }

    introAudioPendingRef.current = false;
    introAudioStartedRef.current = true;
    setShowRetryPrompt(false);
    requestStart();
  };

  return {
    fadeOut,
    phase,
    readyToContinue,
    isSequencePlaying,
    showFallbackImage,
    showRetryPrompt,
    currentAudioIndex,
    totalAudioCount,
    lastDiagnostic,
    handleIntroActivated,
    handlePrimaryAction,
    handleVideoCanPlay,
    handleVideoEnded,
    handleVideoError,
    handleVideoPlaying,
  };
};
