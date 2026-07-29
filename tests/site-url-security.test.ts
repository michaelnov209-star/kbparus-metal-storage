import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FALLBACK_SITE_URL,
  getSiteUrl,
  getTrustedSiteOrigins,
  normalizeProjectSiteOrigin
} from "@/lib/seo/site";

describe("canonical site URL", () => {
  it("normalizes a trusted hostname to its HTTPS origin", () => {
    expect(getSiteUrl("kbparus-metal-storage.vercel.app/")).toBe(
      FALLBACK_SITE_URL
    );
    expect(getSiteUrl("https://example.com/catalog?q=1#section")).toBe(
      "https://example.com"
    );
  });

  it("allows HTTP only for a local development origin", () => {
    expect(getSiteUrl("http://localhost:3100/admin")).toBe(
      "http://localhost:3100"
    );
    expect(getSiteUrl("http://example.com")).toBe(FALLBACK_SITE_URL);
  });

  it("rejects credentials and malformed or non-web URLs", () => {
    expect(getSiteUrl("https://user:password@example.com")).toBe(
      FALLBACK_SITE_URL
    );
    expect(getSiteUrl("file:///etc/passwd")).toBe(FALLBACK_SITE_URL);
    expect(getSiteUrl("//malformed host")).toBe(FALLBACK_SITE_URL);
    expect(getSiteUrl("//evil.example")).toBe(FALLBACK_SITE_URL);
  });

  it("never treats related КБ Парус sites as this project's canonical origin", () => {
    expect(getSiteUrl("https://kbparus.ru/catalog")).toBe(FALLBACK_SITE_URL);
    expect(getSiteUrl("https://www.kbparus.ru/")).toBe(FALLBACK_SITE_URL);
    expect(getSiteUrl("https://линииокраски.рф/")).toBe(FALLBACK_SITE_URL);
    expect(normalizeProjectSiteOrigin("https://kbparus.ru")).toBeUndefined();
  });

  it("builds an exact CSRF origin allowlist for production and previews", () => {
    expect(
      getTrustedSiteOrigins({
        NODE_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://example.com/catalog",
        VERCEL_URL: "kbparus-preview.vercel.app"
      })
    ).toEqual([
      FALLBACK_SITE_URL,
      "https://example.com",
      "https://kbparus-preview.vercel.app"
    ]);
  });

  it("drops another brand site's origin from the shared allowlist", () => {
    expect(
      getTrustedSiteOrigins({
        NODE_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://kbparus.ru",
        VERCEL_URL: "kbparus-preview.vercel.app"
      })
    ).toEqual([
      FALLBACK_SITE_URL,
      "https://kbparus-preview.vercel.app"
    ]);
  });

  it("adds local origins only outside production", () => {
    const origins = getTrustedSiteOrigins({ NODE_ENV: "development" });
    expect(origins).toContain("http://localhost:3000");
    expect(origins).toContain("http://localhost:3100");
  });

  it("wires the normalized origin and CSRF allowlist into Payload", () => {
    const config = readFileSync(resolve(process.cwd(), "payload.config.ts"), "utf8");

    expect(config).toContain("serverURL: payloadServerURL");
    expect(config).toContain("csrf: payloadCsrfOrigins");
    expect(config).toContain("getTrustedSiteOrigins(process.env)");
  });
});
