#!/usr/bin/env node

/**
 * ElevenLabs Audio Generator for Kindergarten Race Game
 * Generates all required audio files with multi-language support
 *
 * MULTI-LANGUAGE SUPPORT:
 * - Use eleven_multilingual_v2 model for all 6 languages
 * - Pass language_code parameter with each TTS request
 * - Voice IDs configured in src/lib/constants/language-config.ts
 * - Generates audio files with language suffix: {name}_{lang}.wav
 *
 * USAGE:
 *   node generate-audio.cjs --language en     # English only
 *   node generate-audio.cjs --language all    # All 6 languages
 *   node generate-audio.cjs --language fr,ja  # Specific languages
 */

// TODO: [OPTIMIZATION] Consider moving audio generation to a separate microservice for scalability

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

// Configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";

// Multi-language voice IDs (from src/lib/constants/language-config.ts)
// Thai male voice changed to "Daniel" - softer, warmer narrator voice
const VOICE_IDS = {
  en: process.env.ELEVENLABS_VOICE_ID || "zmcVlqmyk3Jpn5AVYcAL",
  fr: process.env.ELEVENLABS_VOICE_ID_FR || "EXAVITQu4EsNXjluf0k5",
  ja: process.env.ELEVENLABS_VOICE_ID_JA || "z9f4UheRPK2ZesPXd14b",
  // Changed from BZlaCzXKMq7g5K1RdF0T to Daniel (onwK4e9ZLuTAKqWW03F9) - softer, warmer
  th: process.env.ELEVENLABS_VOICE_ID_TH || "onwK4e9ZLuTAKqWW03F9",
  "zh-CN": process.env.ELEVENLABS_VOICE_ID_ZH_CN || "cjVigY5qzO86Huf0OWal",
  "zh-HK": process.env.ELEVENLABS_VOICE_ID_ZH_HK || "wVcwzhXu7f0K5a1WoqaJ",
};

const LANGUAGE_CODES = {
  en: "en",
  fr: "fr",
  ja: "ja",
  th: "th",
  "zh-CN": "zh",
  "zh-HK": "zh",
};

const VOICE_ID = VOICE_IDS.en; // Legacy fallback
const VOICE_ID_THAI = VOICE_IDS.th; // Legacy compatibility

const WELCOME_ASSOCIATION_THAI_TEXT =
  process.env.WELCOME_ASSOCIATION_THAI_TEXT || "";
const WELCOME_LEARNING_THAI_TEXT = process.env.WELCOME_LEARNING_THAI_TEXT || "";
const FORCE_REGEN = (process.env.FORCE_REGEN || "").toLowerCase() === "true";
const OUTPUT_DIR = path.join(__dirname, "..", "sounds");

if (!ELEVENLABS_API_KEY) {
  console.error(
    "❌ Error: ELEVENLABS_API_KEY environment variable is required"
  );
  console.log(
    "Please set it with: export ELEVENLABS_API_KEY=your_api_key_here"
  );
  process.exit(1);
}

// Voice settings optimized for clear child-friendly pronunciation
// Adjusted for softer, warmer tone (Morgan Freeman-like quality)
// - Lower stability (0.35) creates very warm, gentle speech
// - Higher similarity_boost (0.9) maintains clearer pronunciation
// - style (0.1) subtle expressiveness, not dramatic
// - speaking_rate reduced via SSML for slower pace
const VOICE_SETTINGS = {
  stability: 0.35, // Very low for maximum warmth and gentle tone
  similarity_boost: 0.9, // High for clearer, crisper pronunciation
  style: 0.1, // Minimal style for calm, soothing delivery
  use_speaker_boost: true, // Enhanced clarity for children
};

// Alternative softer voice settings for welcome messages
// Even warmer and slower for a comforting, grandfather-like quality
const VOICE_SETTINGS_SOFT = {
  stability: 0.3, // Maximum warmth - very gentle delivery
  similarity_boost: 0.85, // Good pronunciation retention
  style: 0.05, // Almost no style exaggeration - calm and steady
  use_speaker_boost: true,
};

// All audio files needed for the game
const AUDIO_PHRASES = [
  // Numbers 1-15 (including double digits)
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",

  // Alphabet A-Z
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",

  // Fruits & Vegetables
  "apple",
  "banana",
  "grapes",
  "strawberry",
  "carrot",
  "cucumber",
  "watermelon",
  "broccoli",
  "orange",
  "lemon",
  "peach",
  "cherry",
  "kiwi",

  // Shapes
  "circle",
  "square",
  "diamond",
  "triangle",
  "star",
  "oval",
  "rectangle",
  "pentagon",
  "hexagon",

  // Colors
  "blue",
  "red",
  "orange",
  "green",
  "purple",
  "white",
  "black",
  "brown",
  "pink",
  "yellow",

  // Animals
  "dog",
  "cat",
  "fox",
  "turtle",
  "butterfly",
  "owl",
  "ant",
  "duck",
  "elephant",
  "fish",
  "giraffe",
  "lion",
  "mouse",
  "penguin",
  "rabbit",
  "snake",
  "tiger",
  "whale",
  "zebra",

  // Nature
  "tree",
  "flower",
  "leaf",
  "sun",
  "moon",
  "rainbow",

  // Vehicles (Things That Go)
  "car",
  "bus",
  "fire truck",
  "airplane",
  "rocket",
  "bicycle",
  "helicopter",
  "boat",
  "train",
  "taxi",
  "van",
  "scooter",
  "motorcycle",

  // Weather
  "sunny",
  "partly cloudy",
  "cloudy",
  "rainy",
  "stormy",
  "snowy",
  "tornado",
  "windy",
  "foggy",
  "lightning",

  // Feelings & Actions
  "happy",
  "sad",
  "angry",
  "sleepy",
  "hug",
  "clap",
  "dance",
  "flip",
  "smile",
  "laugh",
  "think",
  "celebrate",
  "wave",

  // Body Parts
  "eye",
  "ear",
  "nose",
  "mouth",
  "tongue",
  "hand",
  "foot",
  "leg",
  "tooth",
  "arm",
  "brain",
  "heart",

  // Objects with emoji_ prefix for compatibility
  "emoji_apple",
  "emoji_banana",
  "emoji_grapes",
  "emoji_watermelon",
  "emoji_orange",
  "emoji_ant",
  "emoji_ball",
  "emoji_car",
  "emoji_cat",
  "emoji_dog",
  "emoji_duck",
  "emoji_egg",
  "emoji_elephant",
  "emoji_fish",
  "emoji_flower",
  "emoji_giraffe",
  "emoji_hat",
  "emoji_house",
  "emoji_ice cream",
  "emoji_iguana",
  "emoji_jar",
  "emoji_juice",
  "emoji_key",
  "emoji_kite",
  "emoji_leaf",
  "emoji_lion",
  "emoji_moon",
  "emoji_mouse",
  "emoji_nest",
  "emoji_nose",
  "emoji_owl",
  "emoji_penguin",
  "emoji_pizza",
  "emoji_queen",
  "emoji_question mark",
  "emoji_rabbit",
  "emoji_rainbow",
  "emoji_snake",
  "emoji_sun",
  "emoji_tiger",
  "emoji_tree",
  "emoji_umbrella",
  "emoji_unicorn",
  "emoji_violin",
  "emoji_volcano",
  "emoji_whale",
  "emoji_x-ray",
  "emoji_xylophone",
  "emoji_yacht",
  "emoji_yarn",
  "emoji_zipper",

  // Sound effects
  "success",
  "wrong",
  "win",
  "tap",
  "explosion",
  "laser",

  // Welcome messages
  "welcome",

  // Welcome screen sequential audio (professional voice + children's choir)
  "welcome_association", // "In association with SANGSOM Kindergarten"
  "welcome_learning", // "Learning through games for everyone!"
  // Thai male translations (must translate the existing English welcome lines)
  "welcome_association_thai",
  "welcome_learning_thai",
];

// Rate limiting
const DELAY_BETWEEN_REQUESTS = 500; // ms

// Custom text mappings for phrases that need different spoken text
const PHRASE_TEXT_MAPPING = {
  welcome_association: "In association with SANGSOM Kindergarten",
  welcome_learning: "Learning through games for everyone!",
  // REQUIRED: provide exact Thai translation text via env vars
  welcome_association_thai: WELCOME_ASSOCIATION_THAI_TEXT,
  welcome_learning_thai: WELCOME_LEARNING_THAI_TEXT,
};

/**
 * Generate audio using ElevenLabs API
 * @param {string} text - Text to synthesize
 * @param {string} outputPath - Output file path
 * @param {string} languageCode - ISO language code (en, fr, ja, th, zh)
 * @param {string} voiceId - ElevenLabs voice ID for this language
 */
function generateAudio(
  text,
  outputPath,
  languageCode = "en",
  voiceId = VOICE_ID
) {
  return new Promise((resolve, reject) => {
    // Check if there's a custom text mapping first
    let speechText = PHRASE_TEXT_MAPPING[text] || text;

    if (
      (text === "welcome_association_thai" ||
        text === "welcome_learning_thai") &&
      !speechText
    ) {
      reject(
        new Error(
          "Missing Thai welcome text for " +
            text +
            ". Set WELCOME_ASSOCIATION_THAI_TEXT or WELCOME_LEARNING_THAI_TEXT to the exact Thai translations you want recorded."
        )
      );
      return;
    }

    // Prepare text for speech (remove emoji_ prefix for natural pronunciation)
    speechText = speechText.replace("emoji_", "").replace(/_/g, " ");

    const postData = JSON.stringify({
      text: speechText,
      model_id: "eleven_multilingual_v2",
      voice_settings: VOICE_SETTINGS,
      language_code: languageCode || "en", // Add language code for multilingual model
    });

    const isThaiWelcome =
      text === "welcome_association_thai" || text === "welcome_learning_thai";
    const voiceIdToUse =
      voiceId || (isThaiWelcome && VOICE_ID_THAI ? VOICE_ID_THAI : VOICE_ID);

    const options = {
      hostname: "api.elevenlabs.io",
      port: 443,
      path: `/v1/text-to-speech/${voiceIdToUse}`,
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
        fs.unlink(outputPath, () => {
          // Cleanup complete
        });
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
  console.log("🎙️  ElevenLabs Audio Generator for Kindergarten Race Game");
  console.log("━".repeat(60));
  console.log(`Voice ID: ${VOICE_ID}`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);
  console.log(`Total Files to Generate: ${AUDIO_PHRASES.length}`);
  console.log("━".repeat(60));
  console.log("");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✓ Created output directory: ${OUTPUT_DIR}`);
  }

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (let i = 0; i < AUDIO_PHRASES.length; i++) {
    const phrase = AUDIO_PHRASES[i];
    const filename = `${phrase}.wav`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    if (!FORCE_REGEN && fs.existsSync(outputPath)) {
      process.stdout.write(
        `[${i + 1}/${AUDIO_PHRASES.length}] Skipping "${phrase}" (already exists) ...`
      );
      console.log(" ✓");
      skippedCount++;
      continue;
    }

    try {
      process.stdout.write(
        `[${i + 1}/${AUDIO_PHRASES.length}] Generating "${phrase}"...`
      );

      await generateAudio(phrase, outputPath);
      successCount++;

      console.log(" ✓");

      // Rate limiting
      if (i < AUDIO_PHRASES.length - 1) {
        await sleep(DELAY_BETWEEN_REQUESTS);
      }
    } catch (error) {
      failCount++;
      errors.push({ phrase, error: error.message });
      console.log(` ✗ (${error.message})`);
    }
  }

  console.log("");
  console.log("━".repeat(60));
  console.log("📊 Generation Summary");
  console.log("━".repeat(60));
  console.log(`✓ Success: ${successCount} files`);
  console.log(`⊘ Skipped: ${skippedCount} files`);
  console.log(`✗ Failed: ${failCount} files`);
  console.log("");

  if (errors.length > 0) {
    console.log("❌ Failed Files:");
    errors.forEach(({ phrase, error }) => {
      console.log(`   - ${phrase}: ${error}`);
    });
    console.log("");
  }

  if (successCount > 0) {
    console.log("✅ Audio generation complete!");
    console.log(`   Generated files are in: ${OUTPUT_DIR}`);
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run the script
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
