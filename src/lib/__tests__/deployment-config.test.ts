import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readWorkspaceFile = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("deployment configuration", () => {
  it("uses deterministic Vercel project settings", () => {
    const vercelConfig = JSON.parse(readWorkspaceFile("vercel.json")) as {
      framework?: string;
      outputDirectory?: string;
      installCommand?: string;
      buildCommand?: string;
    };

    expect(vercelConfig.framework).toBe("vite");
    expect(vercelConfig.outputDirectory).toBe("dist");
    expect(vercelConfig.installCommand).toBe("npm ci");
    expect(vercelConfig.buildCommand).toBe("npm run build");
  });

  it("deploys the verified prebuilt artifact via the official Vercel CLI", () => {
    const workflow = readWorkspaceFile(".github/workflows/ci.yml");

    expect(workflow).toContain("npm run vercel:build");
    expect(workflow).toContain("npm run vercel:deploy -- --prod");
    expect(workflow).toContain("VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}");
    expect(workflow).toContain("VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}");
    expect(workflow).not.toContain("amondnet/vercel-action");
  });

  it("pins a Vercel-compatible Node engine and exposes deploy scripts", () => {
    const packageJson = JSON.parse(readWorkspaceFile("package.json")) as {
      engines?: { node?: string };
      scripts?: Record<string, string>;
    };

    expect(packageJson.engines?.node).toBe(">=20.19.0 <21 || >=22.12.0 <23");
    expect(packageJson.scripts?.["vercel:build"]).toBe("npx vercel build");
    expect(packageJson.scripts?.["vercel:deploy"]).toBe("npx vercel deploy --prebuilt");
  });
});