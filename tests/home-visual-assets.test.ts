import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cms/client", () => ({
  getCmsClient: vi.fn(async () => null)
}));
import { visualAssets } from "@/data/storageSystems/visualAssets";
import {
  DEFAULT_HOME_CONTENT,
  normalizeHomeContent
} from "@/lib/cms/home-content";

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

  it("keeps managed material images attached to their title after reordering", () => {
    const [sheet, tubes] = DEFAULT_HOME_CONTENT.storedMaterials;
    const normalized = normalizeHomeContent({
      storedMaterials: [
        {
          title: tubes.title,
          description: tubes.text,
          image: {
            internalTitle: "Legacy asset: /old/tubes.webp",
            url: "/api/media/file/old-tubes.webp"
          }
        },
        {
          title: sheet.title,
          description: sheet.text,
          image: {
            internalTitle: "Legacy asset: /old/sheet.webp",
            url: "/api/media/file/old-sheet.webp"
          }
        }
      ]
    });

    expect(normalized.storedMaterials.map((item) => item.imageUrl)).toEqual([
      tubes.imageUrl,
      sheet.imageUrl
    ]);
  });
});
