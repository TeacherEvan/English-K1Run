/**
 * Handles welcome audio sequencing, safety timers, and user gesture unlock.
 * Keeps the main welcome hook focused on rendering and video state.
 */
import { runWelcomeAudioSequence } from "@/components/welcome/welcome-audio-runner";
import {
  DEFAULT_WELCOME_CONFIG,
  type WelcomeAudioConfig,
  type WelcomePlaybackDiagnostic,
} from "@/lib/audio/welcome-audio-sequencer";
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
  lastDiagnostic: WelcomePlaybackDiagnostic | null;
  requestStart: () => void;
  markReadyToContinue: () => void;
}

export const useWelcomeAudioSequence = ({
  audioConfig,
  isE2E,
}: UseWelcomeAudioSequenceOptions): WelcomeAudioSequenceState => {
  const WELCOME_SEQUENCE_TIMEOUT_MS = 30000;

  const [readyToContinue, setReadyToContinue] = useState(false);
  const [isSequencePlaying, setIsSequencePlaying] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [totalAudioCount, setTotalAudioCount] = useState(0);
  const [lastDiagnostic, setLastDiagnostic] =
    useState<WelcomePlaybackDiagnostic | null>(null);
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
      maxSequenceLength: 2,
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

    let cancelled = false;
    let safetyEndTimer: ReturnType<typeof setTimeout> | undefined;

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
      setLastDiagnostic(null);

      setIsSequencePlaying(true);
      safetyEndTimer = setTimeout(() => {
        if (cancelled || sequenceFinishedRef.current) return;
        console.warn(
          "[WelcomeScreen] Safety timer triggered - forcing sequence completion",
        );
        sequenceFinishedRef.current = true;
        readyRef.current = true;
        setReadyToContinue(true);
        setIsSequencePlaying(false);
      }, WELCOME_SEQUENCE_TIMEOUT_MS);

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
          onDiagnostic: (diagnostic) => {
            setLastDiagnostic(diagnostic);
            logDev("Welcome playback diagnostic", diagnostic);
          },
          onDevLog: (message, data) => logDev(message, data),
        });

        if (!cancelled) {
          sequenceFinishedRef.current = true;
          setIsSequencePlaying(false);
          if (!readyRef.current) {
            logDev("Sequence finished normally");
            readyRef.current = true;
            setReadyToContinue(true);
          }
        }
      } catch (err) {
        logDev("Audio sequence error:", {
          error: err instanceof Error ? err.message : String(err),
          audioStarted: audioStartedRef.current,
          readyToContinue: readyRef.current,
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
      } finally {
        if (safetyEndTimer) {
          clearTimeout(safetyEndTimer);
        }
      }
    };

    startAudioSequenceRef.current = () => {
      void startAudioSequence();
    };

    return () => {
      cancelled = true;
      if (safetyEndTimer) {
        clearTimeout(safetyEndTimer);
      }
      startAudioSequenceRef.current = null;
    };
  }, [WELCOME_SEQUENCE_TIMEOUT_MS, isE2E, logDev, mergedAudioConfig]);

  useEffect(() => {
    readyRef.current = readyToContinue;
  }, [readyToContinue]);

  return {
    readyToContinue,
    isSequencePlaying,
    currentAudioIndex,
    totalAudioCount,
    lastDiagnostic,
    requestStart,
    markReadyToContinue,
  };
};
