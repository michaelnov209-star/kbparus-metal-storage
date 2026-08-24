import type { Metadata } from "next";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Вход в панель управления — КБ Парус",
  description: "Защищённый вход в панель управления сайтом КБ Парус.",
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/brand/favicon-32.png",
    apple: "/brand/apple-touch-icon.png"
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true
  }
};

export default function AdminLoginPage() {
  return <LoginClient />;
}
