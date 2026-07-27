import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const [command, ...args] = process.argv.slice(2);
const allowedCommands = new Set([
  "migrate",
  "migrate:create",
  "migrate:status"
]);

if (!command || !allowedCommands.has(command)) {
  throw new Error(
    `Разрешены только безопасные команды: ${[...allowedCommands].join(", ")}`
  );
}

const result = spawnSync(
  process.execPath,
  [resolve("node_modules/payload/bin.js"), command, ...args],
  {
    env: {
      ...process.env,
      PAYLOAD_MIGRATING: "true"
    },
    stdio: "inherit"
  }
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
