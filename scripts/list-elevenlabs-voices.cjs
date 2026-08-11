#!/usr/bin/env node

/**
 * Lists available ElevenLabs voices for the configured API key.
 *
 * Usage (PowerShell):
 *   $env:ELEVENLABS_API_KEY="..."; node scripts/list-elevenlabs-voices.cjs
 *
 * Notes:
 * - Does not print the API key.
 * - Prints a compact table: name, voice_id.
 */

const https = require("https");
const {
  describeVoice,
  fetchElevenLabsVoices,
  getVerifiedThaiVoices,
  loadDotEnvIfPresent,
  readFlagValue,
} = require("./audio-script-utils.cjs");

loadDotEnvIfPresent();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const currentThaiVoiceId = process.env.ELEVENLABS_VOICE_ID_TH || "";
const requestedLanguage = readFlagValue("--lang");

if (!ELEVENLABS_API_KEY) {
  console.error(
    "❌ Error: ELEVENLABS_API_KEY environment variable is required",
  );
  process.exit(1);
}

(async () => {
  try {
    const voices = await fetchElevenLabsVoices(ELEVENLABS_API_KEY);
    if (voices.length === 0) {
      console.log("No voices returned. Check your ElevenLabs account/API key.");
      process.exit(0);
    }

    const thaiVoices = getVerifiedThaiVoices(voices);
    const currentThaiVoice = voices.find(
      (voice) => voice?.voice_id === currentThaiVoiceId,
    );

    if (requestedLanguage === "th") {
      console.log("\nVerified Thai ElevenLabs voices:");
      console.log("-".repeat(72));
      if (thaiVoices.length === 0) {
        console.log(
          "No verified Thai voices returned for this account right now.",
        );
      } else {
        console.log(`${"Name".padEnd(42)}  voice_id`);
        console.log("-".repeat(72));
        for (const voice of thaiVoices) {
          const name = String(voice?.name ?? "(unnamed)");
          const voiceId = String(voice?.voice_id ?? "");
          console.log(`${name.slice(0, 42).padEnd(42)}  ${voiceId}`);
        }
      }

      console.log("-".repeat(72));
      if (!currentThaiVoiceId) {
        console.log("Current ELEVENLABS_VOICE_ID_TH is empty.");
      } else if (!currentThaiVoice) {
        console.log(
          `Current ELEVENLABS_VOICE_ID_TH (${currentThaiVoiceId}) is not present in this account list.`,
        );
      } else if (
        thaiVoices.some((voice) => voice.voice_id === currentThaiVoiceId)
      ) {
        console.log(
          `Current ELEVENLABS_VOICE_ID_TH is valid: ${describeVoice(currentThaiVoice)}`,
        );
      } else {
        console.log(
          `Current ELEVENLABS_VOICE_ID_TH is not Thai-verified: ${describeVoice(currentThaiVoice)}`,
        );
      }

      if (thaiVoices.length > 0) {
        console.log(
          "\nCopy one of these voice_id values into ELEVENLABS_VOICE_ID_TH, then rerun npm run audio:generate-welcome:th.",
        );
      } else {
        console.log(
          "\nAdd or clone a Thai voice in ElevenLabs, then rerun npm run audio:list-voices:th.",
        );
      }
      process.exit(0);
    }

    // Print a small table (name + voice_id) for easy copy/paste.
    console.log("\nAvailable ElevenLabs voices:");
    console.log("-".repeat(72));
    console.log(`${"Name".padEnd(42)}  ${"voice_id"}`);
    console.log("-".repeat(72));

    for (const voice of voices) {
      const name = String(voice?.name ?? "(unnamed)");
      const voiceId = String(voice?.voice_id ?? "");
      console.log(`${name.slice(0, 42).padEnd(42)}  ${voiceId}`);
    }

    console.log("-".repeat(72));
    console.log(`Thai-verified voices in this account: ${thaiVoices.length}`);
    console.log(
      "\nPick the voice_id you want and copy it into .env.example/.env using the ELEVENLABS_VOICE_ID_* variables (for Thai, use ELEVENLABS_VOICE_ID_TH, and prefer npm run audio:list-voices:th).",
    );
  } catch (err) {
    console.error("❌ Failed to list voices:", err?.message || err);
    process.exit(1);
  }
})();
