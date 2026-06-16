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
    // Современные форматы: AVIF/WebP отдаются автоматически вместо PNG/JPG.
    formats: ["image/avif", "image/webp"],
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
        // CMS-медиа (Payload Blob proxy) иммутабельно: имя файла = содержимое.
        // По умолчанию route отдаёт max-age=0 — перекрываем на год, чтобы
        // повторные визиты и навигация не перекачивали 2-3 МБ заново.
        source: "/api/media/file/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
