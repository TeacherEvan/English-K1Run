const fs = require("node:fs");
const path = require("node:path");

const distPath = path.join(process.cwd(), "dist");
const swPath = path.join(distPath, "sw.js");

if (!fs.existsSync(swPath)) {
  console.error("Missing dist/sw.js");
  process.exit(1);
}

const requiredExactFiles = ["welcome-sangsom.png"];
const missingFiles = requiredExactFiles.filter((item) => {
  const filePath = path.join(distPath, item);
  return !fs.existsSync(filePath);
});

const soundsPath = path.join(distPath, "sounds");
const welcomeSoundFiles = fs.existsSync(soundsPath)
  ? fs
      .readdirSync(soundsPath)
      .filter((name) => /^welcome.*\.(wav|mp3)$/i.test(name))
  : [];

if (missingFiles.length > 0 || welcomeSoundFiles.length === 0) {
  console.error("Missing welcome asset files in dist/:");
  for (const item of missingFiles) console.error(`- ${item}`);
  if (welcomeSoundFiles.length === 0) {
    console.error("- sounds/welcome*.{wav,mp3}");
  }
  process.exit(1);
}

const sw = fs.readFileSync(swPath, "utf8");

const requiredReferencePatterns = [
  {
    label: "welcome-sangsom.png",
    pattern: /welcome-sangsom\.png/,
  },
  {
    label: "New_welcome_video",
    pattern: /New_welcome_video(?:\\\.mp4|\.mp4)?/,
  },
  {
    label: "sounds/welcome",
    pattern: /sounds(?:\\\/|\/)welcome/,
  },
];

const missing = requiredReferencePatterns
  .filter(({ pattern }) => !pattern.test(sw))
  .map(({ label }) => label);

if (missing.length > 0) {
  console.error("Missing welcome asset references in generated service worker:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Welcome build assets verified.");
