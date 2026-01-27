/**
 * Audio Key Prefetcher Module
 *
 * Prefetches specific audio keys with concurrency control.
 * Extracted from sound-manager.ts for size and clarity.
 *
 * @module audio/audio-key-prefetcher
 */

import { audioBufferLoader } from "./audio-buffer-loader";
import { audioContextManager } from "./audio-context-manager";
import { hasAudioKey } from "./audio-registry";
import { audioSpritePlayer } from "./audio-sprite";

export interface AudioKeyPrefetchOptions {
  useAudioSprite: boolean;
  resolveCandidates: (name: string) => string[];
  concurrency?: number;
}

const DEFAULT_CONCURRENCY = 4;

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;

  const queue = [...items];
  const workers = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) break;
        await worker(next);
      }
    },
  );

  await Promise.allSettled(workers);
}

export async function prefetchAudioKeys(
  keys: string[],
  options: AudioKeyPrefetchOptions,
): Promise<void> {
  if (keys.length === 0) return;
  if (typeof window === "undefined") return;

  await audioContextManager.ensureInitialized();
  if (!audioContextManager.getContext()) return;

  const unique = Array.from(new Set(keys.map((key) => key.trim()).filter(Boolean)));

  const work = async () => {
    if (options.useAudioSprite && audioSpritePlayer.isConfigured()) {
      await audioSpritePlayer.prefetch();
    }

    const candidatesToLoad: string[] = [];

    for (const key of unique) {
      const candidates = options.resolveCandidates(key);
      for (const candidate of candidates) {
        if (!hasAudioKey(candidate)) {
          continue;
        }

        candidatesToLoad.push(candidate);
        break;
      }
    }

    const concurrency = Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY);
    await runWithConcurrency(candidatesToLoad, concurrency, async (candidate) => {
      try {
        await audioBufferLoader.loadFromIndex(candidate);
      } catch {
        // Ignore failures during background prefetch
      }
    });
  };

  if ("requestIdleCallback" in window) {
    (
      window as unknown as {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void;
      }
    ).requestIdleCallback(
      () => {
        void work();
      },
      { timeout: 1500 },
    );
  } else {
    setTimeout(() => {
      void work();
    }, 250);
  }
}
