import type { Metadata } from "next";
import "./globals.css";
import { seoMetadata } from "@/data/storageSystems/content";

export const metadata: Metadata = {
  title: seoMetadata.title,
  description: seoMetadata.description
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
