#!/usr/bin/env node
/**
 * Wrapper-обёртка для запуска scripts/cms/push-schema.ts через tsx.
 *
 * - Linux/Mac (Vercel): запускает .ts через tsx, push выполняется
 * - Windows native: пропускает (lazy push на первом запросе)
 * - Без DATABASE_URL: пропускает gracefully
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";

if (process.platform === "win32") {
  console.log("⚠ Windows native — пропускаю schema push.");
  console.log("  Schema будет push'нута на первом запросе к /admin (lazy).");
  process.exit(0);
}

if (
  !process.env.DATABASE_URL &&
  !process.env.POSTGRES_URL &&
  !process.env.DATABASE_URL_UNPOOLED &&
  !process.env.POSTGRES_URL_NON_POOLING
) {
  console.log("⚠ Нет DATABASE_URL — пропускаю schema push (build без БД).");
  process.exit(0);
}

const tsxBin = resolve("node_modules/tsx/dist/cli.mjs");

const child = spawn(process.execPath, [tsxBin, "scripts/cms/push-schema.ts"], {
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: "--no-deprecation" }
});

child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (err) => {
  console.error("✗ Не удалось запустить tsx:", err.message);
  process.exit(1);
});
