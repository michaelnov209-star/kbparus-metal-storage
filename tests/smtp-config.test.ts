import { describe, expect, it } from "vitest";
import {
  isSmtpConfigured,
  smtpSettingsFromEnv,
  smtpTransportOptions
} from "@/lib/email/smtp";

describe("SMTP runtime configuration", () => {
  it("uses implicit TLS by default on port 465", () => {
    const settings = smtpSettingsFromEnv({
      SMTP_HOST: " smtp.example.com ",
      SMTP_PORT: "465",
      SMTP_USER: " robot@example.com ",
      SMTP_PASSWORD: " secret "
    });

    expect(settings).toEqual({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      user: "robot@example.com",
      password: "secret",
      from: "robot@example.com"
    });
    expect(isSmtpConfigured(settings)).toBe(true);
  });

  it("uses STARTTLS by default on port 587", () => {
    const settings = smtpSettingsFromEnv({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_USER: "robot@example.com",
      SMTP_PASSWORD: "secret",
      SMTP_FROM: "leads@example.com"
    });

    expect(isSmtpConfigured(settings)).toBe(true);
    if (!isSmtpConfigured(settings)) throw new Error("SMTP should be configured");

    expect(settings.secure).toBe(false);
    expect(smtpTransportOptions(settings)).toMatchObject({
      secure: false,
      requireTLS: true,
      connectionTimeout: 10_000,
      socketTimeout: 15_000
    });
  });

  it("honors an explicit secure flag", () => {
    expect(
      smtpSettingsFromEnv({
        SMTP_PORT: "587",
        SMTP_SECURE: "true"
      }).secure
    ).toBe(true);
  });

  it("stays disabled when any required credential is missing", () => {
    const settings = smtpSettingsFromEnv({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "465",
      SMTP_USER: "robot@example.com"
    });

    expect(isSmtpConfigured(settings)).toBe(false);
  });
});
