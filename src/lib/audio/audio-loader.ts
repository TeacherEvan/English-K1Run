/**
 * Audio Loader Module
 *
 * Handles lazy loading and caching of audio assets.
 * Split from sound-manager.ts (Jan 2026) for better code organization.
 *
 * Responsibilities:
 * - Audio file discovery via Vite's import.meta.glob
 * - URL resolution and caching
 * - Buffer loading and decoding
 * - Priority-based progressive loading
 *
 * @module audio/audio-loader
 */

import { AudioPriority, DIGIT_TO_WORD, NUMBER_WORD_TO_DIGIT } from "./types";

// Dynamic import of audio files using Vite's glob import
const rawAudioFiles = import.meta.glob(
  "../../../sounds/*.{wav,mp3,ogg,m4a,aac,flac}",
  {
    import: "default",
    query: "?url",
  },
) as Record<string, () => Promise<string>>;

/** Normalize key for consistent audio file lookups */
export const normalizeKey = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

type AudioLoaderByFormat = Map<string, () => Promise<string>>;

/** Map of normalized keys to per-format audio loader functions */
const audioLoaderIndex = new Map<string, AudioLoaderByFormat>();

/** Cache of resolved URLs to avoid re-fetching */
const resolvedUrlCache = new Map<string, string>();

/** Cache for resolveCandidates results */
const candidatesCache = new Map<string, string[]>();

const SUPPORTED_FORMATS = [
  { ext: "ogg", mime: 'audio/ogg; codecs="opus"' },
  { ext: "ogg", mime: 'audio/ogg; codecs="vorbis"' },
  { ext: "m4a", mime: 'audio/mp4; codecs="mp4a.40.2"' },
  { ext: "aac", mime: "audio/aac" },
  { ext: "mp3", mime: "audio/mpeg" },
  { ext: "wav", mime: "audio/wav" },
  { ext: "flac", mime: "audio/flac" },
];

let preferredFormatOrder: string[] | null = null;

const getPreferredFormatOrder = (): string[] => {
  if (preferredFormatOrder) return preferredFormatOrder;

  if (typeof Audio === "undefined" || typeof document === "undefined") {
    preferredFormatOrder = ["ogg", "m4a", "aac", "mp3", "wav", "flac"];
    return preferredFormatOrder;
  }

  const testAudio = document.createElement("audio");
  const supported = new Set<string>();

  for (const format of SUPPORTED_FORMATS) {
    const result = testAudio.canPlayType(format.mime);
    if (result === "probably" || result === "maybe") {
      supported.add(format.ext);
    }
  }

  preferredFormatOrder = ["ogg", "m4a", "aac", "mp3", "wav", "flac"].filter(
    (ext) => supported.has(ext),
  );

  if (preferredFormatOrder.length === 0) {
    preferredFormatOrder = ["mp3", "wav"];
  }

  return preferredFormatOrder;
};

/** Register an alias for an audio file */
const registerAudioAlias = (
  key: string,
  extension: string,
  loader: () => Promise<string>,
): void => {
  if (!key) return;
  const entry =
    audioLoaderIndex.get(key) ?? new Map<string, () => Promise<string>>();
  if (!entry.has(extension)) {
    entry.set(extension, loader);
  }
  audioLoaderIndex.set(key, entry);
};

// Initialize audio index from glob imports
for (const [path, loader] of Object.entries(rawAudioFiles)) {
  const fileNameWithExt = path.split("/").pop() ?? "";
  const match = fileNameWithExt.match(/\.(wav|mp3|ogg|m4a|aac|flac)$/i);
  const extension = match?.[1]?.toLowerCase();
  const fileName = fileNameWithExt.replace(
    /\.(wav|mp3|ogg|m4a|aac|flac)$/i,
    "",
  );
  const normalized = normalizeKey(fileName);

  if (!extension) continue;

  // Register the exact filename (normalized)
  registerAudioAlias(normalized, extension, loader);

  // Handle emoji_ prefix: register both with and without prefix, plus space variant
  if (fileName.startsWith("emoji_")) {
    const withoutPrefix = fileName.slice(6); // "emoji_apple" → "apple"
    registerAudioAlias(normalizeKey(withoutPrefix), extension, loader);
    // Also register space variant: "emoji_ice cream" → "ice cream"
    registerAudioAlias(
      normalizeKey(withoutPrefix.replace(/_/g, " ")),
      extension,
      loader,
    );
  }

  // Number word/digit conversions
  if (DIGIT_TO_WORD[fileName]) {
    registerAudioAlias(
      normalizeKey(DIGIT_TO_WORD[fileName]),
      extension,
      loader,
    );
  }

  if (NUMBER_WORD_TO_DIGIT[fileName]) {
    registerAudioAlias(
      normalizeKey(NUMBER_WORD_TO_DIGIT[fileName]),
      extension,
      loader,
    );
  }

  // Register underscore-to-space variant for multi-word files
  if (fileName.includes("_") && !fileName.startsWith("emoji_")) {
    registerAudioAlias(
      normalizeKey(fileName.replace(/_/g, " ")),
      extension,
      loader,
    );
  }
}

// Debug logging in development
if (import.meta.env.DEV) {
  console.log(
    `[AudioLoader] Registered ${audioLoaderIndex.size} audio aliases from ${
      Object.keys(rawAudioFiles).length
    } files`,
  );
}

/** Audio files by priority for progressive loading */
export const AUDIO_PRIORITIES: Record<AudioPriority, string[]> = {
  [AudioPriority.CRITICAL]: [
    "welcome",
    "welcome_association",
    "welcome_learning",
    "welcome_association_thai",
    "welcome_learning_thai",
    "success",
    "tap",
    "wrong",
    "win",
  ],
  [AudioPriority.COMMON]: [
    // Numbers 1-10
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    // Common letters
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    // Basic fruits and vegetables
    "apple",
    "banana",
    "orange",
    "grape",
    "strawberry",
    "carrot",
    "broccoli",
    "tomato",
    "potato",
    "onion",
  ],
  [AudioPriority.RARE]: [
    // Weather
    "sunny",
    "cloudy",
    "rainy",
    "snowy",
    "windy",
    // Vehicles
    "car",
    "bus",
    "truck",
    "bicycle",
    "airplane",
    "boat",
    // Animals
    "dog",
    "cat",
    "bird",
    "fish",
    "cow",
    "pig",
    "sheep",
    // Colors
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "purple",
    "pink",
    "brown",
    "black",
    "white",
    // Shapes
    "circle",
    "square",
    "triangle",
    "rectangle",
    "diamond",
    "star",
  ],
};

/**
 * Resolve candidate keys for a given name
 * Handles various naming conventions (underscores, numbers, etc.)
 */
export function resolveCandidates(name: string): string[] {
  const cached = candidatesCache.get(name);
  if (cached) return cached;

  const normalized = normalizeKey(name);
  const candidates = new Set<string>();

  if (normalized) {
    candidates.add(normalized);

    if (normalized.includes("_")) {
      candidates.add(normalized.replace(/_/g, ""));
    }
  }

  if (NUMBER_WORD_TO_DIGIT[normalized]) {
    candidates.add(normalizeKey(NUMBER_WORD_TO_DIGIT[normalized]));
  }

  if (DIGIT_TO_WORD[normalized]) {
    candidates.add(normalizeKey(DIGIT_TO_WORD[normalized]));
  }

  if (normalized.length === 1) {
    candidates.add(normalized);
  }

  const result = Array.from(candidates);
  candidatesCache.set(name, result);
  return result;
}

/**
 * Get URL for an audio key
 * Uses lazy loading - only resolves URL when needed
 */
export async function getAudioUrl(key: string): Promise<string | null> {
  // Check cache first
  if (resolvedUrlCache.has(key)) {
    return resolvedUrlCache.get(key)!;
  }

  // Get loader
  const loaderEntry = audioLoaderIndex.get(key);
  if (!loaderEntry) return null;

  const preferredFormats = getPreferredFormatOrder();
  let loader: (() => Promise<string>) | undefined;

  for (const ext of preferredFormats) {
    const candidate = loaderEntry.get(ext);
    if (candidate) {
      loader = candidate;
      break;
    }
  }

  if (!loader) {
    const fallback = loaderEntry.values().next().value as
      | (() => Promise<string>)
      | undefined;
    loader = fallback;
  }

  if (!loader) return null;

  try {
    // Load module and get default export (URL)
    const url = await loader();
    resolvedUrlCache.set(key, url);
    return url;
  } catch (error) {
    console.error(`[AudioLoader] Failed to resolve URL for "${key}":`, error);
    return null;
  }
}

/**
 * Check if an audio key exists in the index
 */
export function hasAudioKey(key: string): boolean {
  return audioLoaderIndex.has(key);
}

/**
 * Get all registered audio keys (for debugging)
 */
export function getRegisteredKeys(): string[] {
  return Array.from(audioLoaderIndex.keys());
}

/**
 * Audio Buffer Loader
 * Handles loading and caching of AudioBuffer objects
 */
export class AudioBufferLoader {
  private audioContext: AudioContext | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private loadingCache = new Map<string, Promise<AudioBuffer | null>>();
  private fallbackEffects = new Map<string, AudioBuffer>();

  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
    this.prepareFallbackEffects();
  }

  private prepareFallbackEffects(): void {
    if (!this.audioContext) return;

    this.fallbackEffects.set(
      "success",
      this.createToneSequence([
        { frequency: 523.25, duration: 0.15 },
        { frequency: 659.25, duration: 0.15 },
        { frequency: 783.99, duration: 0.3 },
      ]),
    );

    this.fallbackEffects.set("tap", this.createTone(800, 0.1, "square"));

    this.fallbackEffects.set(
      "wrong",
      this.createToneSequence([
        { frequency: 400, duration: 0.15 },
        { frequency: 300, duration: 0.15 },
        { frequency: 200, duration: 0.2 },
      ]),
    );

    this.fallbackEffects.set(
      "win",
      this.createToneSequence([
        { frequency: 523.25, duration: 0.2 },
        { frequency: 659.25, duration: 0.2 },
        { frequency: 783.99, duration: 0.2 },
        { frequency: 1046.5, duration: 0.4 },
      ]),
    );
  }

  private createTone(
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
  ): AudioBuffer {
    if (!this.audioContext) throw new Error("Audio context not available");

    const sampleRate = this.audioContext.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const time = i / sampleRate;
      let sample = 0;

      switch (type) {
        case "square":
          sample = Math.sin(2 * Math.PI * frequency * time) > 0 ? 1 : -1;
          break;
        case "triangle":
          sample =
            2 *
              Math.abs(
                2 * (frequency * time - Math.floor(frequency * time + 0.5)),
              ) -
            1;
          break;
        default:
          sample = Math.sin(2 * Math.PI * frequency * time);
          break;
      }

      const envelope = Math.min(time * 10, 1, (duration - time) * 10);
      channelData[i] = sample * envelope * 0.3;
    }

    return buffer;
  }

  private createToneSequence(
    notes: { frequency: number; duration: number }[],
  ): AudioBuffer {
    if (!this.audioContext) throw new Error("Audio context not available");

    const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0);
    const sampleRate = this.audioContext.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * totalDuration));
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);

    let currentFrame = 0;
    for (const note of notes) {
      const noteFrames = Math.max(1, Math.floor(sampleRate * note.duration));
      for (let i = 0; i < noteFrames; i++) {
        const time = i / sampleRate;
        const sample = Math.sin(2 * Math.PI * note.frequency * time);
        const envelope = Math.min(time * 20, 1, (note.duration - time) * 10);

        if (currentFrame + i < frameCount) {
          channelData[currentFrame + i] = sample * envelope * 0.2;
        }
      }
      currentFrame += noteFrames;
    }

    return buffer;
  }

  async loadFromIndex(key: string): Promise<AudioBuffer | null> {
    if (!this.audioContext || !key) return null;

    const cached = this.bufferCache.get(key);
    if (cached) return cached;

    const pending = this.loadingCache.get(key);
    if (pending) return pending;

    const url = await getAudioUrl(key);
    if (!url) {
      console.warn(`[AudioLoader] No URL found for key: "${key}"`);
      return null;
    }

    const loadPromise = (async () => {
      try {
        if (import.meta.env.DEV) {
          console.log(`[AudioLoader] Loading audio: "${key}" from ${url}`);
        }
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer =
          await this.audioContext!.decodeAudioData(arrayBuffer);
        this.bufferCache.set(key, audioBuffer);
        this.loadingCache.delete(key);
        if (import.meta.env.DEV) {
          console.log(`[AudioLoader] Successfully loaded: "${key}"`);
        }
        return audioBuffer;
      } catch (error) {
        console.error(
          `[AudioLoader] Failed to load audio "${key}" from ${url}:`,
          error,
        );
        this.loadingCache.delete(key);
        return null;
      }
    })();

    this.loadingCache.set(key, loadPromise);
    return loadPromise;
  }

  async loadBufferForName(
    name: string,
    allowFallback = true,
  ): Promise<AudioBuffer | null> {
    const candidates = resolveCandidates(name);

    for (const candidate of candidates) {
      const buffer = await this.loadFromIndex(candidate);
      if (buffer) return buffer;
    }

    if (allowFallback) {
      const fallback =
        this.fallbackEffects.get(name) || this.fallbackEffects.get("success");
      if (fallback) {
        return fallback;
      }
    }

    return null;
  }

  getFallbackBuffer(name: string): AudioBuffer | undefined {
    return this.fallbackEffects.get(name);
  }

  getLoadedCount(): number {
    return this.bufferCache.size;
  }

  getPendingCount(): number {
    return this.loadingCache.size;
  }

  getFallbackCount(): number {
    return this.fallbackEffects.size;
  }
}

// Export singleton instance
export const audioBufferLoader = new AudioBufferLoader();
