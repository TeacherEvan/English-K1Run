const fs = require("fs");
const https = require("https");
const path = require("path");

const ELEVENLABS_HOSTNAME = "api.elevenlabs.io";
const LEGACY_INVALID_THAI_VOICE_IDS = new Map([
  ["onwK4e9ZLuTAKqWW03F9", "Daniel - Steady Broadcaster (British English)"],
]);

function loadDotEnvIfPresent(baseDir = path.join(__dirname, "..")) {
  try {
    const envPath = path.join(baseDir, ".env");
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key || process.env[key]) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // Ignore .env parsing issues and fall back to shell env vars.
  }
}

function hasFlag(name, argv = process.argv) {
  return argv.includes(name);
}

function readFlagValue(name, argv = process.argv) {
  const prefix = `${name}=`;
  const match = argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function httpGetJson({ hostname = ELEVENLABS_HOSTNAME, path, headers }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, port: 443, path, method: "GET", headers },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    req.on("error", reject);
    req.end();
  });
}

async function fetchElevenLabsVoices(apiKey) {
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is required");
  }

  const result = await httpGetJson({
    path: "/v1/voices",
    headers: {
      Accept: "application/json",
      "xi-api-key": apiKey,
    },
  });

  return Array.isArray(result?.voices) ? result.voices : [];
}

function hasVerifiedLanguage(voice, languageCode) {
  const verifiedLanguages = Array.isArray(voice?.verified_languages)
    ? voice.verified_languages
    : [];
  return verifiedLanguages.some((entry) => {
    const language = String(entry?.language || "").toLowerCase();
    const locale = String(entry?.locale || "").toLowerCase();
    return language === languageCode || locale.startsWith(`${languageCode}-`);
  });
}

function getVerifiedThaiVoices(voices) {
  return voices.filter((voice) => hasVerifiedLanguage(voice, "th"));
}

function describeVoice(voice) {
  const name = String(voice?.name || "Unnamed voice");
  const voiceId = String(voice?.voice_id || "unknown-id");
  return `${name} (${voiceId})`;
}

function assertValidThaiVoiceId(
  voiceId,
  source = "ELEVENLABS_VOICE_ID_TH",
  allVoices = [],
) {
  if (!voiceId) {
    throw new Error(
      `${source} is required and must point to a verified Thai-capable voice. Run npm run audio:list-voices:th and update .env before regenerating Thai assets.`,
    );
  }

  const legacyVoiceName = LEGACY_INVALID_THAI_VOICE_IDS.get(voiceId);
  if (legacyVoiceName) {
    throw new Error(
      `${source} is currently set to ${legacyVoiceName} (${voiceId}), which is not a Thai voice. Run npm run audio:list-voices:th, choose a verified Thai-capable voice, and update .env before regenerating Thai assets.`,
    );
  }

  if (allVoices.length === 0) {
    return null;
  }

  const selectedVoice = allVoices.find((voice) => voice?.voice_id === voiceId);
  const thaiVoices = getVerifiedThaiVoices(allVoices);

  if (!selectedVoice) {
    throw new Error(
      `${source} (${voiceId}) is not present in the current ElevenLabs account list. Run npm run audio:list-voices:th and pick one of the verified Thai voices when available.`,
    );
  }

  if (hasVerifiedLanguage(selectedVoice, "th")) {
    return selectedVoice;
  }

  const availableThaiVoices = thaiVoices.length
    ? thaiVoices.map(describeVoice).join(", ")
    : "none in current account list";
  throw new Error(
    `${source} points to ${describeVoice(selectedVoice)}, which is not verified for Thai. Available verified Thai voices: ${availableThaiVoices}.`,
  );
}

async function assertConfiguredThaiVoice(
  apiKey,
  voiceId,
  source = "ELEVENLABS_VOICE_ID_TH",
) {
  const voices = await fetchElevenLabsVoices(apiKey);
  const selectedVoice = assertValidThaiVoiceId(voiceId, source, voices);
  return {
    voices,
    selectedVoice,
    thaiVoices: getVerifiedThaiVoices(voices),
  };
}

module.exports = {
  assertConfiguredThaiVoice,
  assertValidThaiVoiceId,
  describeVoice,
  fetchElevenLabsVoices,
  getVerifiedThaiVoices,
  hasFlag,
  loadDotEnvIfPresent,
  readFlagValue,
};
