#!/usr/bin/env node

/**
 * Generate ONLY missing audio files for the Kindergarten Race Game
 * This script checks which files are missing and generates only those
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "";
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "";
const OUTPUT_DIR = path.join(__dirname, "..", "sounds");

if (!ELEVENLABS_API_KEY) {
  console.error(
    "❌ Error: ELEVENLABS_API_KEY environment variable is required",
  );
  console.log(
    "Please set it with: export ELEVENLABS_API_KEY=your_api_key_here",
  );
  process.exit(1);
}

if (!ELEVENLABS_MODEL_ID) {
  console.error(
    "❌ Error: ELEVENLABS_MODEL_ID environment variable is required",
  );
  process.exit(1);
}

if (!VOICE_ID) {
  console.error(
    "❌ Error: ELEVENLABS_VOICE_ID environment variable is required",
  );
  process.exit(1);
}

// Voice settings optimized for clear child-friendly pronunciation
const VOICE_SETTINGS = {
  stability: 0.75,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true,
};

// Missing audio files identified from categories
const MISSING_PHRASES = [
  // Numbers 11-15
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",

  // Additional fruits/vegetables
  "lemon",
  "peach",
  "cherry",
  "kiwi",

  // Vehicles
  "train",
  "taxi",
  "van",
  "scooter",
  "motorcycle",

  // Weather
  "cloudy",
  "foggy",
  "lightning",

  // Feelings & Actions
  "smile",
  "laugh",
  "think",
  "wave",

  // Body Parts
  "tooth",
  "arm",
  "brain",
  "heart",
];

// Rate limiting
const DELAY_BETWEEN_REQUESTS = 500; // ms

/**
 * Generate audio using ElevenLabs API
 */
function generateAudio(text, outputPath) {
  return new Promise((resolve, reject) => {
    const speechText = text.replace("emoji_", "").replace(/_/g, " ");

    const postData = JSON.stringify({
      text: speechText,
      model_id: ELEVENLABS_MODEL_ID,
      voice_settings: VOICE_SETTINGS,
    });

    const options = {
      hostname: "api.elevenlabs.io",
      port: 443,
      path: `/v1/text-to-speech/${VOICE_ID}`,
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errorData = "";
        res.on("data", (chunk) => (errorData += chunk));
        res.on("end", () => {
          reject(new Error(`HTTP ${res.statusCode}: ${errorData}`));
        });
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      res.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });

      fileStream.on("error", (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if file already exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Main execution
 */
async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("🎵 Generating Missing Audio Files for Kindergarten Race Game");
  console.log("=".repeat(60));

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const phrase of MISSING_PHRASES) {
    const filename = `${phrase}.wav`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    // Skip if file already exists
    if (fileExists(outputPath)) {
      console.log(`⏭️  Skipped (exists): ${filename}`);
      skipped++;
      continue;
    }

    try {
      console.log(`🎤 Generating: ${filename}`);
      await generateAudio(phrase, outputPath);
      console.log(`✅ Success: ${filename}`);
      generated++;

      // Rate limiting
      await sleep(DELAY_BETWEEN_REQUESTS);
    } catch (error) {
      console.error(`❌ Failed: ${filename} - ${error.message}`);
      failed++;
    }
  }

  console.log("=".repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   Generated: ${generated}`);
  console.log(`   Skipped:   ${skipped}`);
  console.log(`   Failed:    ${failed}`);
  console.log(`   Total:     ${MISSING_PHRASES.length}`);
  console.log("🎉 Done!");
}

// Run the script
main().catch((error) => {
  console.error("❌ Fatal Error:", error);
  process.exit(1);
});
