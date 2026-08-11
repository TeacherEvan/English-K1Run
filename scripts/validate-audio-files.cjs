#!/usr/bin/env node

/**
 * Audio File Validation Script
 * Ensures all required audio files exist before deployment
 *
 * Usage:
 *   node scripts/validate-audio-files.cjs
 *
 * Exit Codes:
 *   0 - All files validated successfully
 *   1 - Missing files or validation errors
 */

const fs = require("fs");
const path = require("path");

// Critical system sounds that MUST exist
const CRITICAL_FILES = [
  "welcome",
  "wrong",
  "tap",

  // New welcome files
  "welcome_evan_intro",
  "welcome_sangsom_association",
  "welcome_sangsom_association_thai",

  // Legacy welcome files
  "welcome_association",
  "welcome_learning",
  "welcome_association_thai",
  "welcome_learning_thai",
];

// Common priority files (Numbers, Letters, Basic Items)
const COMMON_FILES = [
  // Numbers 1-15
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

  // Letters a-z
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

  // Basic fruits and vegetables (from game-categories.ts)
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
];

// Rare priority files (Weather, Vehicles, Animals, Colors, Shapes)
const RARE_FILES = [
  // Animals
  "dog",
  "cat",
  "fox",
  "turtle",
  "butterfly",
  "owl",
  "elephant",
  "lion",
  "rabbit",
  "giraffe",
  "penguin",

  // Vehicles
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
  "cloudy",
  "rainy",
  "stormy",
  "snowy",
  "rainbow",
  "tornado",
  "windy",
  "moon",
  "star",
  "sun",
  "foggy",
  "lightning",

  // Colors
  "blue",
  "red",
  "orange",
  "green",
  "purple",
  "white",
  "yellow",
  "brown",
  "black",
  "pink",

  // Shapes
  "circle",
  "square",
  "triangle",
  "diamond",
  "star",

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
];

// Supported audio formats
const SUPPORTED_FORMATS = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"];

/**
 * Check if an audio file exists in any supported format
 */
function findAudioFile(soundsDir, fileName) {
  for (const ext of SUPPORTED_FORMATS) {
    const filePath = path.join(soundsDir, fileName + ext);
    if (fs.existsSync(filePath)) {
      return { exists: true, format: ext, path: filePath };
    }
  }
  return { exists: false, format: null, path: null };
}

/**
 * Validate audio files and report results
 */
function validateAudioFiles() {
  const soundsDir = path.join(__dirname, "..", "sounds");

  console.log("🔍 Validating Audio Files\n");
  console.log("━".repeat(60));
  console.log(`Directory: ${soundsDir}`);
  console.log("━".repeat(60));
  console.log("");

  // Check if sounds directory exists
  if (!fs.existsSync(soundsDir)) {
    console.error("❌ FATAL: Sounds directory does not exist");
    console.error(`   Expected: ${soundsDir}\n`);
    process.exit(1);
  }

  const errors = [];
  const warnings = [];
  const found = [];

  // Validate critical files (MUST exist)
  console.log("📌 Checking CRITICAL files...");
  for (const fileName of CRITICAL_FILES) {
    const result = findAudioFile(soundsDir, fileName);
    if (!result.exists) {
      errors.push(`❌ CRITICAL: Missing "${fileName}" (no audio file found)`);
    } else {
      found.push(`✓ ${fileName}${result.format}`);
      // Verbose mode: show each file (enable with DEBUG=1 env var)
      if (process.env.DEBUG) {
        console.log(`  ✓ ${fileName}${result.format}`);
      }
    }
  }
  console.log(
    `  ${CRITICAL_FILES.length - errors.length}/${CRITICAL_FILES.length} critical files found\n`,
  );

  // Validate common files (HIGH priority)
  console.log("📚 Checking COMMON files...");
  let commonMissing = 0;
  for (const fileName of COMMON_FILES) {
    const result = findAudioFile(soundsDir, fileName);
    if (!result.exists) {
      errors.push(`❌ COMMON: Missing "${fileName}" (no audio file found)`);
      commonMissing++;
    }
  }
  console.log(
    `  ${COMMON_FILES.length - commonMissing}/${COMMON_FILES.length} common files found\n`,
  );

  // Validate rare files (MEDIUM priority)
  console.log("🎯 Checking RARE files...");
  let rareMissing = 0;
  for (const fileName of RARE_FILES) {
    const result = findAudioFile(soundsDir, fileName);
    if (!result.exists) {
      warnings.push(
        `⚠️  RARE: Missing "${fileName}" (will use speech synthesis)`,
      );
      rareMissing++;
    }
  }
  console.log(
    `  ${RARE_FILES.length - rareMissing}/${RARE_FILES.length} rare files found\n`,
  );

  // Check for .wav files that should exist
  console.log("🔧 Checking for format issues...");
  const criticalWavFiles = ["wrong", "welcome"];
  for (const fileName of criticalWavFiles) {
    const wavPath = path.join(soundsDir, fileName + ".wav");
    const mp3Path = path.join(soundsDir, fileName + ".mp3");

    if (!fs.existsSync(wavPath) && fs.existsSync(mp3Path)) {
      warnings.push(
        `⚠️  ${fileName}.wav missing (${fileName}.mp3 exists - may cause 404 errors)`,
      );
    }
  }
  console.log(
    `  ${2 - warnings.filter((w) => w.includes(".wav")).length}/2 critical .wav files found\n `,
  );

  // Report results
  console.log("━".repeat(60));
  console.log("📊 Validation Summary");
  console.log("━".repeat(60));

  const totalFiles =
    CRITICAL_FILES.length + COMMON_FILES.length + RARE_FILES.length;
  const totalErrors = errors.length;
  const totalWarnings = warnings.length;
  const totalFound =
    totalFiles -
    totalErrors -
    warnings.filter((w) => w.includes("RARE")).length;

  console.log(`✓ Found: ${totalFound} files`);
  console.log(`❌ Errors: ${totalErrors} files`);
  console.log(`⚠️  Warnings: ${totalWarnings} files`);
  console.log("");

  // Display errors (blocking issues)
  if (errors.length > 0) {
    console.error("❌ ERRORS (must be fixed):\n");
    errors.forEach((e) => console.error(`   ${e}`));
    console.error("");
  }

  // Display warnings (non-blocking)
  if (warnings.length > 0) {
    console.warn("⚠️  WARNINGS (recommended to fix):\n");
    warnings.forEach((w) => console.warn(`   ${w}`));
    console.warn("");
  }

  // Exit with appropriate code
  if (errors.length > 0) {
    console.error("━".repeat(60));
    console.error("❌ VALIDATION FAILED");
    console.error("━".repeat(60));
    console.error("");
    console.error("Fix the errors above before deploying.");
    console.error("");
    console.error("Quick fixes:");
    console.error(
      "  1. Generate missing files: node scripts/generate-audio.cjs",
    );
    console.error(
      "  2. Convert .mp3 to .wav: ffmpeg -i sounds/file.mp3 sounds/file.wav",
    );
    console.error("");
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log("━".repeat(60));
    console.log("⚠️  VALIDATION PASSED WITH WARNINGS  ");
    console.log("━".repeat(60));
    console.log("");
    console.log("The app will work but may use speech synthesis fallbacks.");
    console.log("Consider fixing warnings for better user experience.");
    console.log("");
  } else {
    console.log("━".repeat(60));
    console.log("✅ VALIDATION PASSED");
    console.log("━".repeat(60));
    console.log("");
    console.log("All required audio files are present!");
    console.log("");
  }

  process.exit(0);
}

// Run validation
validateAudioFiles();
