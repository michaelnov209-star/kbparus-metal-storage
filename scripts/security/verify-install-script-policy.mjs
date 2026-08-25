import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const packageJson = JSON.parse(
  await readFile(path.join(projectRoot, "package.json"), "utf8"),
);
const lockfile = JSON.parse(
  await readFile(path.join(projectRoot, "package-lock.json"), "utf8"),
);

const reviewedApprovals = new Set([
  "esbuild@0.25.12",
  "esbuild@0.28.2",
]);

const allowScripts = packageJson.allowScripts;
assert.ok(
  allowScripts && typeof allowScripts === "object" && !Array.isArray(allowScripts),
  "В package.json отсутствует объект allowScripts.",
);

const approvedEntries = Object.entries(allowScripts)
  .filter(([, approved]) => approved === true)
  .map(([identity]) => identity)
  .sort();

assert.deepEqual(
  approvedEntries,
  [...reviewedApprovals].sort(),
  "Список разрешённых install-скриптов изменился без обновления security policy.",
);

for (const [identity, approved] of Object.entries(allowScripts)) {
  assert.equal(
    approved,
    true,
    `Политика ${identity} должна быть явным разрешением true либо удалена.`,
  );
  assert.match(
    identity,
    /@\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/,
    `Разрешение ${identity} не закреплено на точной версии.`,
  );
}

function matchesTarget(values, target) {
  if (!Array.isArray(values) || values.length === 0) return true;
  if (values.includes(`!${target}`)) return false;

  const positiveValues = values.filter((value) => !value.startsWith("!"));
  return positiveValues.length === 0 || positiveValues.includes(target);
}

function packageNameFromLockPath(lockPath) {
  const match = lockPath.match(/node_modules\/((?:@[^/]+\/)?[^/]+)$/);
  return match?.[1] ?? null;
}

const vercelInstallScripts = new Set();

for (const [lockPath, metadata] of Object.entries(lockfile.packages ?? {})) {
  if (!metadata?.hasInstallScript) continue;
  if (!matchesTarget(metadata.os, "linux")) continue;
  if (!matchesTarget(metadata.cpu, "x64")) continue;
  if (!matchesTarget(metadata.libc, "glibc")) continue;

  const packageName = packageNameFromLockPath(lockPath);
  assert.ok(packageName, `Не удалось определить пакет для ${lockPath}.`);
  assert.equal(
    typeof metadata.version,
    "string",
    `У ${lockPath} отсутствует зафиксированная версия.`,
  );

  vercelInstallScripts.add(`${packageName}@${metadata.version}`);
}

assert.deepEqual(
  [...vercelInstallScripts].sort(),
  [...reviewedApprovals].sort(),
  "В lock-файле изменился набор install-скриптов для Vercel. Требуется ручная проверка.",
);

console.log(
  `Install-script policy OK: разрешены только ${[...reviewedApprovals].sort().join(", ")}.`,
);
