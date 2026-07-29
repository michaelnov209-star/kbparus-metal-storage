import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";

const statsPath = resolve(".next/diagnostics/route-bundle-stats.json");
const clientManifestPath = resolve(
  ".next/server/app/(payload)/admin/[[...segments]]/page_client-reference-manifest.js"
);
const stats = JSON.parse(readFileSync(statsPath, "utf8"));
const admin = stats.find((entry) => entry.route === "/admin/[[...segments]]");

if (!admin) {
  throw new Error("Admin route bundle statistics were not generated.");
}

const maxRawBytes = Number(process.env.ADMIN_BUNDLE_MAX_RAW_BYTES || 2_350_000);
const maxGzipBytes = Number(process.env.ADMIN_BUNDLE_MAX_GZIP_BYTES || 700_000);
const maxCssRawBytes = Number(
  process.env.ADMIN_CSS_MAX_RAW_BYTES || 390_000
);
const maxCssGzipBytes = Number(
  process.env.ADMIN_CSS_MAX_GZIP_BYTES || 60_000
);
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

const clientManifestSource = readFileSync(clientManifestPath, "utf8");
const assignmentStart =
  clientManifestSource.indexOf(
    " = ",
    clientManifestSource.indexOf('page"]')
  ) + 3;
if (assignmentStart < 3) {
  throw new Error("Admin client reference manifest has an unexpected format.");
}
const clientManifest = JSON.parse(
  clientManifestSource
    .slice(assignmentStart)
    .trim()
    .replace(/;$/, "")
);
const layoutCss =
  clientManifest.entryCSSFiles?.["[project]/app/(payload)/layout"] ?? [];
const cssPaths = [
  ...new Set(layoutCss.map((entry) => entry.path))
];
let cssRawBytes = 0;
let cssGzipBytes = 0;

for (const relativePath of cssPaths) {
  const filePath = resolve(".next", relativePath);
  if (!filePath.startsWith(buildRoot)) {
    throw new Error(`Unexpected admin stylesheet path: ${relativePath}`);
  }
  const source = readFileSync(filePath);
  cssRawBytes += source.byteLength;
  cssGzipBytes += gzipSync(source).byteLength;
}

console.log(
  `[admin-bundle] raw=${rawBytes} bytes, gzip=${gzipBytes} bytes, chunks=${admin.firstLoadChunkPaths.length}`
);
console.log(
  `[admin-css] raw=${cssRawBytes} bytes, gzip=${cssGzipBytes} bytes, files=${cssPaths.length}`
);

if (rawBytes > maxRawBytes || gzipBytes > maxGzipBytes) {
  throw new Error(
    `Admin first-load bundle exceeds its budget (raw ${rawBytes}/${maxRawBytes}, gzip ${gzipBytes}/${maxGzipBytes}).`
  );
}

if (cssRawBytes > maxCssRawBytes || cssGzipBytes > maxCssGzipBytes) {
  throw new Error(
    `Admin global CSS exceeds its budget (raw ${cssRawBytes}/${maxCssRawBytes}, gzip ${cssGzipBytes}/${maxCssGzipBytes}).`
  );
}
