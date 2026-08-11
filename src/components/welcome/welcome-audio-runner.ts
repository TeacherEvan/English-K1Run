/**
 * Runs the welcome audio sequence with timeout handling.
 * Extracted to keep the hook focused on React state management.
 */
import { audioContextManager } from "@/lib/audio/audio-context-manager";
import { centralAudioManager } from "@/lib/audio/central-audio-manager";
import { validateWelcomeAudioIntegrity } from "@/lib/audio/welcome-audio-integrity";
import {
  playWelcomeSequence,
  type WelcomeAudioConfig,
  type WelcomePlaybackDiagnostic,
} from "@/lib/audio/welcome-audio-sequencer";
import { soundManager } from "@/lib/sound-manager";

interface WelcomeAudioRunnerOptions {
  config: Partial<WelcomeAudioConfig>;
  isCancelled: () => boolean;
  isReady: () => boolean;
  onProgress: (
    current: number,
    total: number,
    key: string,
    duration: number,
  ) => void;
  onDiagnostic?: (diagnostic: WelcomePlaybackDiagnostic) => void;
  onDevLog: (message: string, data?: Record<string, unknown>) => void;
}

const SEQUENCE_TIMEOUT_MS = 25000;

export const runWelcomeAudioSequence = async ({
  config,
  isCancelled,
  isReady,
  onProgress,
  onDiagnostic,
  onDevLog,
}: WelcomeAudioRunnerOptions) => {
  const sequenceTimeout = new Promise<void>((_, reject) =>
    setTimeout(() => {
      reject(new Error("Sequence timeout after 25s"));
    }, SEQUENCE_TIMEOUT_MS),
  );

  const runSequence = async () => {
    const integrity = await validateWelcomeAudioIntegrity(config.language);
    if (!integrity.isValid) {
      console.warn(
        `[WelcomeAudioRunner] Welcome audio integrity check failed: ${integrity.reason ?? "unknown reason"}`,
      );
    }

    onDevLog("Starting welcome audio sequence with ElevenLabs priority...", {
      audioContextState: soundManager.isInitialized()
        ? "initialized"
        : "not initialized",
      config,
      timestamp: Date.now(),
    });

    centralAudioManager.stopAllManaged();
    soundManager.stopAllAudio();

    const audioContext = audioContextManager.getContext();
    if (audioContext?.state === "suspended") {
      await audioContext.resume();
      onDevLog("AudioContext resumed successfully");
    }

    if (isCancelled() || isReady()) {
      throw new Error("Sequence cancelled");
    }

    await playWelcomeSequence(
      config,
      (current, total, asset) => {
        onProgress(current, total, asset.key, asset.duration);
      },
      onDiagnostic,
    );
  };

  await Promise.race([runSequence(), sequenceTimeout]);
};
