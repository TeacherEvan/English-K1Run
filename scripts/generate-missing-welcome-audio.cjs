#!/usr/bin/env node
/**
 * Generate missing welcome audio files for English and Thai.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const {
  assertConfiguredThaiVoice,
  hasFlag,
  loadDotEnvIfPresent,
  readFlagValue,
} = require("./audio-script-utils.cjs");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function generateAudio(text, outputPath, voiceId, languageCode) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID,
      voice_settings: {
        stability: 0.35,
        similarity_boost: 0.9,
        style: 0.1,
        use_speaker_boost: true,
      },
      language_code: languageCode,
    });

    const req = https.request(
      {
        hostname: "api.elevenlabs.io",
        port: 443,
        path: `/v1/text-to-speech/${voiceId}`,
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          let errorData = "";
          res.on("data", (chunk) => (errorData += chunk));
          res.on("end", () =>
            reject(new Error(`HTTP ${res.statusCode}: ${errorData}`)),
          );
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
      },
    );

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

loadDotEnvIfPresent();

const OUTPUT_DIR = path.join(__dirname, "..", "sounds");
const PUBLIC_OUTPUT_DIR = path.join(__dirname, "..", "public", "sounds");
const VOICE_ID_ENGLISH = process.env.ELEVENLABS_VOICE_ID || "";
const VOICE_ID_THAI = process.env.ELEVENLABS_VOICE_ID_TH || "";
const forceOverwrite = hasFlag("--force");
const requestedLanguage = readFlagValue("--lang") ?? "all";
const selectedLanguage = ["all", "en", "th"].includes(requestedLanguage)
  ? requestedLanguage
  : "all";

const MISSING_FILES = [
  {
    filename: "welcome_evan_intro.mp3",
    text: "Welcome to Teacher Evan's Super Student, let's have fun learning together!",
    voiceId: VOICE_ID_ENGLISH,
    languageCode: "en",
  },
  {
    filename: "welcome_evan_intro_thai.mp3",
    text: "ยินดีต้อนรับสู่ Super Student ของคุณครูอีแวน มาเรียนอย่างสนุกด้วยกันนะ!",
    voiceId: VOICE_ID_THAI,
    languageCode: "th",
  },
  {
    filename: "welcome_sangsom_association.mp3",
    text: "In association with Sangsom Kindergarten. Learning through games for everyone.",
    voiceId: VOICE_ID_ENGLISH,
    languageCode: "en",
  },
  {
    filename: "welcome_sangsom_association_thai.mp3",
    text: "ร่วมกับโรงเรียนอนุบาลสังสม",
    voiceId: VOICE_ID_THAI,
    languageCode: "th",
  },
];

async function main() {
  console.log("🎙️  Generating missing welcome audio files");
  console.log("━".repeat(60));

  if (!process.env.ELEVENLABS_API_KEY) {
    console.error(
      "❌ Error: ELEVENLABS_API_KEY environment variable is required",
    );
    process.exit(1);
  }
  if (!process.env.ELEVENLABS_MODEL_ID) {
    console.error(
      "❌ Error: ELEVENLABS_MODEL_ID environment variable is required",
    );
    process.exit(1);
  }
  if (!VOICE_ID_ENGLISH || !VOICE_ID_THAI) {
    console.error(
      "❌ Error: ELEVENLABS_VOICE_ID and ELEVENLABS_VOICE_ID_TH are required",
    );
    process.exit(1);
  }

  try {
    const { selectedVoice } = await assertConfiguredThaiVoice(
      process.env.ELEVENLABS_API_KEY,
      VOICE_ID_THAI,
    );
    console.log(
      `Thai voice: ${selectedVoice.name} (${selectedVoice.voice_id})`,
    );
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }

  const filesToGenerate = MISSING_FILES.filter((file) =>
    selectedLanguage === "all" ? true : file.languageCode === selectedLanguage,
  );

  console.log(
    `Scope: ${selectedLanguage === "all" ? "all welcome audio" : `${selectedLanguage} welcome audio only`}`,
  );
  console.log(
    `Mode: ${forceOverwrite ? "force overwrite existing files" : "generate only missing files"}`,
  );

  ensureDir(OUTPUT_DIR);
  ensureDir(PUBLIC_OUTPUT_DIR);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < filesToGenerate.length; i++) {
    const file = filesToGenerate[i];
    const outputPath = path.join(OUTPUT_DIR, file.filename);
    const publicPath = path.join(PUBLIC_OUTPUT_DIR, file.filename);

    if (
      !forceOverwrite &&
      fs.existsSync(outputPath) &&
      fs.existsSync(publicPath)
    ) {
      console.log(
        `[${i + 1}/${filesToGenerate.length}] ⊘ Skipping "${file.filename}" (already exists)`,
      );
      successCount++;
      continue;
    }

    try {
      process.stdout.write(
        `[${i + 1}/${filesToGenerate.length}] Generating "${file.filename}"...`,
      );
      await generateAudio(
        file.text,
        outputPath,
        file.voiceId,
        file.languageCode,
      );
      fs.copyFileSync(outputPath, publicPath);
      successCount++;
      console.log(" ✓");
      if (i < filesToGenerate.length - 1) await sleep(500);
    } catch (error) {
      failCount++;
      console.log(` ✗ (${error.message})`);
    }
  }

  console.log("");
  console.log("━".repeat(60));
  console.log(`✓ Success: ${successCount} files`);
  console.log(`✗ Failed: ${failCount} files`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Public: ${PUBLIC_OUTPUT_DIR}`);
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
