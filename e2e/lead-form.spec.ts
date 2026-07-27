import { expect, test } from "@playwright/test";
import { openPublicPage } from "./helpers";

test("форма отправляет одну заявку через перехваченный API", async ({ page }) => {
  let submittedPayload: Record<string, unknown> | undefined;
  let requests = 0;

  await page.route("**/api/leads", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    requests += 1;
    submittedPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true })
    });
  });

  await openPublicPage(page, "/#request");
  const form = page.locator("#request form");
  await expect(form).toBeVisible();

  await form.locator('input[name="name"]').fill("Автотест");
  await form.locator('input[name="phone"]').fill("+7 999 000-00-00");
  await form.locator('input[type="checkbox"]').check();
  await form.locator('button[type="submit"]').click();

  await expect(form.locator(".line-form-status")).toContainText(
    "Заявка отправлена"
  );
  expect(requests).toBe(1);
  expect(submittedPayload).toMatchObject({
    leadType: expect.any(String),
    contact: {
      name: "Автотест",
      phone: "+7 999 000-00-00"
    }
  });
});
