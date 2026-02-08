/**
 * Welcome audio utilities.
 */

import { audioBufferLoader } from "./audio-buffer-loader";
import { getAudioUrl } from "./audio-registry";

export async function loadAudioWithDuration(
  key: string,
): Promise<{ buffer: AudioBuffer | null; duration: number }> {
  try {
    const buffer = await audioBufferLoader.loadBufferForName(key, false);
    if (buffer) {
      return { buffer, duration: buffer.duration };
    }
  } catch {
    // Fall through to URL-based loading
  }

  const url = await getAudioUrl(key);
  if (!url) {
    return { buffer: null, duration: 0 };
  }

  return new Promise((resolve) => {
    const audio = new Audio(url);
    let resolved = false;

    const cleanup = () => {
      audio.pause();
      audio.src = "";
      audio.load();
    };

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve({ buffer: null, duration: 0 });
      }
    }, 5000);

    audio.addEventListener(
      "loadedmetadata",
      () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          cleanup();
          resolve({ buffer: null, duration: audio.duration });
        }
      },
      { once: true },
    );
    audio.addEventListener(
      "error",
      () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          cleanup();
          resolve({ buffer: null, duration: 0 });
        }
      },
      { once: true },
    );
    audio.load();
  });
}
