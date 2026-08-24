import { expect, test, type Page } from "@playwright/test";
import {
  CONFIGURATOR_PRODUCT_PATH,
  dismissAnalyticsPrompt,
  expectNoHorizontalOverflow,
  openPublicPage
} from "./helpers";

async function interceptLead(page: Page) {
  let payload: Record<string, unknown> | undefined;
  let requests = 0;

  await page.route("**/api/leads", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    requests += 1;
    payload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true })
    });
  });

  return {
    getPayload: () => payload,
    getRequests: () => requests
  };
}

async function expectPriceOnOneLine(price: ReturnType<Page["locator"]>) {
  const linePositions = await price
    .locator(":scope > span")
    .evaluateAll((parts) =>
      parts.map((part) => Math.round(part.getBoundingClientRect().top))
    );

  expect(linePositions).toHaveLength(3);
  expect(new Set(linePositions).size).toBe(1);
  await expect(price.locator(":scope > span").last()).toHaveText("₽");
}

async function expectPageWheelScrollsOverSummary(page: Page) {
  const summary = page.getByTestId("calculator-desktop-summary");
  await expect(summary).toBeVisible();
  await summary.scrollIntoViewIfNeeded();

  const box = await summary.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);

  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 520);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(before + 100);
}

const calculatorProductPaths = [
  "/catalog/auto-sheet-metal/compact-3000x1500",
  "/catalog/manual-sheet-metal/forklift-cassette-rack",
  "/catalog/manual-sheet-metal/rollout-cassette-rack",
  "/catalog/manual-sheet-metal/hybrid-rollout-rack",
  "/catalog/manual-sheet-metal/two-side-rollout-rack",
  "/catalog/sort-and-pipe-storage/automated-long-goods-tower"
] as const;

test("главный калькулятор меняет расчет и отправляет конфигурацию", async ({
  page
}) => {
  const lead = await interceptLead(page);
  await openPublicPage(page, "/#calculator");
  await dismissAnalyticsPrompt(page);

  const calculator = page.getByTestId("calculator");
  await expect(calculator).toBeVisible();
  const price = calculator.getByTestId("calculator-price");
  const visibleSummaryPrice = calculator
    .getByTestId("calculator-summary-price")
    .locator(":scope > span");
  const initialPrice = await price.textContent();

  await expectPriceOnOneLine(visibleSummaryPrice);

  await calculator
    .getByRole("button", { name: "Параметры", exact: true })
    .click();
  const lengthGroup = calculator.getByRole("group", { name: "Длина" });
  await lengthGroup.locator('button[aria-pressed="false"]').last().click();
  await expect(price).not.toHaveText(initialPrice ?? "");
  await expectPriceOnOneLine(visibleSummaryPrice);

  await calculator
    .getByRole("button", { name: "Расчёт", exact: true })
    .click();
  await calculator.getByTestId("calculator-name").fill("Автотест");
  await calculator.getByTestId("calculator-phone").fill("+7 999 000-00-01");
  await calculator.getByTestId("calculator-submit").click();
  expect(lead.getRequests()).toBe(0);
  await expect(calculator.getByTestId("calculator-consent")).toBeFocused();
  await calculator.getByTestId("calculator-consent").check();
  await calculator.getByTestId("calculator-submit").click();

  await expect(calculator.getByTestId("calculator-status")).toContainText(
    "Заявка сформирована"
  );
  expect(lead.getRequests()).toBe(1);
  expect(lead.getPayload()).toMatchObject({
    leadType: "configurator",
    contact: { name: "Автотест", phone: "+7 999 000-00-01" },
    calculatorInput: expect.any(Object),
    recommendedConfig: expect.any(Object)
  });
});

test("товарный калькулятор использует полный сценарий и передает страницу товара", async ({
  page
}) => {
  const lead = await interceptLead(page);
  await openPublicPage(page, CONFIGURATOR_PRODUCT_PATH);
  await dismissAnalyticsPrompt(page);

  const configurator = page.getByTestId("product-configurator");
  await expect(configurator).toBeVisible();
  const calculator = configurator.getByTestId("calculator");
  const price = calculator
    .getByTestId("calculator-summary-price")
    .locator(":scope > span");
  const initialPrice = await price.textContent();

  await expectPriceOnOneLine(price);
  await expect(
    calculator.getByRole("button", { name: "Параметры", exact: true })
  ).toHaveAttribute("aria-current", "step");
  await expect(
    calculator.getByText("Выбрать точный тип системы", { exact: true })
  ).toHaveCount(0);

  await expect(calculator.getByText("Условия объекта", { exact: true })).toBeVisible();
  await calculator
    .getByRole("group", { name: "Длина" })
    .locator('button[aria-pressed="false"]')
    .last()
    .click();
  await expect(price).not.toHaveText(initialPrice ?? "");
  await expectPriceOnOneLine(price);

  await calculator
    .getByRole("button", { name: "Расчёт", exact: true })
    .click();
  await expect(calculator.getByRole("button", { name: "Хочу скидку" })).toBeVisible();
  await calculator.getByTestId("calculator-name").fill("Автотест");
  await calculator.getByTestId("calculator-phone").fill("+7 999 000-00-02");
  await calculator.getByTestId("calculator-consent").check();
  await calculator.getByTestId("calculator-submit").click();

  await expect(calculator.getByTestId("calculator-status")).toContainText(
    "Заявка сформирована"
  );
  expect(lead.getRequests()).toBe(1);
  expect(lead.getPayload()).toMatchObject({
    leadType: "configurator",
    contact: { name: "Автотест", phone: "+7 999 000-00-02" },
    source: expect.stringContaining("Калькулятор товара"),
    sourceTitle: "Кассетный стеллаж под погрузчик",
    sourceUrl: expect.stringContaining(CONFIGURATOR_PRODUCT_PATH),
    calculatorInput: expect.any(Object),
    recommendedConfig: {
      title: "Кассетный стеллаж под погрузчик"
    }
  });
});

test("колесо мыши над правой сводкой прокручивает страницу", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280");
  await page.route("**/api/leads", (route) => route.abort("blockedbyclient"));
  await page.setViewportSize({ width: 1600, height: 900 });

  for (const path of ["/#calculator", CONFIGURATOR_PRODUCT_PATH]) {
    await openPublicPage(page, path);
    await dismissAnalyticsPrompt(page);
    await expectPageWheelScrollsOverSummary(page);
  }
});

test("все товарные калькуляторы используют единую визуальную систему", async ({
  page
}) => {
  await page.route("**/api/leads", (route) => route.abort("blockedbyclient"));

  for (const path of calculatorProductPaths) {
    await openPublicPage(page, path);
    await dismissAnalyticsPrompt(page);

    const configurator = page.getByTestId("product-configurator");
    const calculator = configurator.getByTestId("calculator");
    const primaryAction = calculator.getByTestId("calculator-next");

    await expect(configurator, `Нет калькулятора на ${path}`).toBeVisible();
    await expect(
      calculator.getByRole("button", { name: "Назад" }),
      `На первом шаге ${path} показана неактивная кнопка «Назад»`
    ).toHaveCount(0);
    await expect(
      calculator.getByRole("button", { name: "Параметры", exact: true })
    ).toHaveAttribute("aria-current", "step");
    await expect(primaryAction).toHaveCSS(
      "background-color",
      "rgb(252, 84, 19)"
    );
    await expectNoHorizontalOverflow(page);

    const specification = calculator.getByTestId(
      "calculator-live-specification"
    );
    const cards = specification.locator(":scope > div");
    const widths = await cards.evaluateAll((items) =>
      items.map((item) => Math.round(item.getBoundingClientRect().width))
    );
    const valueFontSizes = await cards.locator(":scope > strong").evaluateAll(
      (items) => items.map((item) => Number.parseFloat(getComputedStyle(item).fontSize))
    );
    const priceParts = cards
      .last()
      .locator(":scope > strong > span > span");
    const pricePartFontSizes = await priceParts.evaluateAll((items) =>
      items.map((item) => Number.parseFloat(getComputedStyle(item).fontSize))
    );

    expect(
      Math.max(...widths) - Math.min(...widths),
      `Сводные карточки имеют разную ширину на ${path}: ${widths.join(", ")}`
    ).toBeLessThanOrEqual(2);
    expect(new Set(valueFontSizes).size).toBe(1);
    expect(pricePartFontSizes).toEqual([
      valueFontSizes.at(-1),
      valueFontSizes.at(-1),
      valueFontSizes.at(-1)
    ]);
    await expectPriceOnOneLine(
      calculator
        .getByTestId("calculator-summary-price")
        .locator(":scope > span")
    );

    const order = await page.evaluate(() => {
      const configuratorElement = document.querySelector(
        '[data-testid="product-configurator"]'
      );
      const detailsElement = document.querySelector(
        '[data-testid="product-details"]'
      );

      return configuratorElement && detailsElement
        ? configuratorElement.compareDocumentPosition(detailsElement)
        : 0;
    });

    expect(
      Boolean(order & 4),
      `Характеристики должны находиться ниже калькулятора на ${path}`
    ).toBe(true);
  }
});

test("товарные профили ограничивают башни и показывают проверенные опции", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280");
  await page.route("**/api/leads", (route) => route.abort("blockedbyclient"));

  const towerRules = [
    ["/catalog/auto-sheet-metal/compact-3000x1500", 1],
    ["/catalog/auto-sheet-metal/logic-sheet-metal-storage", 1],
    ["/catalog/auto-sheet-metal/spider-sheet-metal-storage", 5],
    ["/catalog/auto-sheet-metal/cross-sheet-metal-storage", 5]
  ] as const;

  for (const [path, expectedTowerChoices] of towerRules) {
    await openPublicPage(page, path);
    await dismissAnalyticsPrompt(page);

    const calculator = page.getByTestId("calculator");
    const towers = calculator.getByRole("group", { name: "Кол-во башен" });
    await expect(towers.locator(":scope > button")).toHaveCount(
      expectedTowerChoices
    );
  }

  await openPublicPage(page, "/catalog/auto-sheet-metal/compact-3000x1500");
  await dismissAnalyticsPrompt(page);
  const optionImages = page
    .getByTestId("calculator")
    .locator('img[src*="/assets/images/calculator/options/"]');
  await expect(optionImages).toHaveCount(5);

  const imageStatus = await optionImages.evaluateAll((images) =>
    images.map((image) => ({
      complete: (image as HTMLImageElement).complete,
      height: (image as HTMLImageElement).naturalHeight,
      width: (image as HTMLImageElement).naturalWidth
    }))
  );
  expect(
    imageStatus.every(
      (image) => image.complete && image.width > 0 && image.height > 0
    )
  ).toBe(true);
});

test("мобильный итог появляется только рядом с калькулятором", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  await page.route("**/api/leads", (route) => route.abort("blockedbyclient"));
  await openPublicPage(page, "/");
  await dismissAnalyticsPrompt(page);

  const mobileBar = page.getByTestId("calculator-mobile-bar");
  await expect(mobileBar).toHaveCount(0);

  await page.getByTestId("calculator").scrollIntoViewIfNeeded();
  await expect(mobileBar).toBeVisible();

  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(mobileBar).toHaveCount(0);
});
