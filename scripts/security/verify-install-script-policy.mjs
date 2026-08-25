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

const reviewedPolicy = new Map([
  ["esbuild@0.25.12", true],
  ["esbuild@0.28.2", true],
  ["fsevents@2.3.2", false],
  ["fsevents@2.3.3", false],
]);

const allowScripts = packageJson.allowScripts;
assert.ok(
  allowScripts && typeof allowScripts === "object" && !Array.isArray(allowScripts),
  "В package.json отсутствует объект allowScripts.",
);

const policyEntries = Object.entries(allowScripts)
  .map(([identity, approved]) => [identity, approved])
  .sort();

assert.deepEqual(
  policyEntries,
  [...reviewedPolicy.entries()].sort(),
  "Политика install-скриптов изменилась без обновления security policy.",
);

for (const [identity, approved] of Object.entries(allowScripts)) {
  assert.ok(
    typeof approved === "boolean",
    `Политика ${identity} должна быть явным разрешением true или запретом false.`,
  );
  assert.match(
    identity,
    /@\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/,
    `Разрешение ${identity} не закреплено на точной версии.`,
  );
}

function packageNameFromLockPath(lockPath) {
  const match = lockPath.match(/node_modules\/((?:@[^/]+\/)?[^/]+)$/);
  return match?.[1] ?? null;
}

const lockedInstallScripts = new Set();

for (const [lockPath, metadata] of Object.entries(lockfile.packages ?? {})) {
  if (!metadata?.hasInstallScript) continue;

  const packageName = packageNameFromLockPath(lockPath);
  assert.ok(packageName, `Не удалось определить пакет для ${lockPath}.`);
  assert.equal(
    typeof metadata.version,
    "string",
    `У ${lockPath} отсутствует зафиксированная версия.`,
  );

  lockedInstallScripts.add(`${packageName}@${metadata.version}`);
}

assert.deepEqual(
  [...lockedInstallScripts].sort(),
  [...reviewedPolicy.keys()].sort(),
  "В lock-файле изменился набор install-скриптов. Требуется ручная проверка.",
);

console.log(
  `Install-script policy OK: разрешены ${[...reviewedPolicy.entries()]
    .filter(([, allowed]) => allowed)
    .map(([identity]) => identity)
    .sort()
    .join(", ")}; запрещены ${[...reviewedPolicy.entries()]
    .filter(([, allowed]) => !allowed)
    .map(([identity]) => identity)
    .sort()
    .join(", ")}.`,
);
