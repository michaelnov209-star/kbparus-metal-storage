import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Только server-only пакеты без CSS-импортов. @payloadcms/next/richtext-lexical
  // нельзя externalize — у них есть CSS, которые Node ESM не загружает.
  serverExternalPackages: ["sharp", "drizzle-kit", "drizzle-orm", "pg", "@payloadcms/db-postgres"],
  images: {
    // WebP заметно быстрее кодируется на холодном CDN, чем AVIF. Карточки
    // каталога используют готовые responsive-варианты и обходят runtime resize.
    formats: ["image/webp"],
    // Год кеширования оптимизированных вариантов на CDN.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      // Vercel Blob — куда Payload загружает медиа-файлы
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" }
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Контент-хеш входит в имя каждого файла, поэтому годовой immutable
        // кеш безопасен и не удерживает устаревшую версию после обновления.
        source: "/assets/images/catalog/optimized/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/assets/images/products/optimized/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Content hash is part of the filename, so immutable edge caching is safe.
        source: "/assets/videos/optimized/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/assets/images/home/optimized/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Новые Blob-загрузки получают addRandomSuffix, поэтому их URL уникален.
        // Повторные визиты и навигация не перекачивают тяжёлые медиа заново.
        source: "/api/media/file/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
