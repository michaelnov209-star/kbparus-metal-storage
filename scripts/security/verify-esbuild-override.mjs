import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const projectRoot = process.cwd();
const lockfilePath = path.join(projectRoot, "package-lock.json");
const vulnerableEsbuildPath =
  "node_modules/@esbuild-kit/core-utils/node_modules/esbuild";

const lockfile = JSON.parse(await readFile(lockfilePath, "utf8"));
const installedEsbuild = lockfile.packages?.[vulnerableEsbuildPath];

assert.ok(
  installedEsbuild,
  "Не найдена контролируемая вложенная копия esbuild. Проверьте Payload/Drizzle и удалите устаревший override, если цепочка исчезла.",
);
assert.equal(
  installedEsbuild.version,
  "0.25.12",
  `Ожидался безопасный esbuild 0.25.12, установлен ${installedEsbuild.version ?? "неизвестно"}.`,
);

const coreUtils = require("@esbuild-kit/core-utils");
const source = "const storageLoad: number = 2000; export default storageLoad;";
const filename = "security-esbuild-contract.ts";

const syncResult = coreUtils.transformSync(source, filename, { format: "esm" });
const asyncResult = await coreUtils.transform(source, filename, { format: "esm" });

for (const [mode, result] of [
  ["sync", syncResult],
  ["async", asyncResult],
]) {
  assert.equal(typeof result?.code, "string", `${mode}: esbuild не вернул код.`);
  assert.match(result.code, /storageLoad/, `${mode}: потеряно имя переменной.`);
  assert.doesNotMatch(result.code, /: number/, `${mode}: TypeScript не преобразован.`);
}

console.log(
  "Security contract OK: @esbuild-kit/core-utils работает с esbuild 0.25.12; уязвимая версия 0.18.20 отсутствует.",
);
