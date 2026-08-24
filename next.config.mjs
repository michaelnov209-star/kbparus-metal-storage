import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV !== "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://mc.yandex.ru https://yastatic.net`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://mc.yandex.ru https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
  `connect-src 'self' https://mc.yandex.ru https://mc.yandex.com https://*.public.blob.vercel-storage.com${isDevelopment ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
  "frame-src 'self' https://yandex.ru https://*.yandex.ru",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"])
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
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
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "Origin-Agent-Cluster",
    value: "?1",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
];

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Только server-only пакеты без CSS-импортов. @payloadcms/next/richtext-lexical
  // нельзя externalize — у них есть CSS, которые Node ESM не загружает.
  serverExternalPackages: ["sharp", "drizzle-kit", "drizzle-orm", "pg", "@payloadcms/db-postgres"],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*"
    ]
  },
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
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
      {
        source: "/api/users/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, must-revalidate" },
        ],
      },
      {
        source: "/assets/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/assets/admin/workspace-bg-v1.webp",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
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
        source: "/assets/images/home/scenarios/:path*",
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
      {
        source: "/brand/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, must-revalidate" },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
