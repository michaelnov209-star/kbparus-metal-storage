import type SMTPTransport from "nodemailer/lib/smtp-transport";

type SmtpEnvironment = Record<string, string | undefined>;

export interface SmtpSettings {
  host?: string;
  port?: number;
  secure: boolean;
  user?: string;
  password?: string;
  from?: string;
}

export interface ConfiguredSmtpSettings extends SmtpSettings {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

function clean(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function parsePort(value: string | undefined): number | undefined {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65_535 ? port : undefined;
}

function resolveSecure(value: string | undefined, port: number | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return port === 465;
}

export function smtpSettingsFromEnv(env: SmtpEnvironment): SmtpSettings {
  const port = parsePort(env.SMTP_PORT);
  const user = clean(env.SMTP_USER);

  return {
    host: clean(env.SMTP_HOST),
    port,
    secure: resolveSecure(env.SMTP_SECURE, port),
    user,
    password: clean(env.SMTP_PASSWORD),
    from: clean(env.SMTP_FROM) || user
  };
}

export function isSmtpConfigured(
  settings: SmtpSettings
): settings is ConfiguredSmtpSettings {
  return Boolean(
    settings.host &&
      settings.port &&
      settings.user &&
      settings.password &&
      settings.from
  );
}

export function smtpTransportOptions(
  settings: ConfiguredSmtpSettings
): SMTPTransport.Options {
  return {
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    requireTLS: !settings.secure,
    auth: {
      user: settings.user,
      pass: settings.password
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    tls: {
      minVersion: "TLSv1.2"
    }
  };
}
