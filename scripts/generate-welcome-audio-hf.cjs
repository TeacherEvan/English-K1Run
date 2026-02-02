#!/usr/bin/env node
/**
 * Generate Welcome Audio Files using HuggingFace Inference API
 *
 * Uses Microsoft SpeechT5 TTS model (free tier compatible)
 * Generates the 3 welcome audio files for startup
 *
 * Usage:
 *   node scripts/generate-welcome-audio-hf.cjs
 *
 * Requirements:
 *   - HF_TOKEN environment variable (optional - uses public API without token)
 *   - Internet connection
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Configuration
const HF_TOKEN = process.env.HF_TOKEN || process.env.HF_API_KEY || "";
const OUTPUT_DIR = path.join(__dirname, "..", "sounds");
// Using Facebook's MMS TTS which supports direct text-to-speech
const MODEL_ID = "facebook/mms-tts-eng";
const API_HOST = "api-inference.huggingface.co";
const API_PATH = `/models/${MODEL_ID}`;

if (!HF_TOKEN) {
  console.error("❌ HF_TOKEN environment variable is required");
  console.log("Get a free token from: https://huggingface.co/settings/tokens");
  process.exit(1);
}

// Files to generate
const AUDIO_FILES = [
  {
    filename: "welcome_evan_intro.mp3",
    text: "Welcome to Teacher Evan's Super Student, lets have fun learning together!",
  },
  {
    filename: "welcome_sangsom_association.mp3",
    text: "In association with Sangsom Kindergarten, learning through games for everyone.",
  },
  {
    filename: "welcome_learning.mp3",
    text: "Let's learn together!",
  },
];

/**
 * Query HuggingFace Inference API for text-to-speech
 */
function queryHuggingFace(text) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ inputs: text });

    const options = {
      hostname: API_HOST,
      port: 443,
      path: API_PATH,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        Authorization: `Bearer ${HF_TOKEN}`,
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];

      // Check for errors
      if (res.statusCode !== 200) {
        let errorData = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (errorData += chunk));
        res.on("end", () => {
          reject(new Error(`HTTP ${res.statusCode}: ${errorData}`));
        });
        return;
      }

      // Collect audio data
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Save audio buffer to file
 */
function saveAudioFile(buffer, filePath) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, buffer, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Wait for model to load (HF inference API may need warmup)
 */
async function waitForModel(maxRetries = 5, delayMs = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const buffer = await queryHuggingFace("Test");
      if (buffer.length > 0) {
        return true; // Model is ready
      }
    } catch (error) {
      if (error.message.includes("loading")) {
        console.log(
          `⏳ Model is loading... (attempt ${i + 1}/${maxRetries}, waiting ${delayMs}ms)`,
        );
        await sleep(delayMs);
      } else {
        throw error; // Re-throw other errors
      }
    }
  }
  throw new Error("Model failed to load after maximum retries");
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main execution
 */
async function main() {
  console.log("🎙️  Generating Welcome Audio Files (HuggingFace)");
  console.log("━".repeat(60));
  console.log(`Model: ${MODEL_ID} (Facebook MMS TTS)`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);
  console.log(`Files to Generate: ${AUDIO_FILES.length}`);
  console.log(`Using Token: ${HF_TOKEN ? "Yes" : "No (public API)"}`);
  console.log("━".repeat(60));
  console.log("");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Wait for model to be ready
  console.log("🔄 Warming up model...");
  try {
    await waitForModel();
    console.log("✓ Model is ready\n");
  } catch (error) {
    console.error("❌ Model warmup failed:", error.message);
    console.log(
      "\n💡 Tip: The model may be cold-starting. Try again in a minute.",
    );
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (let i = 0; i < AUDIO_FILES.length; i++) {
    const file = AUDIO_FILES[i];
    const outputPath = path.join(OUTPUT_DIR, file.filename);

    // Check if file already exists
    if (fs.existsSync(outputPath)) {
      console.log(
        `[${i + 1}/${AUDIO_FILES.length}] ⊘ Skipping "${file.filename}" (already exists)`,
      );
      successCount++;
      continue;
    }

    try {
      process.stdout.write(
        `[${i + 1}/${AUDIO_FILES.length}] Generating "${file.filename}"...`,
      );

      // Generate audio
      const audioBuffer = await queryHuggingFace(file.text);

      // Save to file
      await saveAudioFile(audioBuffer, outputPath);

      successCount++;
      console.log(" ✓");

      // Rate limiting (avoid overwhelming the API)
      if (i < AUDIO_FILES.length - 1) {
        await sleep(1000); // 1 second between requests
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
    console.log("");
    console.log("💡 Note: HuggingFace TTS uses Facebook MMS model");
    console.log(
      "   Voice quality may differ from ElevenLabs but is completely free!",
    );
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run the script
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
