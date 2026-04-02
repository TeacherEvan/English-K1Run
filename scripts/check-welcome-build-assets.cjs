const fs = require("node:fs");
const path = require("node:path");

const swPath = path.join(process.cwd(), "dist", "sw.js");

if (!fs.existsSync(swPath)) {
  console.error("Missing dist/sw.js");
  process.exit(1);
}

const sw = fs.readFileSync(swPath, "utf8");

const required = [
  "welcome-sangsom.png",
  "New_welcome_video.mp4",
  "sounds/welcome.wav",
];

const missing = required.filter((item) => !sw.includes(item));

if (missing.length > 0) {
  console.error("Missing welcome assets in generated service worker:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Welcome build assets verified.");
