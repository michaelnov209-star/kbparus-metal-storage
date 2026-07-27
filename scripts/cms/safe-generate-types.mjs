#!/usr/bin/env node
/**
 * Generate Payload collection and global types before a production build.
 *
 * payload-types.ts is intentionally ignored because it is generated output.
 * Running the official CLI here keeps GitHub and local builds reproducible.
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";

console.log("-> Running payload generate:types...");

const payloadBin = resolve("node_modules/payload/bin.js");
const child = spawn(process.execPath, [payloadBin, "generate:types"], {
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: "--no-deprecation" }
});

child.on("exit", (code) => {
  if (code !== 0) {
    console.error(`x payload generate:types exited with code ${code}`);
    console.error("  Build stopped. Check Payload config and generated type settings.");
    process.exit(code ?? 1);
  }

  console.log("✓ Payload types generated successfully");
  process.exit(0);
});

child.on("error", (error) => {
  console.error("x Failed to start Payload CLI:", error.message);
  process.exit(1);
});
