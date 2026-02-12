const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DEFAULTS = {
  limit: 200,
  json: "reports/loc-report.json",
  md: "reports/loc-report.md",
  allowlist: "loc-audit.allowlist.json",
  roots: ["src", "e2e", "scripts", "test-server"],
};

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

const SRC_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function toPosix(p) {
  return p.replace(/\\/g, "/");
}

function parseArgs(argv) {
  const args = { ...DEFAULTS };
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
    throw new Error("Bad --limit");
  return args;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(path.resolve(ROOT, filePath)), { recursive: true });
}

function loadAllowlist(relPath) {
  if (!relPath) return new Set();
  const abs = path.resolve(ROOT, relPath);
  if (!fs.existsSync(abs)) return new Set();
  const data = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (!Array.isArray(data)) throw new Error("Allowlist must be a JSON array");
  return new Set(data.map((p) => String(p)));
}

function countCodeLoc(text) {
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

function isMinified(filePath) {
  const b = path.basename(filePath).toLowerCase();
  return b.includes(".min.") || b.endsWith(".min.js") || b.endsWith(".min.css");
}

async function walkDir(absDir, relDir, out) {
  const dir = await fs.promises.opendir(absDir);
  for await (const ent of dir) {
    const abs = path.join(absDir, ent.name);
    const rel = path.join(relDir, ent.name);
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) await walkDir(abs, rel, out);
      continue;
    }
    const ext = path.extname(ent.name).toLowerCase();
    if (!SRC_EXTS.has(ext) || isMinified(abs)) continue;
    out.push(rel);
  }
}

async function listTargetFiles(roots) {
  const out = [];
  for (const root of roots) {
    const abs = path.join(ROOT, root);
    if (fs.existsSync(abs)) await walkDir(abs, root, out);
  }
  return out;
}

function toMarkdown(limit, results) {
  const violators = results.filter((r) => r.loc > limit);
  const lines = violators
    .slice()
    .sort((a, b) => b.loc - a.loc)
    .map((v) => `- ${v.loc} LOC \`${v.path}\` (${v.domain})`)
    .join("\n");
  return [
    "# LOC Audit Report",
    "",
    `Limit: **${limit} LOC** (non-empty, non-comment lines)`,
    "",
    `Scanned files: **${results.length}**`,
    `Violators: **${violators.length}**`,
    "",
    "## Violators",
    "",
    lines || "_No violators_",
    "",
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv);
  const allowlist = loadAllowlist(args.allowlist);
  const files = await listTargetFiles(args.roots);

  const results = [];
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    const text = await fs.promises.readFile(abs, "utf8");
    const relPosix = toPosix(rel);
    const { loc, totalLines } = countCodeLoc(text);
    results.push({
      path: relPosix,
      loc,
      totalLines,
      domain: "Other",
    });
  }
  results.sort((a, b) => b.loc - a.loc);

  const violators = results.filter((r) => r.loc > args.limit);
  const failing = violators.filter((v) => !allowlist.has(v.path));

  ensureDir(args.json);
  ensureDir(args.md);
  await fs.promises.writeFile(
    path.resolve(ROOT, args.json),
    JSON.stringify(
      {
        limit: args.limit,
        scanned: results.length,
        violators: violators.length,
        allowlisted: violators.length - failing.length,
        failingViolators: failing.length,
        allowlistPath: args.allowlist,
        results,
      },
      null,
      2,
    ),
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
