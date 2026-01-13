#!/usr/bin/env node

/**
 * Generate Requirements File for Node.js Project
 *
 * Creates a requirements.txt-style file listing all dependencies
 * Similar to Python's `pip freeze > requirements.txt`
 *
 * USAGE:
 *   node scripts/generate-requirements.cjs
 *   node scripts/generate-requirements.cjs --output requirements.txt
 *   node scripts/generate-requirements.cjs --format json
 */

const fs = require("fs");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);
const outputFile = args.includes("--output")
  ? args[args.indexOf("--output") + 1]
  : "REQUIREMENTS.txt";
const format = args.includes("--format")
  ? args[args.indexOf("--format") + 1]
  : "txt";

// Read package.json
const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

// Read package-lock.json for exact versions
let packageLock;
try {
  const packageLockPath = path.join(__dirname, "..", "package-lock.json");
  packageLock = JSON.parse(fs.readFileSync(packageLockPath, "utf8"));
} catch (error) {
  console.warn(
    "Warning: package-lock.json not found. Using package.json versions."
  );
  packageLock = null;
}

/**
 * Get installed version from package-lock.json
 */
function getInstalledVersion(packageName) {
  if (!packageLock || !packageLock.packages) {
    return (
      packageJson.dependencies?.[packageName] ||
      packageJson.devDependencies?.[packageName] ||
      "unknown"
    );
  }

  const packageKey = `node_modules/${packageName}`;
  if (packageLock.packages[packageKey]) {
    return packageLock.packages[packageKey].version;
  }

  return (
    packageJson.dependencies?.[packageName] ||
    packageJson.devDependencies?.[packageName] ||
    "unknown"
  );
}

/**
 * Generate TXT format output
 */
function generateTxtFormat() {
  const lines = [];

  // Header
  lines.push("# Node.js Project Dependencies");
  lines.push(`# Project: ${packageJson.name} v${packageJson.version}`);
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push("#");
  lines.push("# Install all dependencies:");
  lines.push("#   npm install");
  lines.push("#");
  lines.push("# Install production only:");
  lines.push("#   npm install --production");
  lines.push("");

  // Production Dependencies
  lines.push("# === PRODUCTION DEPENDENCIES ===");
  if (packageJson.dependencies) {
    const deps = Object.entries(packageJson.dependencies).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    for (const [name, version] of deps) {
      const installedVersion = getInstalledVersion(name);
      lines.push(`${name}==${installedVersion.replace(/^\^|~/, "")}`);
    }
  }
  lines.push("");

  // Development Dependencies
  lines.push("# === DEVELOPMENT DEPENDENCIES ===");
  if (packageJson.devDependencies) {
    const devDeps = Object.entries(packageJson.devDependencies).sort(
      ([a], [b]) => a.localeCompare(b)
    );
    for (const [name, version] of devDeps) {
      const installedVersion = getInstalledVersion(name);
      lines.push(`${name}==${installedVersion.replace(/^\^|~/, "")}`);
    }
  }

  return lines.join("\n");
}

/**
 * Generate JSON format output
 */
function generateJsonFormat() {
  const output = {
    name: packageJson.name,
    version: packageJson.version,
    generated: new Date().toISOString(),
    node: process.version,
    dependencies: {},
    devDependencies: {},
  };

  // Production Dependencies
  if (packageJson.dependencies) {
    for (const [name, version] of Object.entries(packageJson.dependencies)) {
      output.dependencies[name] = {
        requested: version,
        installed: getInstalledVersion(name),
      };
    }
  }

  // Development Dependencies
  if (packageJson.devDependencies) {
    for (const [name, version] of Object.entries(packageJson.devDependencies)) {
      output.devDependencies[name] = {
        requested: version,
        installed: getInstalledVersion(name),
      };
    }
  }

  return JSON.stringify(output, null, 2);
}

/**
 * Generate Markdown format output
 */
function generateMarkdownFormat() {
  const lines = [];

  // Header
  lines.push(`# Dependencies for ${packageJson.name}`);
  lines.push("");
  lines.push(`**Version:** ${packageJson.version}  `);
  lines.push(`**Generated:** ${new Date().toISOString()}  `);
  lines.push(`**Node.js:** ${process.version}`);
  lines.push("");

  // Production Dependencies
  lines.push("## Production Dependencies");
  lines.push("");
  lines.push("| Package | Requested | Installed |");
  lines.push("|---------|-----------|-----------|");
  if (packageJson.dependencies) {
    const deps = Object.entries(packageJson.dependencies).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    for (const [name, version] of deps) {
      const installedVersion = getInstalledVersion(name);
      lines.push(`| ${name} | ${version} | ${installedVersion} |`);
    }
  }
  lines.push("");

  // Development Dependencies
  lines.push("## Development Dependencies");
  lines.push("");
  lines.push("| Package | Requested | Installed |");
  lines.push("|---------|-----------|-----------|");
  if (packageJson.devDependencies) {
    const devDeps = Object.entries(packageJson.devDependencies).sort(
      ([a], [b]) => a.localeCompare(b)
    );
    for (const [name, version] of devDeps) {
      const installedVersion = getInstalledVersion(name);
      lines.push(`| ${name} | ${version} | ${installedVersion} |`);
    }
  }
  lines.push("");

  // Installation Instructions
  lines.push("## Installation");
  lines.push("");
  lines.push("```bash");
  lines.push("# Install all dependencies");
  lines.push("npm install");
  lines.push("");
  lines.push("# Install production dependencies only");
  lines.push("npm install --production");
  lines.push("```");

  return lines.join("\n");
}

// Generate output based on format
let output;
let outputPath;

switch (format.toLowerCase()) {
  case "json":
    output = generateJsonFormat();
    outputPath = outputFile.replace(/\.txt$/, ".json");
    break;
  case "md":
  case "markdown":
    output = generateMarkdownFormat();
    outputPath = outputFile.replace(/\.txt$/, ".md");
    break;
  default:
    output = generateTxtFormat();
    outputPath = outputFile;
}

// Write to file
const fullPath = path.join(__dirname, "..", outputPath);
fs.writeFileSync(fullPath, output, "utf8");

console.log(`✅ Requirements file generated: ${outputPath}`);
console.log(`   Format: ${format}`);
console.log(
  `   Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`
);
console.log(
  `   Dev Dependencies: ${Object.keys(packageJson.devDependencies || {}).length}`
);
console.log("");
console.log("To install dependencies:");
console.log("  npm install");
