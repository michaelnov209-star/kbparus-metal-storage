import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  readdir,
  stat,
  unlink,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const catalogDepthPath = path.join(
  projectRoot,
  "data",
  "storageSystems",
  "catalogDepth.ts"
);
const publicDir = path.join(projectRoot, "public");
const productDir = path.join(publicDir, "assets", "images", "products");
const outputDir = path.join(productDir, "optimized");
const manifestPath = path.join(
  projectRoot,
  "data",
  "storageSystems",
  "productImageManifest.json"
);

const variants = [
  { key: "thumb", width: 320 },
  { key: "medium", width: 800 },
  { key: "large", width: 1600 }
];
const optimizerVersion = "product-responsive-v1-webp-q80";
const productImagePattern = /\/assets\/images\/products\/[^"']+/g;

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function assertProductPath(publicPath) {
  const sourcePath = path.resolve(publicDir, publicPath.slice(1));
  const relativePath = path.relative(productDir, sourcePath);

  if (
    relativePath === "" ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath) ||
    relativePath.split(path.sep).includes("optimized")
  ) {
    throw new Error(`Unsafe or invalid fallback product image path: ${publicPath}`);
  }

  return sourcePath;
}

const catalogDepthSource = await readFile(catalogDepthPath, "utf8");
const sourcePublicPaths = [
  ...new Set(catalogDepthSource.match(productImagePattern) ?? [])
].sort((left, right) => left.localeCompare(right, "en"));

if (sourcePublicPaths.length === 0) {
  throw new Error(`No local fallback product images found in ${catalogDepthPath}`);
}

await mkdir(outputDir, { recursive: true });

const manifest = {};
const generatedByContentHash = new Map();
const expectedOutputFiles = new Set();
let originalBytes = 0;
let optimizedBytes = 0;
let sourceReferences = 0;

for (const publicSource of sourcePublicPaths) {
  const sourcePath = assertProductPath(publicSource);

  if (!(await exists(sourcePath)) || !(await stat(sourcePath)).isFile()) {
    throw new Error(`Missing fallback product image: ${publicSource}`);
  }

  const sourceBuffer = await readFile(sourcePath);
  const contentHash = createHash("sha256")
    .update(optimizerVersion)
    .update(sourceBuffer)
    .digest("hex")
    .slice(0, 16);
  const existingSet = generatedByContentHash.get(contentHash);

  originalBytes += sourceBuffer.byteLength;
  sourceReferences += (
    catalogDepthSource.match(
      new RegExp(
        publicSource.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      )
    ) ?? []
  ).length;

  if (existingSet) {
    manifest[publicSource] = existingSet;
    continue;
  }

  const sourceMetadata = await sharp(sourceBuffer).metadata();
  const sourceWidth =
    sourceMetadata.orientation &&
    [5, 6, 7, 8].includes(sourceMetadata.orientation)
      ? sourceMetadata.height
      : sourceMetadata.width;

  if (!sourceWidth) {
    throw new Error(`Sharp did not return a width for ${sourcePath}`);
  }

  const imageSet = {};

  for (const variant of variants) {
    const actualTargetWidth = Math.min(sourceWidth, variant.width);
    const outputName = `${contentHash}-${actualTargetWidth}.webp`;
    const outputPath = path.join(outputDir, outputName);
    const isNewOutput = !expectedOutputFiles.has(outputName);
    expectedOutputFiles.add(outputName);

    if (isNewOutput && !(await exists(outputPath))) {
      await sharp(sourceBuffer)
        .rotate()
        .resize({
          width: variant.width,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({
          quality: 80,
          alphaQuality: 100,
          effort: 5,
          smartSubsample: true
        })
        .toFile(outputPath);
    }

    const outputMetadata = await sharp(outputPath).metadata();

    if (!outputMetadata.width || !outputMetadata.height) {
      throw new Error(`Sharp did not return dimensions for ${outputPath}`);
    }

    if (isNewOutput) {
      optimizedBytes += (await stat(outputPath)).size;
    }

    imageSet[variant.key] = {
      src: `/assets/images/products/optimized/${outputName}`,
      width: outputMetadata.width,
      height: outputMetadata.height
    };
  }

  generatedByContentHash.set(contentHash, imageSet);
  manifest[publicSource] = imageSet;
}

const previousOutputs = (await readdir(outputDir, { withFileTypes: true })).sort(
  (left, right) => left.name.localeCompare(right.name, "en")
);
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

const uniqueSourceBytes = originalBytes;
const reduction =
  uniqueSourceBytes > 0 && optimizedBytes > 0
    ? (uniqueSourceBytes / optimizedBytes).toFixed(1)
    : "0";

console.log(
  `[product-images] ${sourceReferences} references -> ${sourcePublicPaths.length} unique paths -> ` +
    `${generatedByContentHash.size} unique sources -> ${expectedOutputFiles.size} WebP variants; ` +
    `${(uniqueSourceBytes / 1024 / 1024).toFixed(2)} MB -> ` +
    `${(optimizedBytes / 1024 / 1024).toFixed(2)} MB (${reduction}x smaller)`
);
