import { describe, expect, it } from "vitest";
import { getPayloadSecret } from "@/lib/config/payload-secret";

describe("Payload secret configuration", () => {
  it("rejects a missing or weak secret in Vercel production", () => {
    expect(() =>
      getPayloadSecret({
        VERCEL: "1",
        VERCEL_ENV: "production"
      })
    ).toThrow(/PAYLOAD_SECRET/);

    expect(() =>
      getPayloadSecret({
        VERCEL: "1",
        VERCEL_ENV: "production",
        PAYLOAD_SECRET: "too-short"
      })
    ).toThrow(/at least 32 characters/);
  });

  it("uses the configured production secret without exposing a fallback", () => {
    const secret = "a-secure-production-secret-with-32-plus-characters";

    expect(
      getPayloadSecret({
        VERCEL: "1",
        VERCEL_ENV: "production",
        PAYLOAD_SECRET: `  ${secret}  `
      })
    ).toBe(secret);
  });

  it("rejects the development fallback on non-Vercel production runtimes with a database", () => {
    expect(() =>
      getPayloadSecret({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://database.example.invalid/app"
      })
    ).toThrow(/PAYLOAD_SECRET/);

    expect(() =>
      getPayloadSecret({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://database.example.invalid/app",
        PAYLOAD_SECRET: "weak"
      })
    ).toThrow(/at least 32 characters/);
  });

  it("keeps local, preview and CI production builds operational", () => {
    expect(getPayloadSecret({ NODE_ENV: "development" })).toContain(
      "local-development-only"
    );
    expect(getPayloadSecret({ NODE_ENV: "production", CI: "true" })).toContain(
      "local-development-only"
    );
    expect(
      getPayloadSecret({
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_ENV: "preview"
      })
    ).toContain("local-development-only");
  });
});
