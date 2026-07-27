import { test } from "@playwright/test";
import {
  CATEGORY_PATH,
  PRODUCT_PATH,
  expectNoSeriousA11yViolations,
  openPublicPage
} from "./helpers";

for (const { name, path } of [
  { name: "главная", path: "/" },
  { name: "категория", path: CATEGORY_PATH },
  { name: "товар", path: PRODUCT_PATH }
]) {
  test(`${name}: нет serious/critical WCAG 2.1 AA нарушений`, async ({
    page
  }) => {
    await openPublicPage(page, path);
    await expectNoSeriousA11yViolations(page, "main");
  });
}
