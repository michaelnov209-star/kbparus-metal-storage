import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  SOCIAL_PREVIEW_PATH,
  SOCIAL_PREVIEW_SIZE
} from "@/lib/seo/social-preview";

const projectRoot = process.cwd();
const previewPath = path.join(
  projectRoot,
  "public",
  "brand",
  "social-preview.jpg"
);

describe("social preview", () => {
  it("uses a versioned public image instead of the old placeholder", () => {
    expect(SOCIAL_PREVIEW_PATH).toMatch(
      /^\/brand\/social-preview\.jpg\?v=\d+$/
    );
    expect(existsSync(previewPath)).toBe(true);

    const generator = readFileSync(
      path.join(projectRoot, "scripts/media/build-social-preview.mjs"),
      "utf8"
    );
    expect(generator).not.toContain("ЗДЕСЬ БУДЕТ ИЗОБРАЖЕНИЕ");
    expect(generator).toContain("metal-storage-hero-poster");
    expect(generator).toContain(
      '<rect x="54" y="500" width="700" height="62"'
    );
    expect(generator).toContain("ИНЖЕНЕРНЫЙ ПОДБОР");

    const legacyRoute = readFileSync(
      path.join(projectRoot, "app", "(site)", "opengraph-image", "route.ts"),
      "utf8"
    );
    expect(legacyRoute).toContain("Location: SOCIAL_PREVIEW_PATH");
    expect(legacyRoute).not.toContain("request.url");
  });

  it("renders the Telegram card at the expected dimensions", async () => {
    const metadata = await sharp(previewPath).metadata();

    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBe(SOCIAL_PREVIEW_SIZE.width);
    expect(metadata.height).toBe(SOCIAL_PREVIEW_SIZE.height);
    expect(statSync(previewPath).size).toBeGreaterThan(80_000);
    expect(statSync(previewPath).size).toBeLessThan(500_000);
  });
});
