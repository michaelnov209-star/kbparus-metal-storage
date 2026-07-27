import type { Metadata } from "next";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Вход в панель управления — КБ Парус",
  description: "Защищённый вход в панель управления сайтом КБ Парус.",
  icons: {
    icon: [{ url: "/brand/logo-g.png", type: "image/png" }]
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
