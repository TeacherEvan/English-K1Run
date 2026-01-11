/**
 * Audio Accessibility helpers
 *
 * Minimal “audio descriptions” support:
 * - If audio is missing/fails (or if explicitly used), announce a short text.
 * - Prefers speech synthesis when available; falls back to an aria-live region.
 */

import { speechSynthesizer } from "./speech-synthesizer";

let audioDescriptionsEnabled: boolean | null = null;
let liveRegion: HTMLDivElement | null = null;

function ensureLiveRegion(): HTMLDivElement | null {
  if (typeof document === "undefined") return null;
  if (liveRegion) return liveRegion;

  const region = document.createElement("div");
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "true");
  region.style.position = "absolute";
  region.style.width = "1px";
  region.style.height = "1px";
  region.style.margin = "-1px";
  region.style.border = "0";
  region.style.padding = "0";
  region.style.overflow = "hidden";
  region.style.clip = "rect(0 0 0 0)";
  region.style.whiteSpace = "nowrap";
  region.id = "k1run-audio-live-region";

  document.body.appendChild(region);
  liveRegion = region;
  return region;
}

export function isAudioDescriptionsEnabled(): boolean {
  if (audioDescriptionsEnabled !== null) return audioDescriptionsEnabled;

  try {
    const fromStorage =
      typeof window !== "undefined"
        ? window.localStorage.getItem("k1run_audio_descriptions")
        : null;

    audioDescriptionsEnabled =
      fromStorage === "1" || import.meta.env.VITE_AUDIO_DESCRIPTIONS === "1";
  } catch {
    audioDescriptionsEnabled = import.meta.env.VITE_AUDIO_DESCRIPTIONS === "1";
  }

  return audioDescriptionsEnabled;
}

export function setAudioDescriptionsEnabled(enabled: boolean): void {
  audioDescriptionsEnabled = enabled;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "k1run_audio_descriptions",
        enabled ? "1" : "0"
      );
    }
  } catch {
    // ignore
  }
}

export function announceAudioDescription(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;

  // Prefer speech for young learners if available
  if (speechSynthesizer.canUseSpeech()) {
    speechSynthesizer.speak(trimmed, undefined, false);
    return;
  }

  const region = ensureLiveRegion();
  if (!region) return;

  // Force screen readers to re-announce even if same text repeats
  region.textContent = "";
  window.setTimeout(() => {
    region.textContent = trimmed;
  }, 0);
}

export function describeIfEnabled(text: string): void {
  if (!isAudioDescriptionsEnabled()) return;
  announceAudioDescription(text);
}
