import { expect, test } from "@playwright/test";

test("быстрый вход корректен на mobile, tablet и desktop", async ({
  page
}, testInfo) => {
  await page.route("**/api/users/me?*", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ user: null })
    })
  );

  const response = await page.goto("/admin/login", {
    waitUntil: "domcontentloaded"
  });

  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: "Вход в панель управления" })
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.locator("#admin-password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти" })).toBeEnabled();

  const viewportWidth = testInfo.project.use.viewport?.width ?? 1280;
  const layout = await page.evaluate(() => {
    const showcase = document.querySelector<HTMLElement>(".kb-auth-showcase");
    const mobileBrand = document.querySelector<HTMLElement>(
      ".kb-auth-brand--mobile"
    );
    const controls = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".kb-auth-field input, .kb-auth-password__toggle, .kb-auth-submit"
      )
    );

    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      showcaseDisplay: showcase ? getComputedStyle(showcase).display : null,
      mobileBrandDisplay: mobileBrand
        ? getComputedStyle(mobileBrand).display
        : null,
      minimumControlHeight: Math.min(
        ...controls.map((control) => control.getBoundingClientRect().height)
      )
    };
  });

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth);
  expect(layout.minimumControlHeight).toBeGreaterThanOrEqual(44);

  if (viewportWidth <= 760) {
    expect(layout.showcaseDisplay).toBe("none");
    expect(layout.mobileBrandDisplay).toBe("flex");
  } else {
    expect(layout.showcaseDisplay).not.toBe("none");
  }
});
