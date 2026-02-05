/**
 * Runs the welcome audio sequence with timeout handling.
 * Extracted to keep the hook focused on React state management.
 */
import { audioContextManager } from "@/lib/audio/audio-context-manager";
import {
  playWelcomeSequence,
  type WelcomeAudioConfig,
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
  onDevLog: (message: string, data?: Record<string, unknown>) => void;
}

const SEQUENCE_TIMEOUT_MS = 15000;

export const runWelcomeAudioSequence = async ({
  config,
  isCancelled,
  isReady,
  onProgress,
  onDevLog,
}: WelcomeAudioRunnerOptions) => {
  const sequenceTimeout = new Promise<void>((_, reject) =>
    setTimeout(() => {
      reject(new Error("Sequence timeout after 15s"));
    }, SEQUENCE_TIMEOUT_MS),
  );

  const runSequence = async () => {
    onDevLog("Starting welcome audio sequence with ElevenLabs priority...", {
      audioContextState: soundManager.isInitialized()
        ? "initialized"
        : "not initialized",
      config,
      timestamp: Date.now(),
    });

    soundManager.stopAllAudio();

    const audioContext = audioContextManager.getContext();
    if (audioContext?.state === "suspended") {
      await audioContext.resume();
      onDevLog("AudioContext resumed successfully");
    }

    if (isCancelled() || isReady()) {
      throw new Error("Sequence cancelled");
    }

    await playWelcomeSequence(config, (current, total, asset) => {
      onProgress(current, total, asset.key, asset.duration);
    });
  };

  await Promise.race([runSequence(), sequenceTimeout]);
};
