import { describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { createLeadConsent, LEAD_CONSENT_VERSION } from "@/lib/leads/contract";
import {
  checkLeadRateLimit,
  getLeadClientIdentity,
  rateLimitHeaders
} from "@/lib/leads/rate-limit";
import {
  LeadValidationError,
  parseLeadPayload,
  readLeadJsonBody
} from "@/lib/leads/validation";

function validPayload() {
  return {
    leadType: "contact",
    contact: {
      name: "Иван",
      phone: "+7 (999) 123-45-67",
      email: "ivan@example.com"
    },
    city: "Москва",
    comment: "Нужен расчёт",
    source: "Главная",
    sourceUrl: "/#request",
    utm: {
      utm_source: "search",
      utm_campaign: "metal"
    },
    consent: createLeadConsent()
  };
}

describe("lead request validation", () => {
  it("accepts and normalizes a valid lead", () => {
    const parsed = parseLeadPayload(validPayload());

    expect(parsed.contact.phone).toBe("+7 (999) 123-45-67");
    expect(parsed.consent).toEqual({
      accepted: true,
      version: LEAD_CONSENT_VERSION
    });
    expect(parsed.utm).toEqual({
      utm_source: "search",
      utm_campaign: "metal"
    });
  });

  it("requires the current personal-data consent", () => {
    const payload = validPayload();
    const withoutConsent = { ...payload, consent: undefined };

    expect(() => parseLeadPayload(withoutConsent)).toThrowError(
      expect.objectContaining<Partial<LeadValidationError>>({
        code: "consent_required"
      })
    );
  });

  it("rejects unknown fields instead of silently accepting arbitrary data", () => {
    expect(() =>
      parseLeadPayload({ ...validPayload(), admin: true })
    ).toThrowError(
      expect.objectContaining<Partial<LeadValidationError>>({
        code: "unknown_field"
      })
    );
  });

  it("rejects malformed contact and tracking values", () => {
    expect(() =>
      parseLeadPayload({
        ...validPayload(),
        contact: { name: "Иван", phone: "123", email: "not-an-email" }
      })
    ).toThrowError(
      expect.objectContaining<Partial<LeadValidationError>>({
        code: "invalid_phone"
      })
    );

    expect(() =>
      parseLeadPayload({
        ...validPayload(),
        utm: { utm_source: "search", arbitrary: "value" }
      })
    ).toThrowError(
      expect.objectContaining<Partial<LeadValidationError>>({
        code: "unknown_field"
      })
    );
  });

  it("validates calculator fields and option-array limits", () => {
    const parsed = parseLeadPayload({
      ...validPayload(),
      leadType: "configurator",
      calculatorInput: {
        systemId: "auto-sheet-metal",
        material: "sheet",
        lengthMm: 3000,
        widthMm: 1500,
        heightMm: 3000,
        loadKg: 3000,
        shelfCount: 8,
        towerCount: 1,
        optionIds: ["scale"]
      },
      recommendedConfig: {
        title: "Автоматический стеллаж",
        options: ["Весы"]
      }
    });

    expect(parsed.calculatorInput).toMatchObject({
      systemId: "auto-sheet-metal",
      optionIds: ["scale"]
    });
    expect(parsed.recommendedConfig?.options).toEqual(["Весы"]);
  });

  it("accepts a safe CMS profile slug and rejects unsafe calculator identifiers", () => {
    const parsed = parseLeadPayload({
      ...validPayload(),
      leadType: "configurator",
      calculatorInput: {
        systemId: "custom-sheet-storage-v2"
      }
    });

    expect(parsed.calculatorInput?.systemId).toBe(
      "custom-sheet-storage-v2"
    );

    expect(() =>
      parseLeadPayload({
        ...validPayload(),
        leadType: "configurator",
        calculatorInput: {
          systemId: "__proto__"
        }
      })
    ).toThrowError(
      expect.objectContaining<Partial<LeadValidationError>>({
        code: "invalid_value"
      })
    );
  });
});

describe("lead request body limits", () => {
  it("requires JSON content type", async () => {
    const request = new Request("https://example.test/api/leads", {
      method: "POST",
      body: JSON.stringify(validPayload())
    });

    await expect(readLeadJsonBody(request)).rejects.toMatchObject({
      code: "unsupported_media_type",
      status: 415
    });
  });

  it("rejects bodies larger than 32 KiB", async () => {
    const request = new Request("https://example.test/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validPayload(), comment: "x".repeat(40_000) })
    });

    await expect(readLeadJsonBody(request)).rejects.toMatchObject({
      code: "payload_too_large",
      status: 413
    });
  });
});

describe("lead rate limiting", () => {
  it("cannot be bypassed by rotating User-Agent for the same Vercel IP", () => {
    const first = new Request("https://example.test/api/leads", {
      headers: {
        "user-agent": "browser-a",
        "x-vercel-forwarded-for": "203.0.113.42"
      }
    });
    const second = new Request("https://example.test/api/leads", {
      headers: {
        "user-agent": "browser-b",
        "x-vercel-forwarded-for": "203.0.113.42"
      }
    });

    expect(getLeadClientIdentity(first)).toBe("203.0.113.42");
    expect(getLeadClientIdentity(second)).toBe("203.0.113.42");
  });

  it("enforces a bounded in-memory fallback and exposes retry metadata", async () => {
    const env = {
      NODE_ENV: "test",
      LEAD_RATE_LIMIT_MAX: "2",
      LEAD_RATE_LIMIT_WINDOW_MS: "10000",
      LEAD_RATE_LIMIT_SALT: "test-salt"
    } as NodeJS.ProcessEnv;
    const identity = `test-client-${Date.now()}`;

    const first = await checkLeadRateLimit(identity, env, 1_000);
    const second = await checkLeadRateLimit(identity, env, 1_001);
    const third = await checkLeadRateLimit(identity, env, 1_002);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(rateLimitHeaders(third)).toMatchObject({
      "Retry-After": "10",
      "X-RateLimit-Limit": "2",
      "X-RateLimit-Remaining": "0"
    });
  });

  it("uses the shared PostgreSQL limiter when the CMS database is available", async () => {
    const pool = {
      query: async (_query: string, values?: unknown[]) => ({
        rows: [
          {
            count: 1,
            reset_at_ms: Number(values?.[1] ?? 11_000)
          }
        ]
      })
    } as unknown as Pool;

    const result = await checkLeadRateLimit(
      "database-client",
      {
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://configured",
        LEAD_RATE_LIMIT_SALT: "test-salt"
      } as NodeJS.ProcessEnv,
      1_000,
      pool
    );

    expect(result).toMatchObject({
      allowed: true,
      backend: "database",
      remaining: 4
    });
  });

  it("fails closed in production when every durable limiter is unavailable", async () => {
    const result = await checkLeadRateLimit(
      "unavailable-client",
      {
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://configured",
        LEAD_RATE_LIMIT_SALT: "test-salt"
      } as NodeJS.ProcessEnv,
      1_000
    );

    expect(result).toMatchObject({
      allowed: false,
      backend: "unavailable",
      retryAfterSeconds: 30
    });
  });
});
