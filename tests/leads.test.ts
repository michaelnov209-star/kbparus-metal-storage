import { describe, expect, it } from "vitest";
import { calculateStorageSystem, normalizeCalculatorInput } from "@/lib/calculator";
import { buildBitrix24Payload, resolveBitrix24WebhookUrl } from "@/lib/leads/bitrix24";
import { getBitrix24RuntimeConfig } from "@/lib/leads/bitrix24-config";
import { buildCmsLeadRecord } from "@/lib/leads/cms-record";
import { buildLeadEmailMessage, leadEmailConfigFromEnv } from "@/lib/leads/email";
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

  it("includes useful contact context for managers without calculator noise", () => {
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
    expect(message).toContain("anna@example.com");
    expect(message).toContain("Казань");
    expect(message).not.toContain("Тип системы");
    expect(message).not.toContain("Предварительная стоимость");
  });

  it("shows a direct product-page link for a product calculator lead", () => {
    const message = buildTelegramMessage({
      leadType: "configurator",
      name: "Иван",
      phone: "+7 999 111-22-33",
      source: "Калькулятор товара — Кассетный стеллаж под погрузчик",
      sourceKind: "product",
      sourceTitle: "Кассетный стеллаж под погрузчик",
      sourceUrl:
        "https://example.com/catalog/manual-sheet-metal/forklift-cassette-rack",
      recommendationTitle: "Кассетный стеллаж под погрузчик"
    });

    expect(message).toContain("Страница товара");
    expect(message).toContain("Кассетный стеллаж под погрузчик");
    expect(message).toContain(
      "https://example.com/catalog/manual-sheet-metal/forklift-cassette-rack"
    );
  });

  it("escapes untrusted text before rendering Telegram HTML", () => {
    const message = buildTelegramMessage({
      leadType: "contact",
      name: '<b title="x">Иван</b>',
      phone: "+7 999 111-22-33",
      comment: "Цена < 1 & скидка 'срочно'"
    });

    expect(message).not.toContain('<b title="x">');
    expect(message).toContain("&lt;b title=&quot;x&quot;&gt;Иван&lt;/b&gt;");
    expect(message).toContain("Цена &lt; 1 &amp; скидка &#39;срочно&#39;");
  });
});

describe("Bitrix24 lead payload", () => {
  it("keeps Bitrix24 delivery disabled until explicitly enabled", () => {
    expect(getBitrix24RuntimeConfig({ BITRIX24_WEBHOOK_URL: "https://example.bitrix24.ru/rest/1/token/" })).toEqual({
      enabled: false,
      webhookUrlConfigured: true
    });
    expect(
      getBitrix24RuntimeConfig({
        BITRIX24_ENABLED: "true",
        BITRIX24_WEBHOOK_URL: "https://example.bitrix24.ru/rest/1/token/"
      })
    ).toEqual({
      enabled: true,
      webhookUrlConfigured: true
    });
  });

  it("normalizes base Bitrix24 webhook URL to deal add method", () => {
    expect(resolveBitrix24WebhookUrl("https://example.bitrix24.ru/rest/1/token/")).toBe(
      "https://example.bitrix24.ru/rest/1/token/crm.deal.add.json"
    );
    expect(resolveBitrix24WebhookUrl("https://example.bitrix24.ru/rest/1/token/crm.deal.add.json")).toBe(
      "https://example.bitrix24.ru/rest/1/token/crm.deal.add.json"
    );
  });

  it("rejects unsafe or unrelated Bitrix24 webhook targets", () => {
    expect(
      resolveBitrix24WebhookUrl("http://example.bitrix24.ru/rest/1/token/")
    ).toBeUndefined();
    expect(
      resolveBitrix24WebhookUrl("https://127.0.0.1/rest/1/token/")
    ).toBeUndefined();
    expect(
      resolveBitrix24WebhookUrl(
        "https://example.bitrix24.ru/rest/1/token/crm.contact.list.json"
      )
    ).toBeUndefined();
    expect(resolveBitrix24WebhookUrl("file:///etc/passwd")).toBeUndefined();
    expect(
      getBitrix24RuntimeConfig({
        BITRIX24_ENABLED: "true",
        BITRIX24_WEBHOOK_URL: "http://localhost/rest/1/token/"
      })
    ).toEqual({
      enabled: false,
      webhookUrlConfigured: false
    });
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

describe("CMS lead records", () => {
  it("stores delivery status and calculator context for admin inbox", () => {
    const calculatorInput = normalizeCalculatorInput({
      systemId: "auto-sheet-metal",
      heightMm: 70,
      widthMm: 1600,
      lengthMm: 3100,
      loadKg: 2000,
      shelfCount: 20,
      towerCount: 1,
      optionIds: ["scale"]
    });
    const result = calculateStorageSystem(calculatorInput);

    const record = buildCmsLeadRecord({
      leadType: "configurator",
      name: "Иван",
      phone: "+7 999 111-22-33",
      email: "ivan@example.com",
      city: "Москва",
      comment: "Нужен монтаж",
      sourceTitle: "Калькулятор",
      sourceUrl: "https://example.com/#calculator",
      utm: { utm_source: "yandex" },
      calculatorInput,
      result,
      selectedOptions: ["Весы на распалетчик"],
      fromPrice: result.fromPrice,
      emailDelivered: true,
      telegramDelivered: true,
      bitrix24Delivered: false,
      deliveryErrors: ["bitrix24-http-401"]
    });

    expect(record.title).toContain("Заявка с конфигуратора");
    expect(record.status).toBe("new");
    expect(record.emailDelivered).toBe(true);
    expect(record.telegramDelivered).toBe(true);
    expect(record.bitrix24Delivered).toBe(false);
    expect(record.deliveryErrors).toBe("bitrix24-http-401");
    expect(record.calculatorSummary).toContain("Габариты");
    expect(record.utm).toEqual({ utm_source: "yandex" });
  });
});

describe("Email lead delivery", () => {
  it("formats lead email for info mailbox and Bitrix mail intake", () => {
    const message = buildLeadEmailMessage({
      leadType: "contact",
      name: "Анна",
      phone: "+7 999 111-22-33",
      email: "anna@example.com",
      city: "Казань",
      comment: "Перезвонить завтра",
      sourceTitle: "Контакты",
      sourceUrl: "https://example.com/#contacts",
      utm: { utm_source: "yandex" },
      emailDelivered: false,
      telegramDelivered: false,
      bitrix24Delivered: false
    });

    expect(message.subject).toBe("Заявка с сайта: Контакты");
    expect(message.text).toContain("+7 999 111-22-33");
    expect(message.text).toContain("Перезвонить завтра");
    expect(message.text).toContain("utm_source: yandex");
    expect(message.html).toContain("anna@example.com");
  });

  it("uses info mailbox as default lead recipient", () => {
    const config = leadEmailConfigFromEnv({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "465",
      SMTP_SECURE: "true",
      SMTP_USER: "robot@example.com",
      SMTP_PASSWORD: "secret"
    });

    expect(config.to).toBe("info@kbparus.ru");
    expect(config.from).toBe("robot@example.com");
    expect(config.secure).toBe(true);
  });

  it("removes line breaks from the email subject", () => {
    const message = buildLeadEmailMessage({
      leadType: "contact",
      name: "",
      phone: "+7 999 111-22-33",
      sourceTitle: "Контакты\r\nBcc: attacker@example.com",
      emailDelivered: false,
      telegramDelivered: false,
      bitrix24Delivered: false
    });

    expect(message.subject).toBe(
      "Заявка с сайта: Контакты Bcc: attacker@example.com"
    );
    expect(message.subject).not.toMatch(/[\r\n]/);
  });
});
