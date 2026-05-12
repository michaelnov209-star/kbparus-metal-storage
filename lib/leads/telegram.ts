import { getCalculatorProfile } from "@/data/storageSystems/excelCalculator";
import type { CalculatorInput } from "@/lib/calculator";

export type LeadMessageType = "contact" | "configurator";

export interface TelegramLead {
  leadType: LeadMessageType;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  comment?: string;
  source?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceImageUrl?: string;
  recommendationTitle?: string;
  fromPriceLabel?: string;
  calculatorInput?: CalculatorInput;
  selectedOptions?: string[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function clean(value: string | undefined): string {
  return String(value ?? "").trim();
}

function formatNumber(value: number): string {
  return value.toLocaleString("ru-RU");
}

function sourceLine(lead: TelegramLead): string | undefined {
  if (lead.sourceUrl && lead.sourceTitle) {
    return `<b>Источник:</b> <a href="${escapeHtml(lead.sourceUrl)}">${escapeHtml(lead.sourceTitle)}</a>`;
  }

  if (lead.sourceUrl) {
    return `<b>Источник:</b> <a href="${escapeHtml(lead.sourceUrl)}">${escapeHtml(lead.sourceUrl)}</a>`;
  }

  if (lead.source) {
    return `<b>Источник:</b> ${escapeHtml(lead.source)}`;
  }

  return undefined;
}

function selectedOptionLabels(lead: TelegramLead): string[] {
  if (lead.selectedOptions?.length) {
    return lead.selectedOptions.map(clean).filter(Boolean);
  }

  const input = lead.calculatorInput;
  if (!input?.optionIds?.length) return [];

  const profile = getCalculatorProfile(input.systemId);
  return input.optionIds
    .map((optionId) => profile.options.find((option) => option.id === optionId)?.title)
    .filter((title): title is string => Boolean(title));
}

function buildConfiguratorMessage(lead: TelegramLead): string {
  const input = lead.calculatorInput;
  const profile = input ? getCalculatorProfile(input.systemId) : undefined;
  const phoneClean = lead.phone.replace(/[\s\-()]/g, "");
  const options = selectedOptionLabels(lead);
  const equipmentTitle = lead.recommendationTitle || profile?.title || "Не указано";
  const lines: string[] = [
    "<b>Заявка с конфигуратора</b>",
    "",
    `<b>Тип системы:</b> ${escapeHtml(equipmentTitle)}`
  ];

  if (input) {
    lines.push(
      `<b>Габариты:</b> длина ${formatNumber(input.lengthMm)} мм, ширина ${formatNumber(input.widthMm)} мм, высота ${formatNumber(input.heightMm)} мм`,
      `<b>Нагрузка:</b> ${formatNumber(input.loadKg)} кг на уровень`,
      `<b>Полки/кассеты:</b> ${formatNumber(input.shelfCount)} шт.`,
      `<b>Башни/секции:</b> ${formatNumber(input.towerCount)} шт.`
    );

    if (input.rolloutShelfCount && input.rolloutShelfCount !== input.shelfCount) {
      lines.push(`<b>Выкатные кассеты:</b> ${formatNumber(input.rolloutShelfCount)} шт.`);
    }

    if (input.rolloutSide === "two") {
      lines.push("<b>Выкат:</b> с двух сторон");
    }
  }

  lines.push(`<b>Опции:</b> ${options.length ? escapeHtml(options.join(", ")) : "не выбраны"}`);

  if (clean(lead.city)) lines.push(`<b>Город/регион:</b> ${escapeHtml(clean(lead.city))}`);
  if (lead.fromPriceLabel) lines.push(`<b>Предварительная стоимость:</b> ${escapeHtml(lead.fromPriceLabel)}`);

  lines.push("");
  if (lead.name) lines.push(`<b>Имя:</b> ${escapeHtml(lead.name)}`);
  lines.push(`<b>Телефон:</b> <a href="tel:${escapeHtml(phoneClean)}">${escapeHtml(lead.phone)}</a>`);
  if (lead.email) lines.push(`<b>Email:</b> ${escapeHtml(lead.email)}`);

  if (clean(lead.comment)) {
    lines.push("", "<b>Комментарий:</b>", escapeHtml(clean(lead.comment)));
  }

  const source = sourceLine(lead);
  if (source) lines.push("", source);

  return lines.join("\n");
}

function buildContactMessage(lead: TelegramLead): string {
  const phoneClean = lead.phone.replace(/[\s\-()]/g, "");
  const lines: string[] = ["<b>Новая заявка с сайта</b>", ""];

  if (lead.name) lines.push(`<b>Имя:</b> ${escapeHtml(lead.name)}`);
  lines.push(`<b>Телефон:</b> <a href="tel:${escapeHtml(phoneClean)}">${escapeHtml(lead.phone)}</a>`);

  if (clean(lead.comment)) {
    lines.push("", "<b>Комментарий:</b>", escapeHtml(clean(lead.comment)));
  }

  const source = sourceLine(lead);
  if (source) lines.push("", source);

  return lines.join("\n");
}

export function buildTelegramMessage(lead: TelegramLead): string {
  return lead.leadType === "configurator"
    ? buildConfiguratorMessage(lead)
    : buildContactMessage(lead);
}
