import nodemailer, { type Transporter } from "nodemailer";
import {
  smtpTransportOptions,
  type ConfiguredSmtpSettings
} from "./smtp-config";

export {
  isSmtpConfigured,
  smtpSettingsFromEnv,
  smtpTransportOptions,
  type ConfiguredSmtpSettings,
  type SmtpSettings
} from "./smtp-config";

let cachedTransport:
  | {
      key: string;
      transport: Transporter;
    }
  | undefined;

export function getSmtpTransport(settings: ConfiguredSmtpSettings): Transporter {
  const key = JSON.stringify([
    settings.host,
    settings.port,
    settings.secure,
    settings.user,
    settings.password,
    settings.from
  ]);

  if (cachedTransport?.key === key) return cachedTransport.transport;

  const transport = nodemailer.createTransport(smtpTransportOptions(settings));
  cachedTransport = { key, transport };
  return transport;
}
