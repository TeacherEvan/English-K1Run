import { getAudioUrl } from "./audio-registry";
import { WELCOME_AUDIO_ASSETS } from "./welcome-audio-assets";
import { PRIMARY_WELCOME_AUDIO_KEY } from "./welcome-audio-types";

interface WelcomeAudioIntegrityResult {
  isValid: boolean;
  reason?: string;
}

let cachedResult: WelcomeAudioIntegrityResult | null = null;

/**
 * Validates that the primary welcome audio reference exists and resolves.
 */
export async function validateWelcomeAudioIntegrity(): Promise<WelcomeAudioIntegrityResult> {
  if (cachedResult) return cachedResult;

  const duplicatePrimaryCount = WELCOME_AUDIO_ASSETS.filter(
    (asset) => asset.key === PRIMARY_WELCOME_AUDIO_KEY,
  ).length;

  if (duplicatePrimaryCount !== 1) {
    cachedResult = {
      isValid: false,
      reason: `Primary welcome asset count must be 1, received ${duplicatePrimaryCount}`,
    };
    return cachedResult;
  }

  const audioUrl = await getAudioUrl(PRIMARY_WELCOME_AUDIO_KEY);
  if (!audioUrl) {
    cachedResult = {
      isValid: false,
      reason: `Unable to resolve audio URL for '${PRIMARY_WELCOME_AUDIO_KEY}'`,
    };
    return cachedResult;
  }

  cachedResult = { isValid: true };
  return cachedResult;
}

export function resetWelcomeAudioIntegrityCache(): void {
  cachedResult = null;
}
