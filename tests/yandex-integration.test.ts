import { describe, expect, it, vi } from "vitest";
import {
  dispatchYandexPageView,
  shouldRenderYandexMetrika,
  YANDEX_METRIKA_INIT_OPTIONS
} from "@/lib/analytics/metrika-runtime";
import { buildSearchVerificationMetadata } from "@/lib/seo/verification";

describe("Yandex Metrika runtime contract", () => {
  it("does not render the analytics tag without explicit consent and a valid counter", () => {
    expect(shouldRenderYandexMetrika(87135083, false)).toBe(false);
    expect(shouldRenderYandexMetrika(0, true)).toBe(false);
    expect(shouldRenderYandexMetrika(Number.NaN, true)).toBe(false);
    expect(shouldRenderYandexMetrika(87135083, true)).toBe(true);
  });

  it("uses the consent-gated SPA contract with Webvisor and ecommerce", () => {
    expect(YANDEX_METRIKA_INIT_OPTIONS).toMatchObject({
      defer: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
      ecommerce: "dataLayer"
    });
  });

  it("sends an explicit SPA page hit only while analytics consent is active", () => {
    const ym = vi.fn();
    const input = {
      counterId: 87135083,
      url: "https://example.test/catalog?source=menu",
      title: "Каталог",
      referer: "https://example.test/",
      ym
    };

    expect(dispatchYandexPageView({ ...input, consent: false })).toBe(false);
    expect(ym).not.toHaveBeenCalled();

    expect(dispatchYandexPageView({ ...input, consent: true })).toBe(true);
    expect(ym).toHaveBeenCalledOnce();
    expect(ym).toHaveBeenCalledWith(
      87135083,
      "hit",
      "https://example.test/catalog?source=menu",
      {
        title: "Каталог",
        referer: "https://example.test/"
      }
    );
  });
});

describe("Yandex Webmaster verification metadata", () => {
  it("emits only trimmed, configured verification tokens", () => {
    expect(
      buildSearchVerificationMetadata({
        GOOGLE_SITE_VERIFICATION: "  ",
        YANDEX_SITE_VERIFICATION: " yandex-token "
      })
    ).toEqual({ yandex: "yandex-token" });

    expect(buildSearchVerificationMetadata({})).toEqual({});
  });
});
