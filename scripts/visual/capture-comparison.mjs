import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const [, , labelArg = "capture", baseUrlArg = "https://kbparus-metal-storage.vercel.app", outputArg] = process.argv;
const label = labelArg.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
const baseUrl = baseUrlArg.replace(/\/+$/, "");
const outputDirectory =
  outputArg ||
  path.join(process.env.USERPROFILE || process.cwd(), "Pictures", "Screenshots");

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const analyticsChoice = JSON.stringify({
  analytics: false,
  version: "2026-07-27",
  updatedAt: new Date().toISOString()
});

const scenarios = [
  { name: "desktop-home", viewport: { width: 1440, height: 1000 }, path: "/", target: "top" },
  { name: "desktop-calculator", viewport: { width: 1440, height: 1000 }, path: "/#calculator", target: "#calculator" },
  { name: "mobile-home", viewport: { width: 390, height: 844 }, path: "/", target: "top", mobile: true },
  { name: "mobile-calculator", viewport: { width: 390, height: 844 }, path: "/#calculator", target: "#calculator", mobile: true },
  { name: "desktop-admin-login", viewport: { width: 1440, height: 1000 }, path: "/admin/login", target: "top" }
];

const saved = [];

try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: scenario.viewport,
      deviceScaleFactor: 1,
      isMobile: scenario.mobile ?? false,
      locale: "ru-RU",
      reducedMotion: "reduce"
    });
    await context.addInitScript((storedChoice) => {
      window.localStorage.setItem("kbparus:analytics-consent", storedChoice);
    }, analyticsChoice);

    const page = await context.newPage();
    await page.goto(`${baseUrl}${scenario.path}`, {
      waitUntil: "networkidle",
      timeout: 45_000
    });
    await page.emulateMedia({ reducedMotion: "reduce" });

    if (scenario.target !== "top") {
      const target = page.locator(scenario.target).first();
      await target.waitFor({ state: "visible", timeout: 20_000 });
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }

    const outputPath = path.join(
      outputDirectory,
      `kbparus-metal-storage-${label}-${scenario.name}.png`
    );
    await page.screenshot({
      path: outputPath,
      fullPage: false,
      animations: "disabled"
    });
    saved.push(outputPath);
    await context.close();
  }
} finally {
  await browser.close();
}

for (const filePath of saved) {
  console.log(filePath);
}
