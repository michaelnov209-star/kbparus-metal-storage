import type { MetadataRoute } from "next";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import { catalogProducts } from "@/data/storageSystems/catalogDepth";

const BASE_URL = "https://kbparus-metal-storage.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const categoryUrls: MetadataRoute.Sitemap = excelHomeCatalog.map((category) => ({
    url: `${BASE_URL}/catalog/${category.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const productUrls: MetadataRoute.Sitemap = catalogProducts.map((product) => ({
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
    ...categoryUrls,
    ...productUrls,
  ];
}
