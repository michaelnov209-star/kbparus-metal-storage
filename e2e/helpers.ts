import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const CATEGORY_PATH = "/catalog/auto-sheet-metal";
export const PRODUCT_PATH =
  "/catalog/auto-sheet-metal/compact-3000x1500";
export const CONFIGURATOR_PRODUCT_PATH =
  "/catalog/manual-sheet-metal/forklift-cassette-rack";

export async function openPublicPage(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });

  expect(response, `Маршрут ${path} не вернул HTTP-ответ`).not.toBeNull();
  expect(response?.status(), `Маршрут ${path} вернул ошибку`).toBeLessThan(400);
  await expect(page.locator("main")).toBeVisible();

  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);

    for (const video of document.querySelectorAll("video")) {
      video.pause();
      video.currentTime = 0;
    }
  });

  return response;
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    outliers: Array.from(document.body.querySelectorAll<HTMLElement>("*"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          selector: [
            element.tagName.toLowerCase(),
            element.id ? `#${element.id}` : "",
            ...Array.from(element.classList)
              .slice(0, 3)
              .map((name) => `.${name}`)
          ].join(""),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        };
      })
      .filter(
        ({ left, right, width }) =>
          width > 0 && (left < -1 || right > document.documentElement.clientWidth + 1)
      )
      .sort((a, b) => Math.max(b.right - innerWidth, -b.left) - Math.max(a.right - innerWidth, -a.left))
      .slice(0, 12)
  }));

  expect(
    overflow.scrollWidth,
    `Горизонтальный overflow: ${JSON.stringify(overflow)}`
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

export async function expectNoSeriousA11yViolations(
  page: Page,
  include: string
) {
  const result = await new AxeBuilder({ page })
    .include(include)
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  const blocking = result.violations
    .filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious"
    )
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map((node) => node.target.join(" "))
    }));

  expect(
    blocking,
    `Критические нарушения доступности:\n${JSON.stringify(blocking, null, 2)}`
  ).toEqual([]);
}
