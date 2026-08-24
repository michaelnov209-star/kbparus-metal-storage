import type { Metadata } from "next";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Вход в панель управления — КБ Парус",
  description: "Защищённый вход в панель управления сайтом КБ Парус.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" }
    ],
    shortcut: "/icon.svg",
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
