import { formatRoundedRub } from "@/lib/calculator/format";
import {
  getSmtpTransport,
  isSmtpConfigured,
  smtpSettingsFromEnv,
  type SmtpSettings
} from "@/lib/email/smtp";
import { normalizeSmtpFailure, smtpErrorLogDetails } from "@/lib/email/smtp-error";
import type { CmsLeadInput } from "@/lib/leads/cms-record";

export interface LeadEmailConfig extends SmtpSettings {
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
  const subject = (lead.leadType === "configurator"
    ? `Заявка с конфигуратора: ${selectedTitle}`
    : `Заявка с сайта: ${lead.sourceTitle || lead.phone}`)
    .replace(/[\r\n]+/g, " ")
    .slice(0, 240);
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
  return {
    ...smtpSettingsFromEnv(env),
    to: env.LEAD_EMAIL_TO || "info@kbparus.ru"
  };
}

export async function sendLeadEmail(lead: CmsLeadInput, config: LeadEmailConfig): Promise<{ ok: boolean; error?: string }> {
  if (!isSmtpConfigured(config) || !config.to) {
    return { ok: false, error: "email-not-configured" };
  }

  try {
    const transporter = getSmtpTransport(config);
    const message = buildLeadEmailMessage(lead);

    await transporter.sendMail({
      from: {
        address: config.from,
        name: process.env.SMTP_FROM_NAME?.trim() || "КБ Парус"
      },
      to: config.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      replyTo: lead.email || undefined
    });

    return { ok: true };
  } catch (error) {
    console.error("[lead-email] SMTP delivery failed", smtpErrorLogDetails(error));
    return {
      ok: false,
      error: normalizeSmtpFailure(error)
    };
  }
}
