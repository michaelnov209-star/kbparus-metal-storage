import { describe, expect, it } from "vitest";

import {
  formatGoogleSearchConsoleProperty,
  formatYandexWebmasterHostId,
  getTrackedSeoProperty
} from "@/lib/seo-reporting/property";

describe("SEO tracked property", () => {
  it("makes a Google domain property readable without changing its API value", () => {
    expect(formatGoogleSearchConsoleProperty("sc-domain:storage.example")).toBe(
      "storage.example (весь домен)"
    );
    expect(
      formatGoogleSearchConsoleProperty("https://storage.example/")
    ).toBe("https://storage.example/");
  });

  it("turns a Yandex host id into a readable URL", () => {
    expect(
      formatYandexWebmasterHostId(
        "https:kbparus-metal-storage.vercel.app:443"
      )
    ).toBe("https://kbparus-metal-storage.vercel.app");
    expect(formatYandexWebmasterHostId("http:kbparus.ru:80")).toBe(
      "http://kbparus.ru"
    );
  });

  it("keeps a non-default port visible", () => {
    expect(formatYandexWebmasterHostId("https:example.com:8443")).toBe(
      "https://example.com:8443"
    );
  });

  it("returns the configured provider property without exposing credentials", () => {
    expect(
      getTrackedSeoProperty(
        {
          google: {
            configured: true,
            clientEmail: "service@example.com",
            privateKey: "secret",
            siteUrl: "https://example.com"
          },
          yandex: {
            configured: true,
            oauthToken: "secret",
            userId: "123",
            hostId: "https:kbparus-metal-storage.vercel.app:443",
            regionIds: []
          }
        },
        "yandex"
      )
    ).toBe("https://kbparus-metal-storage.vercel.app");
  });
});
