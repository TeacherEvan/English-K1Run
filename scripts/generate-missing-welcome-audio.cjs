#!/usr/bin/env node
/**
 * Generate Missing Welcome Audio Files
 *
 * Generates only the 3 missing welcome audio files:
 * 1. welcome_evan_intro.mp3
 * 2. welcome_sangsom_association.mp3
 * 3. welcome_sangsom_association_thai.mp3
 *
 * Usage:
 *   node scripts/generate-missing-welcome-audio.cjs
 *
 * Requirements:
 *   - ELEVENLABS_API_KEY environment variable must be set
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const OUTPUT_DIR = path.join(__dirname, "..", "sounds");

// Voice IDs (from generate-audio.cjs)
const VOICE_ID_ENGLISH =
  process.env.ELEVENLABS_VOICE_ID || "E4IXevHtHpKGh0bvrPPr"; // Alice
const VOICE_ID_THAI =
  process.env.ELEVENLABS_VOICE_ID_TH || "onwK4e9ZLuTAKqWW03F9"; // Daniel

// Voice settings (from generate-audio.cjs)
const VOICE_SETTINGS = {
  stability: 0.35,
  similarity_boost: 0.9,
  style: 0.1,
  use_speaker_boost: true,
};

// Files to generate
const MISSING_FILES = [
  {
    filename: "welcome_evan_intro.mp3",
    text: "Welcome to Teacher Evan's Super Student, let's have fun learning together!",
    voiceId: VOICE_ID_ENGLISH,
    languageCode: "en",
  },
  {
    filename: "welcome_sangsom_association.mp3",
    text: "In association with Sangsom Kindergarten, learning through games for everyone.",
    voiceId: VOICE_ID_ENGLISH,
    languageCode: "en",
  },
  {
    filename: "welcome_sangsom_association_thai.mp3",
    text: "ร่วมกับโรงเรียนอนุบาลสังสม",
    voiceId: VOICE_ID_THAI,
    languageCode: undefined, // Remove language code - let ElevenLabs auto-detect
  },
];

/**
 * Generate a single audio file using ElevenLabs API
 */
function generateAudio(text, outputPath, voiceId, languageCode) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: VOICE_SETTINGS,
      language_code: languageCode,
    });

    const options = {
      hostname: "api.elevenlabs.io",
      port: 443,
      path: `/v1/text-to-speech/${voiceId}`,
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
 * Main execution
 */
async function main() {
  console.log("🎙️  Generating Missing Welcome Audio Files");
  console.log("━".repeat(60));

  if (!ELEVENLABS_API_KEY) {
    console.error(
      "❌ Error: ELEVENLABS_API_KEY environment variable is required",
    );
    console.log(
      "Please set it with: export ELEVENLABS_API_KEY=your_api_key_here",
    );
    process.exit(1);
  }

  console.log(`Voice ID (English): ${VOICE_ID_ENGLISH}`);
  console.log(`Voice ID (Thai): ${VOICE_ID_THAI}`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);
  console.log(`Files to Generate: ${MISSING_FILES.length}`);
  console.log("━".repeat(60));
  console.log("");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (let i = 0; i < MISSING_FILES.length; i++) {
    const file = MISSING_FILES[i];
    const outputPath = path.join(OUTPUT_DIR, file.filename);

    // Check if file already exists
    if (fs.existsSync(outputPath)) {
      console.log(
        `[${i + 1}/${MISSING_FILES.length}] ⊘ Skipping "${file.filename}" (already exists)`,
      );
      successCount++;
      continue;
    }

    try {
      process.stdout.write(
        `[${i + 1}/${MISSING_FILES.length}] Generating "${file.filename}"...`,
      );

      await generateAudio(
        file.text,
        outputPath,
        file.voiceId,
        file.languageCode,
      );
      successCount++;

      console.log(" ✓");

      // Rate limiting (500ms between requests)
      if (i < MISSING_FILES.length - 1) {
        await sleep(500);
      }
    } catch (error) {
      failCount++;
      errors.push({ filename: file.filename, error: error.message });
      console.log(` ✗ (${error.message})`);
    }
  }

  console.log("");
  console.log("━".repeat(60));
  console.log("📊 Generation Summary");
  console.log("━".repeat(60));
  console.log(`✓ Success: ${successCount} files`);
  console.log(`✗ Failed: ${failCount} files`);
  console.log("");

  if (errors.length > 0) {
    console.log("❌ Failed Files:");
    errors.forEach(({ filename, error }) => {
      console.log(`   - ${filename}: ${error}`);
    });
    console.log("");
  }

  if (successCount > 0) {
    console.log("✅ Audio generation complete!");
    console.log(`   Generated files are in: ${OUTPUT_DIR}`);
    console.log("");
    console.log("📌 Next Steps:");
    console.log("   1. Refresh the browser to test new audio files");
    console.log("   2. Run: npm run audio:validate");
    console.log('   3. Verify zero "No URL found" warnings in console');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run the script
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
