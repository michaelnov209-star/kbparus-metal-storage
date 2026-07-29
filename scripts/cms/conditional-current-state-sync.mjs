#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const enabled = process.env.RUN_CURRENT_STATE_SYNC === "true";

if (!enabled) {
  console.log("[cms-current-state] Controlled build sync is disabled.");
  process.exit(0);
}

if (
  process.env.CURRENT_STATE_SYNC_CONFIRMATION !== "APPLY_CURRENT_STATE_SYNC"
) {
  console.error(
    "[cms-current-state] Refusing to write without CURRENT_STATE_SYNC_CONFIRMATION=APPLY_CURRENT_STATE_SYNC."
  );
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "scripts/cms/sync-current-state.ts",
    "--apply"
  ],
  {
    env: process.env,
    stdio: "inherit"
  }
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
