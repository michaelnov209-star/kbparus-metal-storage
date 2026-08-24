#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const enabled = process.env.RUN_PRODUCT_CALCULATOR_BINDING_SYNC === "true";

if (!enabled) {
  console.log("[cms-product-calculators] Controlled binding sync is disabled.");
  process.exit(0);
}

if (
  process.env.PRODUCT_CALCULATOR_BINDING_SYNC_CONFIRMATION !==
  "APPLY_PRODUCT_CALCULATOR_BINDINGS"
) {
  console.error(
    "[cms-product-calculators] Refusing to write without PRODUCT_CALCULATOR_BINDING_SYNC_CONFIRMATION=APPLY_PRODUCT_CALCULATOR_BINDINGS."
  );
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "scripts/cms/sync-product-calculator-bindings.ts",
    "--apply"
  ],
  {
    env: process.env,
    stdio: "inherit"
  }
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
