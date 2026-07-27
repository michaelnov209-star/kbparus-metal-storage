import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { visualAssets } from "@/data/storageSystems/visualAssets";

describe("owned home visual assets", () => {
  it("does not depend on external stock-photo hosts", () => {
    for (const url of Object.values(visualAssets)) {
      expect(url).toMatch(/^\/assets\/images\//);
      expect(url).not.toMatch(/pexels|unsplash|https?:\/\//i);
    }
  });

  it("ships every referenced file with a bounded payload", () => {
    const uniqueUrls = new Set(Object.values(visualAssets));

    for (const url of uniqueUrls) {
      const file = resolve("public", url.replace(/^\//, ""));
      expect(existsSync(file), `${url} must exist`).toBe(true);
      expect(statSync(file).size, `${url} must remain under 250 KB`).toBeLessThan(
        250_000
      );
    }
  });
});
