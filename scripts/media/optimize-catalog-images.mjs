import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceDir = path.join(projectRoot, "public", "assets", "images", "catalog");
const outputDir = path.join(sourceDir, "optimized");
const manifestPath = path.join(
  projectRoot,
  "data",
  "storageSystems",
  "catalogImageManifest.json"
);
const catalogDataPath = path.join(
  projectRoot,
  "data",
  "storageSystems",
  "excelCatalog.ts"
);

const variants = [
  { key: "thumb", width: 320, height: 240 },
  { key: "medium", width: 640, height: 480 },
  { key: "large", width: 960, height: 720 }
];
const optimizerVersion = "catalog-card-v1-webp-q78-contain-4x3";
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

await mkdir(outputDir, { recursive: true });

// Only public category covers referenced by the catalog are build inputs.
// Superseded originals may remain in the repository for audit/recovery without
// leaking back into the runtime manifest or generating unnecessary derivatives.
const catalogData = await readFile(catalogDataPath, "utf8");
const referencedSourceNames = new Set(
  Array.from(
    catalogData.matchAll(
      /image:\s*["']\/assets\/images\/catalog\/([^"']+)["']/g
    ),
    (match) => match[1]
  )
);
if (referencedSourceNames.size === 0) {
  throw new Error("[catalog-images] No category image references found in excelCatalog.ts");
}

const availableSourceNames = new Set(
  (await readdir(sourceDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase()))
  .map((entry) => entry.name)
);
const missingSourceNames = Array.from(referencedSourceNames).filter(
  (sourceName) => !availableSourceNames.has(sourceName)
);
if (missingSourceNames.length > 0) {
  throw new Error(
    `[catalog-images] Missing referenced source files: ${missingSourceNames.join(", ")}`
  );
}
const sourceFiles = Array.from(referencedSourceNames).sort((left, right) =>
  left.localeCompare(right, "en")
);

const manifest = {};
const expectedOutputFiles = new Set();
let originalBytes = 0;
let optimizedBytes = 0;

for (const sourceName of sourceFiles) {
  const sourcePath = path.join(sourceDir, sourceName);
  const sourceBuffer = await readFile(sourcePath);
  const sourceHash = createHash("sha256")
    .update(optimizerVersion)
    .update(sourceBuffer)
    .digest("hex")
    .slice(0, 10);
  const stem = path.parse(sourceName).name;
  const publicSource = `/assets/images/catalog/${sourceName}`;
  const imageSet = {};

  originalBytes += sourceBuffer.byteLength;

  for (const variant of variants) {
    const outputName = `${stem}-${variant.width}-${sourceHash}.webp`;
    const outputPath = path.join(outputDir, outputName);
    expectedOutputFiles.add(outputName);

    if (!(await exists(outputPath))) {
      await sharp(sourceBuffer)
        .rotate()
        .resize({
          width: variant.width,
          height: variant.height,
          fit: "contain",
          position: "centre",
          background: { r: 243, g: 246, b: 249, alpha: 1 }
        })
        .webp({
          quality: 78,
          effort: 5,
          smartSubsample: true
        })
        .toFile(outputPath);
    }

    const outputBuffer = await readFile(outputPath);
    optimizedBytes += outputBuffer.byteLength;
    imageSet[variant.key] = `/assets/images/catalog/optimized/${outputName}`;
  }

  manifest[publicSource] = imageSet;
}

const previousOutputs = await readdir(outputDir, { withFileTypes: true });
for (const entry of previousOutputs) {
  if (
    entry.isFile() &&
    entry.name.endsWith(".webp") &&
    !expectedOutputFiles.has(entry.name)
  ) {
    await unlink(path.join(outputDir, entry.name));
  }
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const reduction = originalBytes > 0 ? (originalBytes / optimizedBytes).toFixed(1) : "0";
console.log(
  `[catalog-images] ${sourceFiles.length} sources -> ${expectedOutputFiles.size} WebP variants; ` +
    `${(originalBytes / 1024 / 1024).toFixed(2)} MB -> ${(optimizedBytes / 1024 / 1024).toFixed(2)} MB ` +
    `(${reduction}x smaller)`
);
