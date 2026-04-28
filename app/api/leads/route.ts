import { NextResponse } from "next/server";
import { calculateStorageSystem, normalizeCalculatorInput } from "@/lib/calculator";

interface LeadPayload {
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  city?: string;
  comment?: string;
  utm?: Record<string, string>;
  calculatorInput?: Record<string, unknown>;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as LeadPayload;
  const calculatorInput = normalizeCalculatorInput({
    ...payload.calculatorInput,
    city: payload.city || String(payload.calculatorInput?.city ?? ""),
    comment: payload.comment
  });
  const result = calculateStorageSystem(calculatorInput);

  const crmPayload = {
    TITLE: `Заявка: ${result.recommendation.title}`,
    NAME: payload.contact?.name ?? "",
    PHONE: payload.contact?.phone ? [{ VALUE: payload.contact.phone, VALUE_TYPE: "WORK" }] : [],
    EMAIL: payload.contact?.email ? [{ VALUE: payload.contact.email, VALUE_TYPE: "WORK" }] : [],
    COMMENTS: payload.comment ?? "",
    UF_CITY: payload.city ?? calculatorInput.city,
    UF_CALCULATOR_INPUT: calculatorInput,
    UF_RECOMMENDED_CONFIG: result.recommendation,
    UF_PRELIMINARY_PRICE_FROM: result.fromPrice,
    UF_PRELIMINARY_PRICE: result.preliminaryPrice,
    UF_UTM: payload.utm ?? {}
  };

  if (!process.env.BITRIX24_WEBHOOK_URL) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      message: "Заявка подготовлена. Для отправки в Bitrix24 задайте BITRIX24_WEBHOOK_URL.",
      crmPayload
    });
  }

  const response = await fetch(process.env.BITRIX24_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: crmPayload })
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, error: "Bitrix24 request failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, mode: "bitrix24" });
}
