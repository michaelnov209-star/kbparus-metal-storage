#!/usr/bin/env node
/**
 * Платформенно-aware генератор Payload importMap.
 *
 * - Linux/Mac (Vercel build container): запускает `payload generate:importmap`,
 *   который перезаписывает importMap.ts свежим содержимым из payload.config.
 * - Windows native: пропускает генерацию (tsx ESM-loader падает на путях
 *   с пробелами + Node 24). Использует ручной importMap.ts как fallback.
 *
 * Build не валится на Windows-skip — это нормальный fallback path.
 * Build ВАЛИТСЯ если на Linux CLI вернул ошибку.
 */

import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";

if (isWindows) {
  console.log("⚠ Windows detected — пропускаю payload generate:importmap.");
  console.log("  CLI tsx-loader несовместим с Node 24 + путём проекта 'New project 2'.");
  console.log("  Используется ручной app/(payload)/admin/importMap.ts (см. cms:check).");
  console.log("  Чтобы обновить importMap при изменении плагинов — ");
  console.log("  запусти на Linux/Mac/WSL: npm run cms:generate-importmap");
  process.exit(0);
}

console.log("→ Запускаю payload generate:importmap...");

const child = spawn("npx", ["payload", "generate:importmap"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NODE_OPTIONS: "--no-deprecation" }
});

child.on("exit", (code) => {
  if (code !== 0) {
    console.error(`✗ payload generate:importmap завершился с кодом ${code}`);
    console.error("  Build остановлен. Проверь конфигурацию Payload.");
    process.exit(code ?? 1);
  }
  console.log("✓ importMap сгенерирован успешно");
  process.exit(0);
});

child.on("error", (err) => {
  console.error("✗ Не удалось запустить payload CLI:", err.message);
  process.exit(1);
});
