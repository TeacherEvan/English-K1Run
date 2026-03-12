import { getAudioUrl } from "./audio-registry";
import { WELCOME_AUDIO_ASSETS } from "./welcome-audio-assets";
import {
  getPrimaryWelcomeAudioKey,
  type WelcomeAudioConfig,
} from "./welcome-audio-types";

interface WelcomeAudioIntegrityResult {
  isValid: boolean;
  reason?: string;
}

const cachedResults = new Map<string, WelcomeAudioIntegrityResult>();

/**
 * Validates that the primary welcome audio reference exists and resolves.
 */
export async function validateWelcomeAudioIntegrity(
  language?: WelcomeAudioConfig["language"],
): Promise<WelcomeAudioIntegrityResult> {
  const primaryKey = getPrimaryWelcomeAudioKey(language ?? "en");
  const cachedResult = cachedResults.get(primaryKey);
  if (cachedResult) return cachedResult;

  const duplicatePrimaryCount = WELCOME_AUDIO_ASSETS.filter(
    (asset) => asset.key === primaryKey,
  ).length;

  if (duplicatePrimaryCount !== 1) {
    const result = {
      isValid: false,
      reason: `Primary welcome asset count must be 1, received ${duplicatePrimaryCount}`,
    };
    cachedResults.set(primaryKey, result);
    return result;
  }

  const audioUrl = await getAudioUrl(primaryKey);
  if (!audioUrl) {
    const result = {
      isValid: false,
      reason: `Unable to resolve audio URL for '${primaryKey}'`,
    };
    cachedResults.set(primaryKey, result);
    return result;
  }

  const result = { isValid: true };
  cachedResults.set(primaryKey, result);
  return result;
}

export function resetWelcomeAudioIntegrityCache(): void {
  cachedResults.clear();
}
