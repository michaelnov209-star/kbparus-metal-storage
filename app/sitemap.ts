import type { MetadataRoute } from "next";
import { getCatalogCategories } from "@/lib/cms/catalog";
import { getCatalogProducts } from "@/lib/cms/products";
import { buildSitemapEntries } from "@/lib/seo/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts()
  ]);

  return buildSitemapEntries(categories, products);
}
