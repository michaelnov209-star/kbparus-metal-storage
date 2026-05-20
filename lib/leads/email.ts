import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { formatRoundedRub } from "@/lib/calculator/format";
import type { CmsLeadInput } from "@/lib/leads/cms-record";

export interface LeadEmailConfig {
  host?: string;
  port?: number;
  secure: boolean;
  user?: string;
  password?: string;
  from?: string;
  to: string;
}

export interface LeadEmailMessage {
  subject: string;
  text: string;
  html: string;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rows(items: Array<[string, string | undefined]>) {
  return items
    .filter(([, value]) => clean(value))
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function htmlRows(items: Array<[string, string | undefined]>) {
  return items
    .filter(([, value]) => clean(value))
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value ?? "")}</td></tr>`)
    .join("");
}

function formatUtm(utm: Record<string, string> | undefined): string {
  if (!utm) return "";
  return Object.entries(utm)
    .filter(([, value]) => clean(value))
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function formatCalculator(lead: CmsLeadInput): string {
  const input = lead.calculatorInput;
  if (!input) return "";

  return rows([
    ["Система", lead.result?.recommendation.title],
    ["Габариты", `${input.lengthMm.toLocaleString("ru-RU")} x ${input.widthMm.toLocaleString("ru-RU")} x ${input.heightMm.toLocaleString("ru-RU")} мм`],
    ["Нагрузка", `${input.loadKg.toLocaleString("ru-RU")} кг на уровень`],
    ["Полки/кассеты", `${input.shelfCount.toLocaleString("ru-RU")} шт.`],
    ["Башни/секции", `${input.towerCount.toLocaleString("ru-RU")} шт.`],
    ["Опции", lead.selectedOptions?.join(", ")]
  ]);
}

export function buildLeadEmailMessage(lead: CmsLeadInput): LeadEmailMessage {
  const selectedTitle = lead.result?.recommendation.title || lead.sourceTitle || lead.source || "заявка с сайта";
  const subject = lead.leadType === "configurator"
    ? `Заявка с конфигуратора: ${selectedTitle}`
    : `Заявка с сайта: ${lead.sourceTitle || lead.phone}`;
  const price = lead.fromPrice ?? lead.result?.fromPrice;
  const contactRows: Array<[string, string | undefined]> = [
    ["Тип", lead.leadType === "configurator" ? "Конфигуратор" : "Контактная форма"],
    ["Имя", lead.name],
    ["Телефон", lead.phone],
    ["Email", lead.email],
    ["Город", lead.city],
    ["Ориентировочная цена", price ? `от ${formatRoundedRub(price)}` : undefined],
    ["Источник", lead.sourceTitle || lead.source],
    ["URL", lead.sourceUrl]
  ];
  const calculator = formatCalculator(lead);
  const utm = formatUtm(lead.utm);

  const text = [
    subject,
    "",
    rows(contactRows),
    lead.comment ? `\nКомментарий клиента:\n${lead.comment}` : "",
    calculator ? `\nКонфигурация:\n${calculator}` : "",
    utm ? `\nUTM:\n${utm}` : ""
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1a1a1a;line-height:1.5">
      <h2>${escapeHtml(subject)}</h2>
      <table style="border-collapse:collapse;width:100%;max-width:760px">
        ${htmlRows(contactRows)}
      </table>
      ${lead.comment ? `<h3>Комментарий клиента</h3><p>${escapeHtml(lead.comment).replace(/\n/g, "<br />")}</p>` : ""}
      ${calculator ? `<h3>Конфигурация</h3><pre style="white-space:pre-wrap">${escapeHtml(calculator)}</pre>` : ""}
      ${utm ? `<h3>UTM</h3><pre style="white-space:pre-wrap">${escapeHtml(utm)}</pre>` : ""}
    </div>
  `;

  return { subject, text, html };
}

export function leadEmailConfigFromEnv(env: Record<string, string | undefined>): LeadEmailConfig {
  const port = Number(env.SMTP_PORT || 0);
  return {
    host: env.SMTP_HOST,
    port: Number.isFinite(port) && port > 0 ? port : undefined,
    secure: env.SMTP_SECURE === "true",
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.SMTP_FROM || env.SMTP_USER,
    to: env.LEAD_EMAIL_TO || "info@kbparus.ru"
  };
}

export async function sendLeadEmail(lead: CmsLeadInput, config: LeadEmailConfig): Promise<{ ok: boolean; error?: string }> {
  if (!config.host || !config.port || !config.user || !config.password || !config.from || !config.to) {
    return { ok: false, error: "email-not-configured" };
  }

  try {
    const transportOptions: SMTPTransport.Options = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.password }
    };
    const transporter = nodemailer.createTransport(transportOptions);
    const message = buildLeadEmailMessage(lead);

    await transporter.sendMail({
      from: config.from,
      to: config.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      replyTo: lead.email || undefined
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "email-send-failed"
    };
  }
}
