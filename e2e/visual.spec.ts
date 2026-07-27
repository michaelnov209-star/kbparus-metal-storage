import path from "node:path";
import { expect, test } from "@playwright/test";
import { openPublicPage } from "./helpers";

const screenshotStyles = path.join(import.meta.dirname, "screenshot.css");

test("ключевые зоны главной не меняют компоновку", async ({ page }) => {
  await openPublicPage(page, "/");

  await expect(page.locator(".line-hero-content")).toHaveScreenshot(
    "home-hero-content.png",
    { stylePath: screenshotStyles }
  );

  await page.locator("#catalog").scrollIntoViewIfNeeded();
  await expect(page.locator("#catalog .catalog-summary")).toHaveScreenshot(
    "home-catalog-summary.png",
    { stylePath: screenshotStyles }
  );

  await page.locator("#request").scrollIntoViewIfNeeded();
  await expect(page.locator("#request form")).toHaveScreenshot(
    "home-lead-form.png",
    { stylePath: screenshotStyles }
  );
});
