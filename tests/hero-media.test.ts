import { statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_HERO_VIDEO } from "@/lib/media/hero";

function publicFile(url: string) {
  return resolve(process.cwd(), "public", url.replace(/^\/+/, ""));
}

describe("hero media", () => {
  it("keeps video as the default hero on every viewport", () => {
    expect(DEFAULT_HERO_VIDEO.desktopUrl).toBe("/assets/videos/metal-storage-hero-trimmed.mp4");
    expect(DEFAULT_HERO_VIDEO.mobileUrl).toMatch(
      /^\/assets\/videos\/optimized\/metal-storage-hero-mobile-[a-f0-9]{12}\.mp4$/
    );
    expect(DEFAULT_HERO_VIDEO.posterUrl).toMatch(
      /^\/assets\/images\/home\/optimized\/metal-storage-hero-poster-[a-f0-9]{12}\.webp$/
    );
  });

  it("ships a mobile rendition below 3 MB and smaller than the desktop source", () => {
    const desktopBytes = statSync(publicFile(DEFAULT_HERO_VIDEO.desktopUrl)).size;
    const mobileBytes = statSync(publicFile(DEFAULT_HERO_VIDEO.mobileUrl)).size;
    const posterBytes = statSync(publicFile(DEFAULT_HERO_VIDEO.posterUrl)).size;

    expect(mobileBytes).toBeLessThan(3_000_000);
    expect(mobileBytes).toBeLessThan(desktopBytes * 0.3);
    expect(posterBytes).toBeLessThan(200_000);
  });
});
