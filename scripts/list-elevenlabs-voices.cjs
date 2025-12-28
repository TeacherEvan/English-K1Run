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
const fs = require("fs");
const path = require("path");

function loadDotEnvIfPresent() {
  try {
    const envPath = path.join(__dirname, "..", ".env");
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key) continue;
      if (process.env[key]) continue;
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
    // Ignore .env load errors and fall back to real env vars.
  }
}

loadDotEnvIfPresent();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";

if (!ELEVENLABS_API_KEY) {
  console.error(
    "❌ Error: ELEVENLABS_API_KEY environment variable is required"
  );
  process.exit(1);
}

function httpGetJson({ hostname, path, headers }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        port: 443,
        path,
        method: "GET",
        headers,
      },
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
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

(async () => {
  try {
    const result = await httpGetJson({
      hostname: "api.elevenlabs.io",
      path: "/v1/voices",
      headers: {
        Accept: "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    });

    const voices = Array.isArray(result?.voices) ? result.voices : [];
    if (voices.length === 0) {
      console.log("No voices returned. Check your ElevenLabs account/API key.");
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
    console.log(
      "\nPick a Thai male voice_id and set ELEVENLABS_VOICE_ID_THAI to that value."
    );
  } catch (err) {
    console.error("❌ Failed to list voices:", err?.message || err);
    process.exit(1);
  }
})();
