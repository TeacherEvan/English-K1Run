const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function parseArgs(argv) {
  const args = {
    limit: 200,
    json: "reports/loc-report.json",
    md: "reports/loc-report.md",
    allowlist: "loc-audit.allowlist.json",
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--limit") args.limit = Number(argv[++i]);
    else if (a === "--json") args.json = argv[++i];
    else if (a === "--md") args.md = argv[++i];
    else if (a === "--allowlist") args.allowlist = argv[++i];
    else if (a === "--no-allowlist") args.allowlist = null;
    else if (a === "--report-only") args.reportOnly = true;
  }
  if (!Number.isFinite(args.limit) || args.limit <= 0)
    throw new Error("Invalid --limit");
  return args;
}

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  "playwright-report",
  "test-results",
  "allure-results",
]);

const ALLOWED_ROOTS = ["src", "e2e", "scripts", "test-server"];
const SRC_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const SKIP_EXTS = new Set([
  ".md",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".mp3",
  ".wav",
  ".ogg",
  ".mp4",
  ".pdf",
]);

function isMinified(filePath) {
  const base = path.basename(filePath).toLowerCase();
  return (
    base.includes(".min.") ||
    base.endsWith(".min.js") ||
    base.endsWith(".min.css")
  );
}

function domainFor(rel) {
  const p = rel.replaceAll("\\", "/");
  if (p.startsWith("src/hooks/")) return "Core Logic";
  if (p.includes("touch-handler") || p.startsWith("src/input/")) return "Input";
  if (p.startsWith("src/lib/audio/") || p.includes("sound-manager"))
    return "Audio";
  if (p.startsWith("src/components/ui/")) return "UI Primitives";
  if (p.startsWith("src/components/")) return "Rendering/UI";
  if (p.startsWith("src/lib/constants/")) return "Content/Config";
  if (p.startsWith("e2e/")) return "Testing";
  if (p.startsWith("scripts/")) return "Tooling";
  return "Other";
}

function countLoc(text) {
  const lines = text.split(/\r?\n/);
  let loc = 0;
  let inBlock = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (inBlock) {
      if (line.includes("*/")) inBlock = false;
      continue;
    }
    if (line.startsWith("//")) continue;
    if (line.startsWith("/*")) {
      if (!line.includes("*/")) inBlock = true;
      continue;
    }
    if (line.startsWith("*") || line === "*/") continue;
    loc += 1;
  }
  return { loc, totalLines: lines.length };
}

async function walkDir(absDir, relDir, out) {
  const dir = await fs.promises.opendir(absDir);
  for await (const ent of dir) {
    const abs = path.join(absDir, ent.name);
    const rel = path.join(relDir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      await walkDir(abs, rel, out);
      continue;
    }
    const ext = path.extname(ent.name).toLowerCase();
    if (SKIP_EXTS.has(ext)) continue;
    if (!SRC_EXTS.has(ext)) continue;
    if (isMinified(abs)) continue;
    out.push(rel);
  }
}

async function listTargetFiles() {
  const out = [];
  for (const root of ALLOWED_ROOTS) {
    const abs = path.join(ROOT, root);
    if (!fs.existsSync(abs)) continue;
    await walkDir(abs, root, out);
  }
  return out;
}

function ensureDir(filePath) {
  const dir = path.dirname(path.resolve(ROOT, filePath));
  fs.mkdirSync(dir, { recursive: true });
}

function loadAllowlist(relPath) {
  if (!relPath) return new Set();
  const abs = path.resolve(ROOT, relPath);
  if (!fs.existsSync(abs)) return new Set();
  const raw = fs.readFileSync(abs, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data))
    throw new Error("Allowlist must be a JSON array of file paths");
  return new Set(data.map((p) => String(p)));
}

function toMarkdown(limit, results) {
  const violators = results.filter((r) => r.loc > limit);
  const byDomain = new Map();
  for (const v of violators)
    byDomain.set(v.domain, (byDomain.get(v.domain) ?? 0) + 1);
  const domainLines = [...byDomain.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([d, n]) => `- **${d}**: ${n}`)
    .join("\n");

  const top = violators
    .slice()
    .sort((a, b) => b.loc - a.loc)
    .slice(0, 50)
    .map(
      (v) => `- ${v.loc} LOC \`${v.path.replaceAll("\\", "/")}\` (${v.domain})`,
    )
    .join("\n");

  return [
    "# LOC Audit Report",
    "",
    `Limit: **${limit} LOC** (non-empty, non-comment lines)`,
    "",
    `Scanned files: **${results.length}**`,
    `Violators: **${violators.length}**`,
    "",
    "## Violators by domain",
    "",
    domainLines || "_No violators_",
    "",
    "## Top violators",
    "",
    top || "_No violators_",
    "",
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv);
  const allowlist = loadAllowlist(args.allowlist);
  const files = await listTargetFiles();
  const results = [];
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    const text = await fs.promises.readFile(abs, "utf8");
    const { loc, totalLines } = countLoc(text);
    results.push({ path: rel, loc, totalLines, domain: domainFor(rel) });
  }
  results.sort((a, b) => b.loc - a.loc);
  const violators = results.filter((r) => r.loc > args.limit);
  const failing = violators.filter(
    (v) => !allowlist.has(v.path.replaceAll("\\", "/")),
  );
  const payload = {
    limit: args.limit,
    scanned: results.length,
    violators: violators.length,
    allowlisted: violators.length - failing.length,
    failingViolators: failing.length,
    allowlistPath: args.allowlist,
    results,
  };
  ensureDir(args.json);
  ensureDir(args.md);
  await fs.promises.writeFile(
    path.resolve(ROOT, args.json),
    JSON.stringify(payload, null, 2),
  );
  await fs.promises.writeFile(
    path.resolve(ROOT, args.md),
    toMarkdown(args.limit, results),
  );

  if (failing.length) {
    console.error(
      `LOC audit failed: ${failing.length} file(s) exceed ${args.limit} LOC (not allowlisted).`,
    );
    console.error(`See: ${args.md}`);
    if (!args.reportOnly) process.exitCode = 1;
  } else {
    const note = violators.length
      ? ` (${violators.length} allowlisted violator(s))`
      : "";
    console.log(
      `LOC audit passed: ${results.length} file(s) scanned, 0 failing violators${note}.`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 2;
});
