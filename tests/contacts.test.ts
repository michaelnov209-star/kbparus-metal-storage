import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cms/client", () => ({
  getCmsClient: vi.fn()
}));

import { DEFAULT_CONTACTS, mapContactSocials } from "@/lib/cms/contacts";

describe("site contact links", () => {
  it("does not disguise email and phone fallbacks as messengers", () => {
    expect(DEFAULT_CONTACTS.socials).toEqual({
      vk: "https://www.kbparus.ru/"
    });
  });

  it("maps only configured messenger links and keeps the verified VK fallback", () => {
    expect(mapContactSocials(null)).toEqual({
      vk: "https://www.kbparus.ru/"
    });

    expect(
      mapContactSocials([
        { platform: "telegram", url: "https://t.me/kbparus" },
        { platform: "whatsapp", url: "https://wa.me/74994033962" },
        { platform: "unknown", url: "https://example.com/" },
        { platform: "max", url: null }
      ])
    ).toEqual({
      telegram: "https://t.me/kbparus",
      whatsapp: "https://wa.me/74994033962",
      vk: "https://www.kbparus.ru/"
    });
  });
});
