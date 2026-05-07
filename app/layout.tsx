import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://kbparus-metal-storage.vercel.app"),
  title: "Системы хранения металла под производство | КБ Парус",
  description:
    "Каталог и калькулятор стоимости систем хранения металла: автоматизированные склады листа, кассетные системы, консольные стеллажи, выкатные полки и складское оборудование.",
  icons: {
    icon: [{ url: "/brand/logo-g.png", type: "image/png" }],
    shortcut: "/brand/logo-g.png",
    apple: "/brand/logo-g.png"
  },
  openGraph: {
    title: "Системы хранения металла | КБ Парус",
    description:
      "Подбор, производство и расчет систем хранения металла для листа, труб, профиля и складской логистики.",
    url: "https://kbparus-metal-storage.vercel.app",
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
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
