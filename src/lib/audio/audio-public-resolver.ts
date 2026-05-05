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

const isWelcomeAudioKey = (key: string): boolean =>
  key.trim().toLowerCase().startsWith("welcome_");

const buildFileNameCandidates = (key: string): string[] => {
  const trimmed = key.trim().toLowerCase();
  if (!trimmed) return [];

  const variants = new Set<string>();

  if (trimmed.includes("_") && !isWelcomeAudioKey(trimmed)) {
    variants.add(trimmed.replace(/_/g, " "));
    variants.add(trimmed);
  } else {
    variants.add(trimmed);
  }

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

const isAudioLikeResponse = (response: Response): boolean => {
  if (!response.ok) {
    return false;
  }

  const contentType =
    response.headers?.get("content-type")?.toLowerCase() ?? "";
  if (!contentType) {
    return true;
  }

  if (
    contentType.startsWith("audio/") ||
    contentType === "application/octet-stream"
  ) {
    return true;
  }

  return !contentType.includes("text/html");
};

const canLoadPublicUrl = async (url: string): Promise<boolean> => {
  if (publicUrlExistsCache.has(url)) {
    return publicUrlExistsCache.get(url) ?? false;
  }

  try {
    const response = await fetch(url, { method: "HEAD" });
    const exists = isAudioLikeResponse(response);
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
 * - Prefer .mp3 for welcome audio to match generated assets and boot preloads
 * - Prefer .wav (universally available) for non-welcome assets
 */
export function getPreferredFormatOrder(key?: string): string[] {
  // SSR guard
  if (typeof Audio === "undefined" || typeof document === "undefined") {
    return isWelcomeAudioKey(key ?? "") ? ["mp3", "wav"] : ["wav", "mp3"];
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

  if (supported.length === 0) {
    return isWelcomeAudioKey(key ?? "") ? ["mp3", "wav"] : ["wav", "mp3"];
  }

  if (isWelcomeAudioKey(key ?? "")) {
    return [...supported].sort((left, right) => {
      if (left === right) return 0;
      if (left === "mp3") return -1;
      if (right === "mp3") return 1;
      return 0;
    });
  }

  return supported;
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

  const preferredFormats = getPreferredFormatOrder(key);
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
