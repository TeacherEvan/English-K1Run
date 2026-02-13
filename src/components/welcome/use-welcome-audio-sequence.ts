/**
 * Handles welcome audio sequencing, safety timers, and user gesture unlock.
 * Keeps the main welcome hook focused on rendering and video state.
 */
import { runWelcomeAudioSequence } from "@/components/welcome/welcome-audio-runner";
import {
  DEFAULT_WELCOME_CONFIG,
  isWelcomeSequencePlaying,
  type WelcomeAudioConfig,
} from "@/lib/audio/welcome-audio-sequencer";
import { subscribeDisplayAdjustmentSignal } from "@/lib/display-adjustment-signal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseWelcomeAudioSequenceOptions {
  audioConfig?: Partial<WelcomeAudioConfig>;
  isE2E: boolean;
}

export interface WelcomeAudioSequenceState {
  readyToContinue: boolean;
  isSequencePlaying: boolean;
  currentAudioIndex: number;
  totalAudioCount: number;
  requestStart: () => void;
  markReadyToContinue: () => void;
}

export const useWelcomeAudioSequence = ({
  audioConfig,
  isE2E,
}: UseWelcomeAudioSequenceOptions): WelcomeAudioSequenceState => {
  const [readyToContinue, setReadyToContinue] = useState(false);
  const [isSequencePlaying, setIsSequencePlaying] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [totalAudioCount, setTotalAudioCount] = useState(0);
  const readyRef = useRef(false);
  const sequenceFinishedRef = useRef(false);
  const audioStartedRef = useRef(false);
  const startAudioSequenceRef = useRef<(() => void) | null>(null);

  const mergedAudioConfig: Partial<WelcomeAudioConfig> = useMemo(
    () => ({
      ...DEFAULT_WELCOME_CONFIG,
      sourcePriority: ["elevenlabs", "generated", "fallback"],
      durationSortOrder: "desc",
      filterActiveTargets: true,
      sequentialDelayMs: 500,
      maxSequenceLength: 5,
      ...audioConfig,
    }),
    [audioConfig],
  );

  const logDev = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      if (import.meta.env.DEV) {
        console.log(`[WelcomeScreen] ${message}`, data);
      }
    },
    [],
  );

  const markReadyToContinue = useCallback(() => {
    readyRef.current = true;
    setReadyToContinue(true);
  }, []);

  const requestStart = useCallback(() => {
    startAudioSequenceRef.current?.();
  }, []);

  useEffect(() => {
    if (isE2E) return;

    const safetyBtnTimer = setTimeout(() => {
      console.log(
        "[WelcomeScreen] Safety timer: Enabling interaction fallback",
      );
      setReadyToContinue(true);
    }, 8000);

    const safetyEndTimer = setTimeout(() => {
      if (!sequenceFinishedRef.current) {
        console.warn(
          "[WelcomeScreen] Safety timer triggered - forcing sequence completion",
        );
        sequenceFinishedRef.current = true;
        setReadyToContinue(true);
      }
    }, 12000);

    let cancelled = false;
    const autoStartFallbackTimer = setTimeout(() => {
      if (!audioStartedRef.current && !cancelled && !readyRef.current) {
        logDev("Auto-start fallback triggered for welcome audio");
        startAudioSequenceRef.current?.();
      }
    }, 2500);

    const startAudioSequence = async () => {
      logDev("startAudioSequence called:", {
        audioStarted: audioStartedRef.current,
        cancelled,
        readyToContinue: readyRef.current,
        config: mergedAudioConfig,
        timestamp: Date.now(),
      });

      if (audioStartedRef.current || cancelled) {
        logDev("Audio sequence blocked by guard condition");
        return;
      }
      audioStartedRef.current = true;

      setIsSequencePlaying(true);

      try {
        await runWelcomeAudioSequence({
          config: mergedAudioConfig,
          isCancelled: () => cancelled,
          isReady: () => readyRef.current,
          onProgress: (current, total, key, duration) => {
            setCurrentAudioIndex(current);
            setTotalAudioCount(total);
            logDev(`Playing ${current}/${total}: ${key} (${duration}s)`);
          },
          onDevLog: (message, data) => logDev(message, data),
        });

        if (!cancelled && !readyRef.current) {
          logDev("Sequence finished normally");
          readyRef.current = true;
          setReadyToContinue(true);
          sequenceFinishedRef.current = true;
          setIsSequencePlaying(false);
        }
      } catch (err) {
        logDev("Audio sequence error:", {
          error: err instanceof Error ? err.message : String(err),
          audioStarted: audioStartedRef.current,
          readyToContinue: readyRef.current,
          wasPlaying: isWelcomeSequencePlaying(),
          timestamp: Date.now(),
        });
        if (err instanceof Error && err.message !== "Sequence cancelled") {
          console.warn("[WelcomeScreen] Audio sequence failed:", err);
        }
        if (!cancelled) {
          readyRef.current = true;
          setReadyToContinue(true);
          sequenceFinishedRef.current = true;
          setIsSequencePlaying(false);
        }
      }
    };

    startAudioSequenceRef.current = () => {
      void startAudioSequence();
    };

    const stopDisplayAdjustmentSubscription = subscribeDisplayAdjustmentSignal(
      (detail) => {
        if (audioStartedRef.current || cancelled || readyRef.current) return;

        logDev("Display adjustment triggered welcome audio", {
          detail,
          timestamp: Date.now(),
        });

        void startAudioSequence();
      },
      { replayLatest: true },
    );

    const handleDisplayAdjustment = () => {
      if (audioStartedRef.current || cancelled || readyRef.current) return;

      logDev("Display adjustment triggered welcome audio", {
        detail: { cause: "legacy-event", timestamp: Date.now() },
        timestamp: Date.now(),
      });

      void startAudioSequence();
    };

    window.addEventListener("k1-display-adjustment", handleDisplayAdjustment);

    return () => {
      cancelled = true;
      clearTimeout(autoStartFallbackTimer);
      clearTimeout(safetyBtnTimer);
      clearTimeout(safetyEndTimer);
      startAudioSequenceRef.current = null;
      window.removeEventListener(
        "k1-display-adjustment",
        handleDisplayAdjustment,
      );
      stopDisplayAdjustmentSubscription();
    };
  }, [isE2E, logDev, mergedAudioConfig, readyToContinue]);

  useEffect(() => {
    readyRef.current = readyToContinue;
  }, [readyToContinue]);

  return {
    readyToContinue,
    isSequencePlaying,
    currentAudioIndex,
    totalAudioCount,
    requestStart,
    markReadyToContinue,
  };
};
