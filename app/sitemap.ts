import type { MetadataRoute } from "next";
import { getCatalogCategories } from "@/lib/cms/catalog";
import { getCatalogProducts } from "@/lib/cms/products";

const BASE_URL = "https://kbparus-metal-storage.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getCatalogCategories();
  const products = await getCatalogProducts();
  const categoryUrls: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${BASE_URL}/catalog/${category.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/catalog/${product.categoryId}/${product.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...categoryUrls,
    ...productUrls,
  ];
}
