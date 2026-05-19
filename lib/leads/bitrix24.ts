import type { CalculatorInput, CalculatorResult } from "@/lib/calculator";
import { formatRoundedRub } from "@/lib/calculator/format";

export interface Bitrix24Lead {
  leadType: "contact" | "configurator";
  name: string;
  phone: string;
  email?: string;
  city?: string;
  comment?: string;
  source?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  utm?: Record<string, string>;
  calculatorInput?: CalculatorInput;
  result?: CalculatorResult;
  selectedOptions?: string[];
  fromPrice?: number;
}

export interface Bitrix24FieldMap {
  city?: string;
  formType?: string;
  sourcePage?: string;
  sourceTitle?: string;
  utm?: string;
  calculatorConfig?: string;
  selectedProduct?: string;
  preliminaryPriceFrom?: string;
}

export interface Bitrix24Payload {
  fields: Record<string, unknown>;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function compact<T>(items: Array<T | undefined | false | "">): T[] {
  return items.filter(Boolean) as T[];
}

function formatUtm(utm: Record<string, string> | undefined): string {
  if (!utm) return "";
  return Object.entries(utm)
    .filter(([, value]) => clean(value))
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function formatCalculatorConfig(lead: Bitrix24Lead): string {
  const input = lead.calculatorInput;
  if (!input) return "";

  return compact([
    lead.result?.recommendation.title && `Система: ${lead.result.recommendation.title}`,
    `Габариты: ${input.lengthMm.toLocaleString("ru-RU")} x ${input.widthMm.toLocaleString("ru-RU")} x ${input.heightMm.toLocaleString("ru-RU")} мм`,
    `Нагрузка: ${input.loadKg.toLocaleString("ru-RU")} кг на уровень`,
    `Полки/кассеты: ${input.shelfCount.toLocaleString("ru-RU")} шт.`,
    `Башни/секции: ${input.towerCount.toLocaleString("ru-RU")} шт.`,
    input.rolloutShelfCount && input.rolloutShelfCount !== input.shelfCount
      ? `Выкатные кассеты: ${input.rolloutShelfCount.toLocaleString("ru-RU")} шт.`
      : "",
    input.rolloutSide === "two" ? "Выкат: с двух сторон" : "",
    lead.selectedOptions?.length ? `Опции: ${lead.selectedOptions.join(", ")}` : "Опции: не выбраны"
  ]).join("\n");
}

function buildComments(lead: Bitrix24Lead): string {
  const fromPrice = lead.fromPrice ?? lead.result?.fromPrice;

  return compact([
    lead.comment && `Комментарий клиента:\n${lead.comment}`,
    lead.sourceTitle && `Страница: ${lead.sourceTitle}`,
    lead.sourceUrl && `URL: ${lead.sourceUrl}`,
    lead.city && `Город/регион: ${lead.city}`,
    fromPrice ? `Ориентировочная цена: от ${formatRoundedRub(fromPrice)}` : "",
    formatCalculatorConfig(lead) && `\nКонфигурация:\n${formatCalculatorConfig(lead)}`,
    formatUtm(lead.utm) && `\nUTM:\n${formatUtm(lead.utm)}`
  ]).join("\n\n");
}

function addCustomField(fields: Record<string, unknown>, fieldCode: string | undefined, value: unknown) {
  if (!fieldCode || value === undefined || value === null || value === "") return;
  fields[fieldCode] = value;
}

export function buildBitrix24Payload(lead: Bitrix24Lead, fieldMap: Bitrix24FieldMap = {}): Bitrix24Payload {
  const isConfigurator = lead.leadType === "configurator" || Boolean(lead.calculatorInput);
  const selectedProduct = lead.result?.recommendation.title || lead.sourceTitle || lead.source || "";
  const fromPrice = lead.fromPrice ?? lead.result?.fromPrice;
  const calculatorConfig = formatCalculatorConfig(lead);
  const utmText = formatUtm(lead.utm);

  const fields: Record<string, unknown> = {
    TITLE: isConfigurator
      ? `Заявка с конфигуратора: ${selectedProduct || "системы хранения"}`
      : `Заявка с сайта${lead.sourceTitle ? `: ${lead.sourceTitle}` : ""}`,
    NAME: lead.name,
    PHONE: lead.phone ? [{ VALUE: lead.phone, VALUE_TYPE: "WORK" }] : [],
    EMAIL: lead.email ? [{ VALUE: lead.email, VALUE_TYPE: "WORK" }] : [],
    COMMENTS: buildComments(lead),
    SOURCE_ID: "WEB",
    SOURCE_DESCRIPTION: lead.sourceUrl || lead.sourceTitle || lead.source || "kbparus-metal-storage"
  };

  addCustomField(fields, fieldMap.city, lead.city);
  addCustomField(fields, fieldMap.formType, lead.leadType);
  addCustomField(fields, fieldMap.sourcePage, lead.sourceUrl);
  addCustomField(fields, fieldMap.sourceTitle, lead.sourceTitle || lead.source);
  addCustomField(fields, fieldMap.utm, utmText);
  addCustomField(fields, fieldMap.calculatorConfig, calculatorConfig);
  addCustomField(fields, fieldMap.selectedProduct, selectedProduct);
  addCustomField(fields, fieldMap.preliminaryPriceFrom, fromPrice);

  return { fields };
}

export function bitrix24FieldMapFromEnv(env: NodeJS.ProcessEnv): Bitrix24FieldMap {
  return {
    city: env.BITRIX24_FIELD_CITY,
    formType: env.BITRIX24_FIELD_FORM_TYPE,
    sourcePage: env.BITRIX24_FIELD_SOURCE_PAGE,
    sourceTitle: env.BITRIX24_FIELD_SOURCE_TITLE,
    utm: env.BITRIX24_FIELD_UTM,
    calculatorConfig: env.BITRIX24_FIELD_CALCULATOR_CONFIG,
    selectedProduct: env.BITRIX24_FIELD_SELECTED_PRODUCT,
    preliminaryPriceFrom: env.BITRIX24_FIELD_PRELIMINARY_PRICE_FROM
  };
}
