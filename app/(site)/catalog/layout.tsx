import type { ReactNode } from "react";
import "@/styles/line-page.css";
import "@/styles/catalog-index.css";
import "@/styles/category-expertise.css";
import "@/styles/public-conversion.css";

export default function CatalogLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
