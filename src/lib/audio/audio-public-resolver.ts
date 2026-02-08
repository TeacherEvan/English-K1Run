/**
 * Public audio resolver utilities.
 *
 * Optimized for static hosting (Vercel) - returns best-effort URL
 * without checking existence to avoid 404 spam. Browser handles
 * missing files naturally via its own 404 handling.
 */

/** Cache for resolved URLs */
const publicUrlCache = new Map<string, string | null>();

/**
 * Get preferred format order based on what's in public/sounds/
 * and browser support. Optimized for our asset inventory:
 * - Most files: .wav only
 * - Welcome files: .mp3 + .wav
 * - Prefer .wav (universally available) over .mp3
 */
export function getPreferredFormatOrder(): string[] {
  // SSR guard
  if (typeof Audio === "undefined" || typeof document === "undefined") {
    return ["wav", "mp3"];
  }

  const testAudio = document.createElement("audio");
  const formats = [
    { ext: "wav", mime: "audio/wav" },
    { ext: "mp3", mime: "audio/mpeg" },
  ];

  const supported: string[] = [];
  for (const format of formats) {
    const result = testAudio.canPlayType(format.mime);
    if (result === "probably" || result === "maybe") {
      supported.push(format.ext);
    }
  }

  return supported.length > 0 ? supported : ["wav", "mp3"];
}

/**
 * Resolve public audio URL without checking existence.
 * Returns first preferred format URL and lets browser handle 404s.
 */
export async function resolvePublicAudioUrl(
  key: string,
): Promise<string | null> {
  if (publicUrlCache.has(key)) {
    const cached = publicUrlCache.get(key) ?? null;
    if (import.meta.env.DEV) {
      console.log(`[PublicResolver] Cache hit for "${key}": ${cached}`);
    }
    return cached;
  }

  const preferredFormats = getPreferredFormatOrder();
  if (import.meta.env.DEV) {
    console.log(
      `[PublicResolver] Preferred formats for "${key}": [${preferredFormats.join(", ")}]`,
    );
  }

  if (preferredFormats.length === 0) {
    console.warn(`[PublicResolver] No supported formats for "${key}"`);
    publicUrlCache.set(key, null);
    return null;
  }

  // Return first preferred format - browser will 404 if missing
  const url = `/sounds/${key}.${preferredFormats[0]}`;
  if (import.meta.env.DEV) {
    console.log(`[PublicResolver] Resolved "${key}" → ${url}`);
  }
  publicUrlCache.set(key, url);
  return url;
}
