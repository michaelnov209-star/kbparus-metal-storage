import type { MetadataRoute } from "next";

const PRODUCTION_URL = "https://kbparus-metal-storage.vercel.app";

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
  const candidate = value?.trim() || PRODUCTION_URL;
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  return withProtocol.replace(/\/+$/, "");
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
      url: `${baseUrl}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.3
    },
    ...categoryUrls,
    ...productUrls
  ];
}
