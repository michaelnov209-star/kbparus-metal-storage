import { expect, test } from "@playwright/test";
import {
  CATEGORY_PATH,
  PRODUCT_PATH,
  expectNoHorizontalOverflow,
  openPublicPage
} from "./helpers";

test.describe("публичные маршруты", () => {
  test("главная, категория и товар открываются без горизонтального overflow", async ({
    page
  }) => {
    await openPublicPage(page, "/");
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator(".catalog-card").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const firstCategoryImage = page.locator(".catalog-card img").first();
    await firstCategoryImage.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        firstCategoryImage.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0
        )
      )
      .toBe(true);
    await expect(firstCategoryImage).toHaveAttribute(
      "src",
      /\/assets\/images\/catalog\/optimized\//
    );

    await openPublicPage(page, CATEGORY_PATH);
    await expect(page.locator(".catalog-detail-hero h1")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await openPublicPage(page, PRODUCT_PATH);
    await expect(page.locator(".product-title-strip h1")).toBeVisible();
    await expect(page.locator(".product-hero")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("адаптивная навигация доступна с клавиатуры и касания", async ({
    page
  }, testInfo) => {
    await openPublicPage(page, "/");
    const viewportWidth = testInfo.project.use.viewport?.width ?? 1280;
    const menuButton = page.getByRole("button", { name: "Открыть меню" });
    const desktopNavigation = page.getByRole("navigation", {
      name: "Навигация по сайту"
    });

    if (viewportWidth < 1180) {
      await expect(menuButton).toBeVisible();
      const box = await menuButton.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);

      await menuButton.click();
      const dialog = page.getByRole("dialog", { name: "Меню сайта" });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("navigation", { name: "Мобильная навигация" })
      ).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(menuButton).toBeFocused();
    } else {
      await expect(menuButton).toBeHidden();
      await expect(desktopNavigation).toBeVisible();
    }
  });
});
