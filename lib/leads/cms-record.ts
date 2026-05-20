import type { CalculatorInput, CalculatorResult } from "@/lib/calculator";

export interface CmsLeadInput {
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
  emailDelivered: boolean;
  telegramDelivered: boolean;
  bitrix24Delivered: boolean;
  deliveryErrors?: string[];
}

function compact(items: Array<string | undefined | false | null>) {
  return items.filter(Boolean) as string[];
}

function buildCalculatorSummary(lead: CmsLeadInput): string {
  const input = lead.calculatorInput;
  if (!input) return "";

  return compact([
    lead.result?.recommendation.title && `Система: ${lead.result.recommendation.title}`,
    `Габариты: ${input.lengthMm.toLocaleString("ru-RU")} x ${input.widthMm.toLocaleString("ru-RU")} x ${input.heightMm.toLocaleString("ru-RU")} мм`,
    `Нагрузка: ${input.loadKg.toLocaleString("ru-RU")} кг на уровень`,
    `Полки/кассеты: ${input.shelfCount.toLocaleString("ru-RU")} шт.`,
    `Башни/секции: ${input.towerCount.toLocaleString("ru-RU")} шт.`,
    lead.selectedOptions?.length ? `Опции: ${lead.selectedOptions.join(", ")}` : undefined
  ]).join("\n");
}

export function buildCmsLeadRecord(lead: CmsLeadInput) {
  const isConfigurator = lead.leadType === "configurator" || Boolean(lead.calculatorInput);
  const recommendedTitle = lead.result?.recommendation.title || lead.sourceTitle || lead.source || "";
  const title = isConfigurator
    ? `Заявка с конфигуратора: ${recommendedTitle || lead.phone}`
    : `Заявка с сайта: ${lead.sourceTitle || lead.phone}`;

  return {
    title,
    status: "new",
    leadType: isConfigurator ? "configurator" : "contact",
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    city: lead.city,
    comment: lead.comment,
    source: lead.source,
    sourceTitle: lead.sourceTitle,
    sourceUrl: lead.sourceUrl,
    utm: lead.utm ?? {},
    recommendedTitle,
    preliminaryPriceFrom: lead.fromPrice ?? lead.result?.fromPrice,
    calculatorSummary: buildCalculatorSummary(lead),
    calculatorInput: lead.calculatorInput,
    emailDelivered: lead.emailDelivered,
    telegramDelivered: lead.telegramDelivered,
    bitrix24Delivered: lead.bitrix24Delivered,
    cmsStored: true,
    deliveryErrors: lead.deliveryErrors?.join("\n")
  };
}
