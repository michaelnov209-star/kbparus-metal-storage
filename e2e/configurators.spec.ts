import { expect, test, type Page } from "@playwright/test";
import {
  CONFIGURATOR_PRODUCT_PATH,
  dismissAnalyticsPrompt,
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

test("товарный конфигуратор меняет цену и отправляет заявку", async ({
  page
}) => {
  const lead = await interceptLead(page);
  await openPublicPage(page, CONFIGURATOR_PRODUCT_PATH);
  await dismissAnalyticsPrompt(page);

  const configurator = page.getByTestId("product-configurator");
  await expect(configurator).toBeVisible();
  const price = configurator.locator(
    ".product-configurator-summary > .product-configurator-price"
  );
  const initialPrice = await price.textContent();

  await expectPriceOnOneLine(price);

  await configurator
    .locator(".product-chip-row")
    .first()
    .locator('button[aria-pressed="false"]')
    .last()
    .click();
  await expect(price).not.toHaveText(initialPrice ?? "");

  const priceAfterDimensions = await price.textContent();
  await configurator.locator('.product-option[aria-pressed="false"]').first().click();
  await expect(price).not.toHaveText(priceAfterDimensions ?? "");
  await expectPriceOnOneLine(price);

  await configurator.getByTestId("product-lead-name").fill("Автотест");
  await configurator
    .getByTestId("product-lead-phone")
    .fill("+7 999 000-00-02");
  await expect(configurator.getByTestId("product-lead-submit")).toBeDisabled();
  await configurator.getByTestId("product-lead-consent").check();
  await configurator.getByTestId("product-lead-submit").click();

  await expect(configurator.getByTestId("product-lead-status")).toContainText(
    "Заявка принята"
  );
  expect(lead.getRequests()).toBe(1);
  expect(lead.getPayload()).toMatchObject({
    leadType: "configurator",
    contact: { name: "Автотест", phone: "+7 999 000-00-02" },
    calculatorInput: expect.any(Object),
    recommendedConfig: expect.any(Object)
  });
});
