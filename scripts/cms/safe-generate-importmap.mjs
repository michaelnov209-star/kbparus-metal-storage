#!/usr/bin/env node
/**
 * Payload importMap generator used by the build pipeline.
 *
 * This intentionally runs the official Payload CLI on every platform.
 * If importMap generation fails, the build must fail before deployment,
 * because a stale importMap breaks the Payload admin UI at runtime.
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";

console.log("-> Running payload generate:importmap...");

const payloadBin = resolve("node_modules/payload/bin.js");

const child = spawn(process.execPath, [payloadBin, "generate:importmap"], {
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: "--no-deprecation" }
});

child.on("exit", (code) => {
  if (code !== 0) {
    console.error(`x payload generate:importmap exited with code ${code}`);
    console.error("  Build stopped. Check Payload config and importMap settings.");
    process.exit(code ?? 1);
  }

  console.log("✓ importMap generated successfully");
  process.exit(0);
});

child.on("error", (err) => {
  console.error("x Failed to start Payload CLI:", err.message);
  process.exit(1);
});
