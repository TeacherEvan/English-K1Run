/**
 * Audio Registry Module
 *
 * Handles audio file discovery, indexing, aliasing, and key resolution.
 * Split from audio-loader.ts for better organization.
 *
 * @module audio/audio-registry
 */

import {
  getPreferredFormatOrder,
  resolvePublicAudioUrl,
} from "./audio-public-resolver";
import { DIGIT_TO_WORD, NUMBER_WORD_TO_DIGIT } from "./types";

// Dynamic import of audio files using Vite's glob import
// Note: public/ files are served statically, so this will be empty
// Audio loading relies on resolvePublicAudioUrl fallback
const rawAudioFiles = {} as Record<string, () => Promise<string>>;

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
    const cached = resolvedUrlCache.get(key)!;
    if (import.meta.env.DEV) {
      console.log(`[AudioRegistry] Cache hit for "${key}": ${cached}`);
    }
    return cached;
  }

  // Get loader
  const loaderEntry = audioLoaderIndex.get(key);
  if (!loaderEntry) {
    if (import.meta.env.DEV) {
      console.log(
        `[AudioRegistry] No loader for "${key}", trying public URL...`,
      );
    }
    const candidates = resolveCandidates(key);
    for (const candidate of candidates) {
      const publicUrl = await resolvePublicAudioUrl(candidate);
      if (publicUrl) {
        if (import.meta.env.DEV) {
          console.log(
            `[AudioRegistry] Resolved "${key}" via public: ${publicUrl}`,
          );
        }
        resolvedUrlCache.set(key, publicUrl);
        return publicUrl;
      }
    }
    console.warn(`[AudioRegistry] Failed to resolve URL for "${key}"`);
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
