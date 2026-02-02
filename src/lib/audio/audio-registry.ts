/**
 * Audio Registry Module
 *
 * Handles audio file discovery, indexing, aliasing, and key resolution.
 * Split from audio-loader.ts for better organization.
 *
 * @module audio/audio-registry
 */

import { DIGIT_TO_WORD, NUMBER_WORD_TO_DIGIT } from "./types";

// Dynamic import of audio files using Vite's glob import
const rawAudioFiles = import.meta.glob(
  "../../../public/sounds/*.{wav,mp3,ogg,m4a,aac,flac}",
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

/** Cache for public /sounds URL checks */
const publicUrlCache = new Map<string, string | null>();

/** Cache for resolveCandidates results */
const candidatesCache = new Map<string, string[]>();

/** Supported audio formats with their MIME types */
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

/**
 * Detect which audio formats are supported by the browser
 */
function getPreferredFormatOrder(): string[] {
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
}

async function resolvePublicAudioUrl(key: string): Promise<string | null> {
  if (publicUrlCache.has(key)) {
    return publicUrlCache.get(key) ?? null;
  }

  if (typeof fetch === "undefined") {
    publicUrlCache.set(key, null);
    return null;
  }

  const preferredFormats = getPreferredFormatOrder();
  for (const ext of preferredFormats) {
    const url = `/sounds/${key}.${ext}`;
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) {
        publicUrlCache.set(key, url);
        return url;
      }
    } catch {
      // Ignore network errors and try next format
    }
  }

  publicUrlCache.set(key, null);
  return null;
}

/**
 * Register an alias for an audio file
 */
function registerAudioAlias(
  key: string,
  extension: string,
  loader: () => Promise<string>,
): void {
  if (!key) return;
  const entry =
    audioLoaderIndex.get(key) ?? new Map<string, () => Promise<string>>();
  if (!entry.has(extension)) {
    entry.set(extension, loader);
  }
  audioLoaderIndex.set(key, entry);
}

/**
 * Initialize audio index from glob imports
 */
function initializeAudioIndex(): void {
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
      `[AudioRegistry] Registered ${audioLoaderIndex.size} audio aliases from ${
        Object.keys(rawAudioFiles).length
      } files`,
    );
  }
}

// Initialize on module load
initializeAudioIndex();

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
  if (!loaderEntry) {
    const candidates = resolveCandidates(key);
    for (const candidate of candidates) {
      const publicUrl = await resolvePublicAudioUrl(candidate);
      if (publicUrl) {
        resolvedUrlCache.set(key, publicUrl);
        return publicUrl;
      }
    }
    return null;
  }

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

  if (!loader) {
    const publicUrl = await resolvePublicAudioUrl(key);
    if (publicUrl) {
      resolvedUrlCache.set(key, publicUrl);
      return publicUrl;
    }
    return null;
  }

  try {
    // Load module and get default export (URL)
    const url = await loader();
    resolvedUrlCache.set(key, url);
    return url;
  } catch (error) {
    console.error(`[AudioRegistry] Failed to resolve URL for "${key}":`, error);
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
