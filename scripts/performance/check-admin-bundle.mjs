import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";

const statsPath = resolve(".next/diagnostics/route-bundle-stats.json");
const stats = JSON.parse(readFileSync(statsPath, "utf8"));
const admin = stats.find((entry) => entry.route === "/admin/[[...segments]]");

if (!admin) {
  throw new Error("Admin route bundle statistics were not generated.");
}

const maxRawBytes = Number(process.env.ADMIN_BUNDLE_MAX_RAW_BYTES || 2_500_000);
const maxGzipBytes = Number(process.env.ADMIN_BUNDLE_MAX_GZIP_BYTES || 750_000);
const buildRoot = `${resolve(".next")}${sep}`;
let gzipBytes = 0;

for (const relativePath of admin.firstLoadChunkPaths) {
  const filePath = resolve(relativePath);
  if (!filePath.startsWith(buildRoot)) {
    throw new Error(`Unexpected admin bundle path: ${relativePath}`);
  }
  gzipBytes += gzipSync(readFileSync(filePath)).byteLength;
}

const rawBytes = Number(admin.firstLoadUncompressedJsBytes);
console.log(
  `[admin-bundle] raw=${rawBytes} bytes, gzip=${gzipBytes} bytes, chunks=${admin.firstLoadChunkPaths.length}`
);

if (rawBytes > maxRawBytes || gzipBytes > maxGzipBytes) {
  throw new Error(
    `Admin first-load bundle exceeds its budget (raw ${rawBytes}/${maxRawBytes}, gzip ${gzipBytes}/${maxGzipBytes}).`
  );
}
