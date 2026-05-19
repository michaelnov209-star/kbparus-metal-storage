import { describe, expect, it } from "vitest";
import { calculateStorageSystem, normalizeCalculatorInput } from "@/lib/calculator";
import { buildBitrix24Payload, resolveBitrix24WebhookUrl } from "@/lib/leads/bitrix24";
import { buildTelegramMessage } from "@/lib/leads/telegram";

describe("Telegram lead messages", () => {
  it("includes readable configurator parameters without internal fields", () => {
    const message = buildTelegramMessage({
      leadType: "configurator",
      name: "Иван",
      phone: "+7 999 111-22-33",
      email: "ivan@example.com",
      city: "Москва",
      comment: "Нужен монтаж на складе",
      sourceTitle: "Автоматический стеллаж листового металла",
      sourceUrl: "https://example.com/#calculator",
      recommendationTitle: "Автоматический стеллаж листового металла",
      fromPriceLabel: "от 7 408 000 ₽",
      calculatorInput: normalizeCalculatorInput({
        systemId: "auto-sheet-metal",
        heightMm: 70,
        widthMm: 1600,
        lengthMm: 3100,
        loadKg: 2000,
        shelfCount: 20,
        towerCount: 1,
        optionIds: ["scale", "vacuum-grip"]
      }),
      selectedOptions: ["Весы на распалетчик", "Вакуумный захват"]
    });

    expect(message).toContain("Заявка с конфигуратора");
    expect(message).toContain("Тип системы");
    expect(message).toContain("длина 3 100 мм, ширина 1 600 мм, высота 70 мм");
    expect(message).toContain("Нагрузка");
    expect(message).toContain("Весы на распалетчик, Вакуумный захват");
    expect(message).toContain("от 7 408 000 ₽");
    expect(message).not.toContain("systemId");
    expect(message).not.toContain("optionIds");
    expect(message).not.toContain("auto-sheet-metal");
    expect(message).not.toContain("{");
  });

  it("keeps ordinary contact messages short", () => {
    const message = buildTelegramMessage({
      leadType: "contact",
      name: "Анна",
      phone: "+7 999 111-22-33",
      email: "anna@example.com",
      city: "Казань",
      comment: "Перезвонить завтра",
      sourceTitle: "Контакты",
      sourceUrl: "https://example.com/contacts"
    });

    expect(message).toContain("Новая заявка с сайта");
    expect(message).toContain("Имя");
    expect(message).toContain("Телефон");
    expect(message).toContain("Комментарий");
    expect(message).toContain("Источник");
    expect(message).not.toContain("Тип системы");
    expect(message).not.toContain("Предварительная стоимость");
    expect(message).not.toContain("anna@example.com");
    expect(message).not.toContain("Казань");
  });
});

describe("Bitrix24 lead payload", () => {
  it("normalizes base Bitrix24 webhook URL to deal add method", () => {
    expect(resolveBitrix24WebhookUrl("https://example.bitrix24.ru/rest/1/token/")).toBe(
      "https://example.bitrix24.ru/rest/1/token/crm.deal.add.json"
    );
    expect(resolveBitrix24WebhookUrl("https://example.bitrix24.ru/rest/1/token/crm.deal.add.json")).toBe(
      "https://example.bitrix24.ru/rest/1/token/crm.deal.add.json"
    );
  });

  it("maps ordinary contact lead to safe standard Bitrix fields", () => {
    const payload = buildBitrix24Payload({
      leadType: "contact",
      name: "Анна",
      phone: "+7 999 111-22-33",
      email: "anna@example.com",
      city: "Казань",
      comment: "Перезвонить завтра",
      sourceTitle: "Контакты",
      sourceUrl: "https://example.com/#contacts",
      utm: { utm_source: "yandex", utm_campaign: "metal-storage" }
    });

    expect(payload.fields.TITLE).toBe("Заявка с сайта: Контакты");
    expect(payload.fields.NAME).toBe("Анна");
    expect(payload.fields.PHONE).toEqual([{ VALUE: "+7 999 111-22-33", VALUE_TYPE: "WORK" }]);
    expect(payload.fields.EMAIL).toEqual([{ VALUE: "anna@example.com", VALUE_TYPE: "WORK" }]);
    expect(payload.fields.SOURCE_ID).toBe("WEB");
    expect(String(payload.fields.COMMENTS)).toContain("Перезвонить завтра");
    expect(String(payload.fields.COMMENTS)).toContain("utm_source: yandex");
    expect(String(payload.fields.COMMENTS)).toContain("https://example.com/#contacts");
  });

  it("maps configurator lead to comments and configured custom fields", () => {
    const calculatorInput = normalizeCalculatorInput({
      systemId: "auto-sheet-metal",
      heightMm: 70,
      widthMm: 1600,
      lengthMm: 3100,
      loadKg: 2000,
      shelfCount: 20,
      towerCount: 1,
      optionIds: ["scale", "vacuum-grip"]
    });
    const result = calculateStorageSystem(calculatorInput);

    const payload = buildBitrix24Payload(
      {
        leadType: "configurator",
        name: "Иван",
        phone: "+7 999 111-22-33",
        email: "ivan@example.com",
        city: "Москва",
        comment: "Нужен монтаж на складе",
        sourceTitle: "Автоматический стеллаж листового металла",
        sourceUrl: "https://example.com/#calculator",
        utm: { utm_source: "direct" },
        calculatorInput,
        result,
        selectedOptions: ["Весы на распалетчик", "Вакуумный захват"],
        fromPrice: result.fromPrice
      },
      {
        city: "UF_CRM_CITY",
        formType: "UF_CRM_FORM_TYPE",
        sourcePage: "UF_CRM_SOURCE_PAGE",
        sourceTitle: "UF_CRM_SOURCE_TITLE",
        utm: "UF_CRM_UTM",
        calculatorConfig: "UF_CRM_CALCULATOR_CONFIG",
        selectedProduct: "UF_CRM_SELECTED_PRODUCT",
        preliminaryPriceFrom: "UF_CRM_PRELIMINARY_PRICE_FROM"
      }
    );

    expect(payload.fields.TITLE).toContain("Заявка с конфигуратора");
    expect(payload.fields.UF_CRM_CITY).toBe("Москва");
    expect(payload.fields.UF_CRM_FORM_TYPE).toBe("configurator");
    expect(payload.fields.UF_CRM_SOURCE_PAGE).toBe("https://example.com/#calculator");
    expect(payload.fields.UF_CRM_UTM).toBe("utm_source: direct");
    expect(payload.fields.UF_CRM_CALCULATOR_CONFIG).toContain("Габариты: 3 100 x 1 600 x 70 мм");
    expect(payload.fields.UF_CRM_CALCULATOR_CONFIG).toContain("Весы на распалетчик, Вакуумный захват");
    expect(payload.fields.UF_CRM_SELECTED_PRODUCT).toBe(result.recommendation.title);
    expect(payload.fields.UF_CRM_PRELIMINARY_PRICE_FROM).toBe(result.fromPrice);
    expect(String(payload.fields.COMMENTS)).toContain("Ориентировочная цена");
    expect(String(payload.fields.COMMENTS)).toContain("Конфигурация");
  });
});
