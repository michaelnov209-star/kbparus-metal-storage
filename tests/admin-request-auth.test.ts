import { describe, expect, it } from "vitest";

import { isTrustedAdminMutationRequest } from "@/lib/admin/mutation-origin";

const productionEnv = { NODE_ENV: "production" } as NodeJS.ProcessEnv;

describe("custom admin mutation origin checks", () => {
  it("accepts same-origin browser mutations", () => {
    const request = new Request("https://example.com/api/admin/test", {
      method: "POST",
      headers: { origin: "https://example.com" }
    });

    expect(isTrustedAdminMutationRequest(request, productionEnv)).toBe(true);
  });

  it("rejects cross-origin and missing browser metadata in production", () => {
    const crossOrigin = new Request("https://example.com/api/admin/test", {
      method: "POST",
      headers: { origin: "https://attacker.example" }
    });
    const missingOrigin = new Request("https://example.com/api/admin/test", {
      method: "POST"
    });

    expect(isTrustedAdminMutationRequest(crossOrigin, productionEnv)).toBe(false);
    expect(isTrustedAdminMutationRequest(missingOrigin, productionEnv)).toBe(false);
  });

  it("accepts safe methods and same-origin Fetch Metadata", () => {
    const read = new Request("https://example.com/api/admin/test");
    const sameOrigin = new Request("https://example.com/api/admin/test", {
      method: "POST",
      headers: { "sec-fetch-site": "same-origin" }
    });

    expect(isTrustedAdminMutationRequest(read, productionEnv)).toBe(true);
    expect(isTrustedAdminMutationRequest(sameOrigin, productionEnv)).toBe(true);
  });
});
