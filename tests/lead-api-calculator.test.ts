import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkLeadRateLimit: vi.fn(),
  getCalculatorProfiles: vi.fn(),
  saveLeadToCms: vi.fn(),
  sendLeadEmail: vi.fn()
}));

vi.mock("@/lib/cms/client", () => ({
  getCmsClient: vi.fn(async () => null)
}));

vi.mock("@/lib/cms/calculator-profiles", () => ({
  getCalculatorProfiles: mocks.getCalculatorProfiles
}));

vi.mock("@/lib/leads/rate-limit", () => ({
  checkLeadRateLimit: mocks.checkLeadRateLimit,
  getLeadClientIdentity: vi.fn(() => "test-client"),
  rateLimitHeaders: vi.fn(() => ({}))
}));

vi.mock("@/lib/leads/email", () => ({
  leadEmailConfigFromEnv: vi.fn(() => undefined),
  sendLeadEmail: mocks.sendLeadEmail
}));

vi.mock("@/lib/leads/cms", () => ({
  saveLeadToCms: mocks.saveLeadToCms
}));

import { calculatorProfiles } from "@/data/storageSystems/excelCalculator";
import { calculateStorageSystem, normalizeCalculatorInput } from "@/lib/calculator";
import { createLeadConsent } from "@/lib/leads/contract";
import { POST } from "@/app/api/leads/route";

describe("calculator lead server integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
    vi.stubEnv("TELEGRAM_CHAT_ID", "test-chat");
    vi.stubEnv("BITRIX24_ENABLED", "false");

    mocks.checkLeadRateLimit.mockResolvedValue({
      allowed: true,
      backend: "memory",
      limit: 5,
      remaining: 4,
      resetAt: Date.now() + 60_000,
      retryAfterSeconds: 0
    });
    mocks.getCalculatorProfiles.mockResolvedValue(calculatorProfiles);
    mocks.sendLeadEmail.mockResolvedValue({ ok: true });
    mocks.saveLeadToCms.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("ignores forged client option labels in every server delivery payload", async () => {
    const calculatorInput = normalizeCalculatorInput({
      systemId: "auto-sheet-metal",
      heightMm: 70,
      widthMm: 1600,
      lengthMm: 3100,
      loadKg: 2000,
      shelfCount: 20,
      towerCount: 1,
      optionIds: ["scale", "vacuum-grip"]
    });
    const serverResult = calculateStorageSystem(calculatorInput);
    const forgedLabel = "ПОДМЕНЕНО КЛИЕНТОМ";
    const telegramFetch = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
    );
    vi.stubGlobal("fetch", telegramFetch);

    const response = await POST(
      new Request(
        "https://kbparus-metal-storage.vercel.app/api/leads",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://kbparus-metal-storage.vercel.app"
          },
          body: JSON.stringify({
            leadType: "configurator",
            contact: {
              name: "Тест",
              phone: "+7 999 000-00-01",
              email: ""
            },
            city: "Москва",
            comment: "Проверка серверного контракта",
            calculatorInput,
            recommendedConfig: {
              title: "Клиентское название",
              options: [forgedLabel]
            },
            preliminaryPriceFrom: 1,
            source: "Калькулятор",
            sourceTitle: "Калькулятор",
            sourceUrl:
              "https://kbparus-metal-storage.vercel.app/#calculator",
            hp_url: "",
            formStartedAt: Date.now() - 5_000,
            consent: createLeadConsent()
          })
        }
      )
    );

    expect(response.status).toBe(200);

    const emailLead = mocks.sendLeadEmail.mock.calls[0]?.[0];
    expect(emailLead.selectedOptions).toEqual(serverResult.selectedOptions);
    expect(emailLead.selectedOptions).not.toContain(forgedLabel);
    expect(emailLead.fromPrice).toBe(serverResult.fromPrice);

    const cmsLead = mocks.saveLeadToCms.mock.calls[0]?.[0];
    expect(cmsLead.selectedOptions).toEqual(serverResult.selectedOptions);
    expect(cmsLead.selectedOptions).not.toContain(forgedLabel);

    expect(telegramFetch).toHaveBeenCalledOnce();
    const telegramRequest = telegramFetch.mock.calls[0]?.[1] as
      | RequestInit
      | undefined;
    const telegramBody = JSON.parse(String(telegramRequest?.body)) as {
      text?: string;
      caption?: string;
    };
    const telegramMessage = telegramBody.text ?? telegramBody.caption ?? "";

    expect(telegramMessage).toContain("Весы на распалетчик");
    expect(telegramMessage).toContain("Вакуумный захват");
    expect(telegramMessage).not.toContain(forgedLabel);
    expect(telegramMessage).toContain(serverResult.recommendation.title);
    expect(telegramMessage).not.toContain("Клиентское название");
  });

  it("uses the published custom profile title, price, and options as the server authority", async () => {
    const customProfile = {
      ...calculatorProfiles[0],
      id: "custom-sheet-storage",
      title: "Серверная система Custom",
      shortTitle: "Custom",
      options: [
        {
          id: "server-option",
          title: "Серверная опция",
          price: 123_000,
          defaultSelected: true
        }
      ]
    };
    mocks.getCalculatorProfiles.mockResolvedValue([customProfile]);
    const calculatorInput = normalizeCalculatorInput(
      {
        systemId: customProfile.id,
        optionIds: ["server-option"]
      },
      customProfile
    );
    const serverResult = calculateStorageSystem(
      calculatorInput,
      customProfile
    );
    const telegramFetch = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
    );
    vi.stubGlobal("fetch", telegramFetch);

    const response = await POST(
      new Request(
        "https://kbparus-metal-storage.vercel.app/api/leads",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://kbparus-metal-storage.vercel.app"
          },
          body: JSON.stringify({
            leadType: "configurator",
            contact: {
              name: "Тест",
              phone: "+7 999 000-00-02",
              email: ""
            },
            city: "Москва",
            comment: "",
            calculatorInput,
            recommendedConfig: {
              title: "Подменённое клиентское название",
              options: ["Подменённая опция"]
            },
            preliminaryPriceFrom: 1,
            source: "Калькулятор",
            sourceTitle: "Подменённый sourceTitle",
            sourceUrl:
              "https://kbparus-metal-storage.vercel.app/#calculator",
            hp_url: "",
            formStartedAt: Date.now() - 5_000,
            consent: createLeadConsent()
          })
        }
      )
    );

    expect(response.status).toBe(200);
    const savedLead = mocks.saveLeadToCms.mock.calls[0]?.[0];
    expect(savedLead.result?.recommendation.title).toBe(
      "Серверная система Custom"
    );
    expect(savedLead.fromPrice).toBe(serverResult.fromPrice);
    expect(savedLead.selectedOptions).toEqual(["Серверная опция"]);
    expect(savedLead.sourceTitle).toBe("Подменённый sourceTitle");

    const telegramRequest = telegramFetch.mock.calls[0]?.[1] as
      | RequestInit
      | undefined;
    const telegramBody = JSON.parse(String(telegramRequest?.body)) as {
      text?: string;
      caption?: string;
    };
    const message = telegramBody.text ?? telegramBody.caption ?? "";
    expect(message).toContain("Серверная система Custom");
    expect(message).toContain("Серверная опция");
    expect(message).not.toContain("Подменённое клиентское название");
    expect(message).not.toContain("Подменённая опция");
  });

  it("rejects a syntactically valid but unpublished profile before delivery", async () => {
    mocks.getCalculatorProfiles.mockResolvedValue([]);

    const response = await POST(
      new Request(
        "https://kbparus-metal-storage.vercel.app/api/leads",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://kbparus-metal-storage.vercel.app"
          },
          body: JSON.stringify({
            leadType: "configurator",
            contact: {
              name: "Тест",
              phone: "+7 999 000-00-03",
              email: ""
            },
            city: "",
            comment: "",
            calculatorInput: {
              systemId: "unpublished-custom-profile"
            },
            hp_url: "",
            formStartedAt: Date.now() - 5_000,
            consent: createLeadConsent()
          })
        }
      )
    );

    expect(response.status).toBe(422);
    expect(mocks.sendLeadEmail).not.toHaveBeenCalled();
    expect(mocks.saveLeadToCms).not.toHaveBeenCalled();
  });
});
