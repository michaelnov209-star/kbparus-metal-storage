import { defineConfig } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim();
const baseURL = externalBaseUrl || "http://localhost:3210";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "output/playwright/results",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : 3,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.025
    }
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "output/playwright/report", open: "never" }],
    ["junit", { outputFile: "output/playwright/junit.xml" }]
  ],
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{projectName}/{testFileName}/{arg}{ext}",
  use: {
    baseURL,
    browserName: "chromium",
    colorScheme: "light",
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
    contextOptions: {
      reducedMotion: "reduce"
    },
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "mobile-390",
      use: {
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true
      }
    },
    {
      name: "tablet-768",
      use: {
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        isMobile: true
      }
    },
    {
      name: "desktop-1280",
      use: {
        viewport: { width: 1280, height: 900 },
        hasTouch: false,
        isMobile: false
      }
    }
  ]
});
