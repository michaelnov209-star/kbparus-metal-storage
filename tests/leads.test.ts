import { describe, expect, it } from "vitest";
import { normalizeCalculatorInput } from "@/lib/calculator";
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
