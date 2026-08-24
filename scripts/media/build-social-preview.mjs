import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const backgroundPath = path.join(
  projectRoot,
  "public",
  "assets",
  "images",
  "home",
  "optimized",
  "metal-storage-hero-poster-e2b60a440bad.webp"
);
const logoPath = path.join(projectRoot, "public", "brand", "logo-g.png");
const outputPath = path.join(
  projectRoot,
  "public",
  "brand",
  "social-preview.jpg"
);

const width = 1200;
const height = 630;
const overlay = Buffer.from(`
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#0b1219" stop-opacity="0.98"/>
        <stop offset="0.48" stop-color="#0b1219" stop-opacity="0.82"/>
        <stop offset="0.76" stop-color="#0b1219" stop-opacity="0.34"/>
        <stop offset="1" stop-color="#0b1219" stop-opacity="0.12"/>
      </linearGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.58" stop-color="#081018" stop-opacity="0"/>
        <stop offset="1" stop-color="#081018" stop-opacity="0.82"/>
      </linearGradient>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#shade)"/>
    <rect width="${width}" height="${height}" fill="url(#floor)"/>
    <rect x="0" y="0" width="9" height="${height}" fill="#fc5413"/>

    <rect x="54" y="42" width="300" height="92" rx="8" fill="#ffffff" fill-opacity="0.96"/>
    <rect x="54" y="162" width="44" height="4" fill="#fc5413"/>
    <text x="112" y="170" fill="#fc5413" font-family="Arial, 'DejaVu Sans', sans-serif" font-size="18" font-weight="700">КБ ПАРУС · ПРОМЫШЛЕННЫЕ РЕШЕНИЯ</text>

    <text x="54" y="260" fill="#ffffff" font-family="Arial, 'DejaVu Sans', sans-serif" font-size="64" font-weight="700">Системы хранения</text>
    <text x="54" y="326" fill="#ffffff" font-family="Arial, 'DejaVu Sans', sans-serif" font-size="64" font-weight="700">металла</text>

    <text x="54" y="388" fill="#e8edf1" font-family="Arial, 'DejaVu Sans', sans-serif" font-size="27" font-weight="400">Подбор и расчёт оборудования</text>
    <text x="54" y="425" fill="#e8edf1" font-family="Arial, 'DejaVu Sans', sans-serif" font-size="27" font-weight="400">для листа, труб и профиля</text>

    <rect x="54" y="500" width="700" height="62" rx="8" fill="#111a22" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.22"/>
    <circle cx="82" cy="531" r="7" fill="#fc5413"/>
    <text x="102" y="538" fill="#ffffff" font-family="Arial, 'DejaVu Sans', sans-serif" font-size="20" font-weight="700">КАТАЛОГ</text>
    <line x1="220" y1="515" x2="220" y2="547" stroke="#ffffff" stroke-opacity="0.28"/>
    <text x="246" y="538" fill="#ffffff" font-family="Arial, 'DejaVu Sans', sans-serif" font-size="20" font-weight="700">КАЛЬКУЛЯТОР</text>
    <line x1="416" y1="515" x2="416" y2="547" stroke="#ffffff" stroke-opacity="0.28"/>
    <text x="442" y="538" fill="#ffffff" font-family="Arial, 'DejaVu Sans', sans-serif" font-size="19" font-weight="700">ИНЖЕНЕРНЫЙ ПОДБОР</text>

    <text x="1146" y="54" text-anchor="end" fill="#ffffff" fill-opacity="0.9" font-family="Arial, 'DejaVu Sans', sans-serif" font-size="17" font-weight="700">ПРОИЗВОДСТВО С 2009 ГОДА</text>
  </svg>
`);

const logo = await sharp(logoPath)
  .resize({ width: 246, height: 78, fit: "inside", withoutEnlargement: true })
  .png()
  .toBuffer();

await mkdir(path.dirname(outputPath), { recursive: true });
await sharp(backgroundPath)
  .rotate()
  .resize(width, height, { fit: "cover", position: "center" })
  .modulate({ brightness: 0.88, saturation: 0.96 })
  .composite([
    { input: overlay, left: 0, top: 0 },
    { input: logo, left: 78, top: 49 }
  ])
  .jpeg({ quality: 90, chromaSubsampling: "4:4:4", mozjpeg: true })
  .toFile(outputPath);

const metadata = await sharp(outputPath).metadata();
console.log(
  `[social-preview] ${metadata.width}x${metadata.height} JPEG -> public/brand/social-preview.jpg`
);
