import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceDir = path.join(projectRoot, "public", "assets", "images", "home", "scenarios");
const outputDir = path.join(projectRoot, "public", "assets", "images", "home", "optimized");
const manifestPath = path.join(
  projectRoot,
  "data",
  "storageSystems",
  "homeImageManifest.json"
);

const supportedExtensions = new Set([".jpg", ".jpeg", ".png"]);
const optimizerVersion = "home-scenario-v1-webp-q80-max-1920";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

await mkdir(outputDir, { recursive: true });

const previousManifest = await readFile(manifestPath, "utf8")
  .then((value) => JSON.parse(value))
  .catch(() => ({}));
const sourceFiles = (await readdir(sourceDir, { withFileTypes: true }))
  .filter(
    (entry) =>
      entry.isFile() &&
      supportedExtensions.has(path.extname(entry.name).toLowerCase())
  )
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right, "en"));

const manifest = {};
const expectedOutputs = new Set();
let originalBytes = 0;
let optimizedBytes = 0;

for (const sourceName of sourceFiles) {
  const sourcePath = path.join(sourceDir, sourceName);
  const sourceBuffer = await readFile(sourcePath);
  const sourceHash = createHash("sha256")
    .update(optimizerVersion)
    .update(sourceBuffer)
    .digest("hex")
    .slice(0, 12);
  const stem = path.parse(sourceName).name;
  const outputName = `${stem}-${sourceHash}.webp`;
  const outputPath = path.join(outputDir, outputName);
  const publicSource = `/assets/images/home/scenarios/${sourceName}`;
  const publicOutput = `/assets/images/home/optimized/${outputName}`;

  originalBytes += sourceBuffer.byteLength;
  expectedOutputs.add(outputName);

  if (!(await exists(outputPath))) {
    await sharp(sourceBuffer)
      .rotate()
      .resize({
        width: 1920,
        height: 1280,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({
        quality: 80,
        effort: 6,
        smartSubsample: true
      })
      .toFile(outputPath);
  }

  optimizedBytes += (await readFile(outputPath)).byteLength;
  manifest[publicSource] = publicOutput;
}

for (const previousOutput of Object.values(previousManifest)) {
  if (typeof previousOutput !== "string") continue;
  const filename = path.basename(previousOutput);
  if (expectedOutputs.has(filename)) continue;
  const previousPath = path.join(outputDir, filename);
  if (await exists(previousPath)) await unlink(previousPath);
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const reduction = optimizedBytes > 0 ? (originalBytes / optimizedBytes).toFixed(1) : "0";
console.log(
  `[home-images] ${sourceFiles.length} source -> ${expectedOutputs.size} optimized WebP; ` +
    `${(originalBytes / 1024 / 1024).toFixed(2)} MB -> ${(optimizedBytes / 1024 / 1024).toFixed(2)} MB ` +
    `(${reduction}x smaller)`
);
