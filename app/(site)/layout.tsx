import type { Metadata } from "next";
import "../globals.css";
import { AnalyticsEvents } from "@/components/AnalyticsEvents";
import { CookieConsent } from "@/components/CookieConsent";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { YandexMetrika } from "@/components/YandexMetrika";
import { JsonLd, organizationSchema, websiteSchema, SITE_URL } from "@/lib/seo/schema";
import { buildSearchVerificationMetadata } from "@/lib/seo/verification";
import { getSiteContacts } from "@/lib/cms/contacts";

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
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/icon.svg",
    apple: "/brand/apple-touch-icon.png"
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
  verification: buildSearchVerificationMetadata()
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const contacts = await getSiteContacts();
  const phone = contacts.phones[0]?.label;
  const sameAs = Object.values(contacts.socials).filter(
    (value): value is string => typeof value === "string" && /^https?:\/\//i.test(value)
  );

  return (
    <html lang="ru">
      <head>
        <JsonLd
          data={organizationSchema({
            legalName: contacts.legalName,
            phone,
            email: contacts.email.label,
            address: contacts.address,
            taxId: contacts.inn,
            sameAs
          })}
        />
        <JsonLd data={websiteSchema()} />
      </head>
      <body>
        <YandexMetrika />
        <AnalyticsEvents />
        <WebVitalsReporter />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
