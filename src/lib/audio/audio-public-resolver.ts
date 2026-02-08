/**
 * Public audio resolver utilities.
 */

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

/** Cache for public /sounds URL checks */
const publicUrlCache = new Map<string, string | null>();
const publicUrlExistsCache = new Map<string, boolean>();

/**
 * Detect which audio formats are supported by the browser
 */
export function getPreferredFormatOrder(): string[] {
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

async function checkPublicUrl(url: string): Promise<boolean> {
  if (publicUrlExistsCache.has(url)) {
    return publicUrlExistsCache.get(url) ?? false;
  }

  try {
    const headResponse = await fetch(url, {
      method: "HEAD",
      cache: "force-cache",
    });

    if (headResponse.ok) {
      publicUrlExistsCache.set(url, true);
      return true;
    }

    if (headResponse.status !== 405) {
      publicUrlExistsCache.set(url, false);
      return false;
    }
  } catch {
    // Fall through to GET check.
  }

  try {
    const getResponse = await fetch(url, {
      method: "GET",
      cache: "force-cache",
      headers: { Range: "bytes=0-0" },
    });
    const exists = getResponse.ok;
    publicUrlExistsCache.set(url, exists);
    return exists;
  } catch {
    publicUrlExistsCache.set(url, false);
    return false;
  }
}

export async function resolvePublicAudioUrl(
  key: string,
): Promise<string | null> {
  if (publicUrlCache.has(key)) {
    return publicUrlCache.get(key) ?? null;
  }

  const preferredFormats = getPreferredFormatOrder();

  for (const ext of preferredFormats) {
    const url = `/sounds/${key}.${ext}`;
    if (await checkPublicUrl(url)) {
      publicUrlCache.set(key, url);
      return url;
    }
  }

  publicUrlCache.set(key, null);
  return null;
}
