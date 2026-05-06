import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Системы хранения металла под производство | КБ Парус",
  description:
    "Каталог и калькулятор стоимости систем хранения металла: автоматизированные склады листа, кассетные системы, консольные стеллажи, выкатные полки и складское оборудование."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
