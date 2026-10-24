/**
 * Deploy configuration guard.
 *
 * `.vercelignore` is applied ONLY inside Vercel's build sandbox, so anything it
 * removes is invisible to `npm run build` on a developer machine. A blanket
 * `scripts/` rule therefore deleted `scripts/validate-audio-files.cjs`, which
 * the build command itself executes first — every production build failed
 * with MODULE_NOT_FOUND while local builds stayed green.
 *
 * These tests make that class of bug impossible to reintroduce silently.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const packageJson = JSON.parse(
  readFileSync(join(ROOT, "package.json"), "utf8"),
) as { scripts?: Record<string, string> };

const ignoreLines = readFileSync(join(ROOT, ".vercelignore"), "utf8")
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith("#"));

/** Every `node scripts/...` path reachable from `npm run build`. */
const collectBuildScriptPaths = (): string[] => {
  const found = new Set<string>();
  const visited = new Set<string>();

  const walk = (scriptName: string) => {
    if (visited.has(scriptName)) return;
    visited.add(scriptName);

    const command = packageJson.scripts?.[scriptName];
    if (!command) return;

    for (const match of command.matchAll(/(?:^|[\s&|;])node\s+(scripts\/[\w.-]+)/g)) {
      found.add(match[1]);
    }
    for (const match of command.matchAll(/npm run ([\w:-]+)/g)) {
      walk(match[1]);
    }
  };

  walk("build");
  return [...found].sort();
};

/**
 * Whether Vercel's sandbox would remove `path`.
 *
 * Mirrors the one gitignore subtlety that caused this outage: excluding a
 * DIRECTORY (`scripts/`) removes it wholesale, and a later `!file` negation
 * cannot re-include a path whose parent was removed.
 */
const removedByVercelignore = (path: string): boolean => {
  let ignored = false;

  for (const line of ignoreLines) {
    if (line === "scripts/" && path.startsWith("scripts/")) {
      return true;
    }
    if (line === "scripts/*" && /^scripts\/[^/]+$/.test(path)) {
      ignored = true;
      continue;
    }
    if (line === `!${path}`) {
      ignored = false;
    }
  }

  return ignored;
};

describe("Vercel deploy configuration", () => {
  it("runs at least one build script from scripts/ (guard is meaningful)", () => {
    expect(collectBuildScriptPaths().length).toBeGreaterThan(0);
  });

  it("keeps every script the build command executes out of .vercelignore", () => {
    const missing = collectBuildScriptPaths().filter(removedByVercelignore);

    expect(
      missing,
      `These files are required by 'npm run build' but .vercelignore removes them ` +
        `in Vercel's sandbox: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("does not blanket-ignore the scripts directory", () => {
    expect(ignoreLines).not.toContain("scripts/");
  });

  it("has a build script path that actually exists in the repo", () => {
    for (const path of collectBuildScriptPaths()) {
      expect(existsSync(join(ROOT, path)), `${path} is missing`).toBe(true);
    }
  });
});
