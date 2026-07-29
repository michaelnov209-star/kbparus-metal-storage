#!/usr/bin/env node

import { getPayload } from "payload";
import config from "@payload-config";

import {
  auditCurrentState,
  syncCurrentStateAsset,
  syncCurrentStateContent
} from "../../lib/cms/current-state-sync-runtime";

const apply = process.argv.includes("--apply");
const sourceUrl =
  process.env.CURRENT_STATE_SOURCE_URL?.trim() ||
  "https://kbparus-metal-storage.vercel.app/admin/system";

if (
  apply &&
  process.env.CURRENT_STATE_SYNC_CONFIRMATION !== "APPLY_CURRENT_STATE_SYNC"
) {
  throw new Error(
    "Запись заблокирована. Укажите CURRENT_STATE_SYNC_CONFIRMATION=APPLY_CURRENT_STATE_SYNC."
  );
}

const cms = await getPayload({ config });
const initial = await auditCurrentState(cms, sourceUrl);

console.log(
  `[cms-current-state] assets=${initial.assetTotal}, missingAssets=${initial.missingAssets.length}, missingRecords=${initial.missingRecords}, missingFields=${initial.missingFields}`
);

if (!apply) {
  console.log("[cms-current-state] Read-only audit. Re-run with --apply to synchronize.");
  process.exit(0);
}

for (const [index, assetKey] of initial.missingAssets.entries()) {
  await syncCurrentStateAsset(cms, assetKey, sourceUrl);
  console.log(
    `[cms-current-state] media ${index + 1}/${initial.missingAssets.length}: ${assetKey}`
  );
}

const content = await syncCurrentStateContent(cms, sourceUrl);
const final = await auditCurrentState(cms, sourceUrl);

console.log(
  `[cms-current-state] content created=${content.createdRecords}, updatedRecords=${content.updatedRecords}, updatedFields=${content.updatedFields}`
);
console.log(
  `[cms-current-state] complete missingAssets=${final.missingAssets.length}, missingRecords=${final.missingRecords}, missingFields=${final.missingFields}`
);

if (
  final.missingAssets.length > 0 ||
  final.missingRecords > 0 ||
  final.missingFields > 0
) {
  process.exit(1);
}

// Payload keeps database and mail transports alive for normal long-running
// servers. This command is a bounded one-shot operation, so exit explicitly
// after all writes and the final audit have completed.
process.exit(0);
