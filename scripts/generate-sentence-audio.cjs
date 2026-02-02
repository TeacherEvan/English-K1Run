#!/usr/bin/env node
/**
 * Generate sentence-based audio for all existing sound keys.
 * Uses EN sentence templates and short fallback sentences.
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
    // Ignore .env load errors and fall back to env vars.
  }
}

function parseTemplateMap(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const stripped = raw.replace(/\/\/.*$/gm, "");
  const regex = /([A-Za-z0-9_]+|"[^"]+")\s*:\s*"([^"]+)"/g;
  const map = {};
  let match = regex.exec(stripped);
  while (match) {
    let key = match[1];
    if (key.startsWith('"') && key.endsWith('"')) {
      key = key.slice(1, -1);
    }
    map[key] = match[2];
    match = regex.exec(stripped);
  }
  return map;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestTts(text, outputPath, voiceId, settings, languageCode) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: settings,
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
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
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
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function buildSentence(key, templates, overrides) {
  if (overrides[key]) return overrides[key];
  if (templates[key]) return templates[key];
  if (key.startsWith("emoji_")) {
    const base = key.replace(/^emoji_/, "").replace(/_/g, " ");
    return templates[base] || `I see ${base}.`;
  }
  if (/^[a-z]$/.test(key)) return `This is the letter ${key.toUpperCase()}.`;
  if (/^\d+$/.test(key)) return `The number is ${key}.`;
  return `I see ${key.replace(/_/g, " ")}.`;
}

async function main() {
  loadDotEnvIfPresent();

  if (!process.env.ELEVENLABS_API_KEY) {
    console.error(
      "❌ Error: ELEVENLABS_API_KEY environment variable is required",
    );
    process.exit(1);
  }

  const soundsDir = path.join(__dirname, "..", "sounds");
  const templates = parseTemplateMap(
    path.join(
      __dirname,
      "..",
      "src",
      "lib",
      "constants",
      "sentence-templates",
      "en.ts",
    ),
  );

  const overrides = {
    welcome: "Welcome to the game.",
    welcome_evan_intro:
      "Welcome to Teacher Evan's Super Student English Program.",
    welcome_sangsom_association: "In association with Sangsom Kindergarten.",
    welcome_sangsom_association_thai: "ร่วมกับโรงเรียนอนุบาลสังสม",
    welcome_association: "In association with Sangsom Kindergarten.",
    welcome_association_thai: "ร่วมกับโรงเรียนอนุบาลสังสม",
    welcome_learning: "Welcome to learning English.",
    welcome_learning_thai: "ยินดีต้อนรับสู่การเรียนภาษาอังกฤษ",
    success: "Great job, you are correct.",
    wrong: "Try again, that was not correct.",
    win: "You win, great work.",
    tap: "Tap the screen to start.",
    explosion: "The explosion is loud.",
    laser: "The laser is bright.",
  };

  const voiceIdEnglish =
    process.env.ELEVENLABS_VOICE_ID || "E4IXevHtHpKGh0bvrPPr";
  const voiceIdThai =
    process.env.ELEVENLABS_VOICE_ID_TH || "onwK4e9ZLuTAKqWW03F9";
  const voiceSettings = {
    stability: 0.35,
    similarity_boost: 0.9,
    style: 0.1,
    use_speaker_boost: true,
  };
  const voiceSettingsSoft = {
    stability: 0.3,
    similarity_boost: 0.85,
    style: 0.05,
    use_speaker_boost: true,
  };

  const wavFiles = fs
    .readdirSync(soundsDir)
    .filter((name) => name.endsWith(".wav"));
  const welcomeMp3 = [
    "welcome_evan_intro.mp3",
    "welcome_sangsom_association.mp3",
    "welcome_sangsom_association_thai.mp3",
  ].filter((name) => fs.existsSync(path.join(soundsDir, name)));

  console.log(
    "🎙️  Generating sentence-based audio (overwriting existing files)",
  );
  console.log(`WAV files: ${wavFiles.length}`);
  console.log(`MP3 files: ${welcomeMp3.length}`);

  for (let i = 0; i < wavFiles.length; i++) {
    const filename = wavFiles[i];
    const key = filename.replace(/\.wav$/i, "");
    const sentence = buildSentence(key, templates, overrides);
    const isThai =
      key.endsWith("_thai") || key === "welcome_sangsom_association_thai";
    const voiceId = isThai ? voiceIdThai : voiceIdEnglish;
    const settings = key.startsWith("welcome")
      ? voiceSettingsSoft
      : voiceSettings;
    const outputPath = path.join(soundsDir, filename);

    process.stdout.write(`[${i + 1}/${wavFiles.length}] ${filename}...`);
    await requestTts(
      sentence,
      outputPath,
      voiceId,
      settings,
      isThai ? undefined : "en",
    );
    console.log(" ✓");
    await sleep(250);
  }

  for (let i = 0; i < welcomeMp3.length; i++) {
    const filename = welcomeMp3[i];
    const key = filename.replace(/\.mp3$/i, "");
    const sentence = buildSentence(key, templates, overrides);
    const isThai =
      key.endsWith("_thai") || key === "welcome_sangsom_association_thai";
    const voiceId = isThai ? voiceIdThai : voiceIdEnglish;
    const outputPath = path.join(soundsDir, filename);

    process.stdout.write(`[MP3 ${i + 1}/${welcomeMp3.length}] ${filename}...`);
    await requestTts(
      sentence,
      outputPath,
      voiceId,
      voiceSettingsSoft,
      isThai ? undefined : "en",
    );
    console.log(" ✓");
    await sleep(250);
  }

  console.log("✅ Sentence-based audio generation complete.");
}

main().catch((error) => {
  console.error("❌ Generation failed:", error.message || error);
  process.exit(1);
});
