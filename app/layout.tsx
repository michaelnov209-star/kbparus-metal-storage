import type { Metadata } from "next";
import "./globals.css";
import { JsonLd, organizationSchema, websiteSchema, SITE_URL } from "@/lib/seo/schema";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Системы хранения металла под производство | КБ Парус",
    template: "%s | КБ Парус"
  },
  description:
    "Каталог и калькулятор стоимости систем хранения металла: автоматизированные склады листа, кассетные системы, консольные стеллажи, выкатные полки и складское оборудование.",
  keywords: [
    "системы хранения металла",
    "автоматизированный склад",
    "кассетный стеллаж",
    "консольный стеллаж",
    "хранение листового металла",
    "хранение труб",
    "складская логистика",
    "промышленные стеллажи",
    "КБ Парус",
    "Технокам"
  ],
  authors: [{ name: "КБ Парус" }],
  creator: "КБ Парус",
  publisher: "ООО «Технокам»",
  alternates: {
    canonical: SITE_URL
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  icons: {
    icon: [{ url: "/brand/logo-g.png", type: "image/png" }],
    shortcut: "/brand/logo-g.png",
    apple: "/brand/logo-g.png"
  },
  openGraph: {
    title: "Системы хранения металла | КБ Парус",
    description:
      "Подбор, производство и расчет систем хранения металла для листа, труб, профиля и складской логистики.",
    url: SITE_URL,
    siteName: "КБ Парус — системы хранения металла",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "КБ Парус — системы хранения металла"
      }
    ],
    locale: "ru_RU",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Системы хранения металла | КБ Парус",
    description: "Каталог и калькулятор стоимости систем хранения металла.",
    images: ["/opengraph-image"]
  },
  verification: {
    // Добавьте здесь после регистрации в Search Console / Webmaster:
    // google: "google-verification-code",
    // yandex: "yandex-verification-code"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
      </head>
      <body>{children}</body>
    </html>
  );
}
