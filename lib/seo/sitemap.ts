import type { MetadataRoute } from "next";
import { getSiteUrl } from "./site";

export type SitemapCategory = {
  id: string;
  noIndex?: boolean;
};

export type SitemapProduct = {
  id: string;
  categoryId: string;
  noIndex?: boolean;
};

export function getSitemapBaseUrl(
  value = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
): string {
  return getSiteUrl(value);
}

export function buildSitemapEntries(
  categories: SitemapCategory[],
  products: SitemapProduct[],
  baseUrl = getSitemapBaseUrl()
): MetadataRoute.Sitemap {
  const categoryUrls: MetadataRoute.Sitemap = categories
    .filter((category) => !category.noIndex)
    .map((category) => ({
      url: `${baseUrl}/catalog/${category.id}`,
      changeFrequency: "monthly",
      priority: 0.8
    }));

  const indexableCategoryIds = new Set(
    categories.filter((category) => !category.noIndex).map((category) => category.id)
  );

  const productUrls: MetadataRoute.Sitemap = products
    .filter((product) => !product.noIndex && indexableCategoryIds.has(product.categoryId))
    .map((product) => ({
      url: `${baseUrl}/catalog/${product.categoryId}/${product.id}`,
      changeFrequency: "monthly",
      priority: 0.7
    }));

  return [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${baseUrl}/catalog`,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${baseUrl}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.3
    },
    ...categoryUrls,
    ...productUrls
  ];
}
