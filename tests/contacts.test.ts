import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cms/client", () => ({
  getCmsClient: vi.fn()
}));

import { DEFAULT_CONTACTS, mapContactSocials } from "@/lib/cms/contacts";

describe("site contact links", () => {
  it("does not disguise email and phone fallbacks as messengers", () => {
    expect(DEFAULT_CONTACTS.socials).toEqual({});
  });

  it("maps only configured messenger links without inventing a social profile", () => {
    expect(mapContactSocials(null)).toEqual({});

    expect(
      mapContactSocials([
        { platform: "telegram", url: "https://t.me/kbparus" },
        { platform: "whatsapp", url: "https://wa.me/74994033962" },
        { platform: "unknown", url: "https://example.com/" },
        { platform: "max", url: null }
      ])
    ).toEqual({
      telegram: "https://t.me/kbparus",
      whatsapp: "https://wa.me/74994033962"
    });
  });

  it("rejects unsafe, malformed and non-web URLs from editable CMS content", () => {
    expect(
      mapContactSocials([
        { platform: "telegram", url: "javascript:alert(1)" },
        { platform: "whatsapp", url: "tel:+74994033962" },
        { platform: "max", url: "not a url" },
        { platform: "vk", url: "http://vk.com/kbparus" }
      ])
    ).toEqual({});
  });
});
