import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("deployment automation security", () => {
  it("never exposes the Vercel bypass secret to deployment code", () => {
    const workflow = read(".github/workflows/post-deploy-smoke.yml");

    expect(workflow).not.toContain("secrets.VERCEL_AUTOMATION_BYPASS_SECRET");
    expect(workflow).not.toMatch(
      /^\s*VERCEL_AUTOMATION_BYPASS_SECRET\s*:/m
    );
  });

  it("refuses to forward a bypass secret outside this project's deployment hosts", () => {
    const validator = read("scripts/cms/validate-deployment.mjs");

    expect(validator).toContain(
      'baseHostname === "kbparus-metal-storage.vercel.app"'
    );
    expect(validator).toContain(
      'baseHostname.startsWith("kbparus-metal-storage-")'
    );
    expect(validator).toContain(
      "Refusing to send the Vercel protection bypass secret"
    );
  });

  it("uses a short shared cache for the public health probe", () => {
    const healthRoute = read("app/api/health/route.ts");

    expect(healthRoute).toContain('dynamic = "force-static"');
    expect(healthRoute).toContain("revalidate = 30");
    expect(healthRoute).toContain("s-maxage=30");
  });
});
