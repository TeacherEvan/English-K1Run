/**
 * Public audio resolver utilities.
 *
 * Optimized for static hosting (Vercel) - resolves only public assets
 * that actually exist, while supporting both underscored keys and
 * repo filenames that still contain spaces.
 */

/** Cache for resolved URLs */
const publicUrlCache = new Map<string, string | null>();
const publicUrlExistsCache = new Map<string, boolean>();

const buildFileNameCandidates = (key: string): string[] => {
  const trimmed = key.trim().toLowerCase();
  if (!trimmed) return [];

  const variants = new Set<string>([trimmed]);

  if (trimmed.includes("_")) {
    variants.add(trimmed.replace(/_/g, " "));
    variants.add(trimmed.replace(/_/g, ""));
  }

  if (trimmed.includes(" ")) {
    variants.add(trimmed.replace(/\s+/g, "_"));
    variants.add(trimmed.replace(/\s+/g, ""));
  }

  if (trimmed.startsWith("emoji_")) {
    const phrase = trimmed.slice(6);
    variants.add(`emoji_${phrase.replace(/_/g, " ")}`);
  }

  return Array.from(variants);
};

const canLoadPublicUrl = async (url: string): Promise<boolean> => {
  if (publicUrlExistsCache.has(url)) {
    return publicUrlExistsCache.get(url) ?? false;
  }

  try {
    const response = await fetch(url, { method: "HEAD" });
    const exists = response.ok;
    publicUrlExistsCache.set(url, exists);
    return exists;
  } catch {
    publicUrlExistsCache.set(url, false);
    return false;
  }
};

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
 * Resolve public audio URL using existing static files only.
 * Tries known filename variants to support both underscored keys and
 * repo-side files that still use spaces in the public path.
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

  const fileNameCandidates = buildFileNameCandidates(key);

  for (const fileName of fileNameCandidates) {
    for (const format of preferredFormats) {
      const url = `/sounds/${fileName}.${format}`;
      if (await canLoadPublicUrl(url)) {
        if (import.meta.env.DEV) {
          console.log(`[PublicResolver] Resolved "${key}" → ${url}`);
        }
        publicUrlCache.set(key, url);
        return url;
      }
    }
  }

  if (import.meta.env.DEV) {
    console.warn(`[PublicResolver] No public audio file found for "${key}"`);
  }
  publicUrlCache.set(key, null);
  return null;
}

export function resetPublicAudioResolverCache(): void {
  publicUrlCache.clear();
  publicUrlExistsCache.clear();
}
