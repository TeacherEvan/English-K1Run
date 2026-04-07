const fs = require("node:fs");
const path = require("node:path");

const swPath = path.join(process.cwd(), "dist", "sw.js");

if (!fs.existsSync(swPath)) {
  console.error("Missing dist/sw.js");
  process.exit(1);
}

// Verify required welcome asset files exist in dist/
const requiredFiles = [
  "welcome-sangsom.png",
  path.join("sounds", "welcome.wav"),
];

const missingFiles = requiredFiles.filter((item) => {
  const filePath = path.join(process.cwd(), "dist", item);
  return !fs.existsSync(filePath);
});

if (missingFiles.length > 0) {
  console.error("Missing welcome asset files in dist/:");
  for (const item of missingFiles) console.error(`- ${item}`);
  process.exit(1);
}

// Verify welcome media strings appear in the generated service worker
// (covers both precache manifest entries and runtime caching patterns)
const sw = fs.readFileSync(swPath, "utf8");

const required = [
  "welcome-sangsom.png",
  "New_welcome_video",
  "sounds/welcome",
];

const missing = required.filter((item) => !sw.includes(item));

if (missing.length > 0) {
  console.error("Missing welcome asset references in generated service worker:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Welcome build assets verified.");
