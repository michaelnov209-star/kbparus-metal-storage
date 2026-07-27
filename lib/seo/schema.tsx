/**
 * JSON-LD schema.org helpers for SEO.
 * Reference: https://schema.org/, https://developers.google.com/search/docs/appearance/structured-data
 */

import { SITE_URL } from "./site";

export { SITE_URL } from "./site";
export const SITE_NAME = "КБ Парус";
export const COMPANY_LEGAL_NAME = "ООО «Технокам»";
export const COMPANY_PHONE = "+7 (499) 403-39-62";
export const COMPANY_EMAIL = "info@kbparus.ru";
export const COMPANY_ADDRESS = {
  streetAddress: "1-й Кардолентный проезд, д. 5",
  addressLocality: "Ногинск",
  addressRegion: "Московская область",
  addressCountry: "RU",
};

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface ProductForSchema {
  name: string;
  description: string;
  image: string;
  sku: string;
  url: string;
  priceFrom?: number;
  priceTo?: number;
}

interface OrganizationSchemaInput {
  legalName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  sameAs?: string[];
}

export function organizationSchema(input: OrganizationSchemaInput = {}) {
  const phone = input.phone || COMPANY_PHONE;
  const email = input.email || COMPANY_EMAIL;
  const sameAs = (input.sameAs || []).filter((value) => /^https?:\/\//i.test(value));

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    legalName: input.legalName || COMPANY_LEGAL_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo-g.png`,
    description:
      "Производитель промышленных систем хранения металла: автоматизированные склады, кассетные системы, консольные стеллажи и складское оборудование.",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: phone,
        contactType: "sales",
        email,
        availableLanguage: ["Russian"],
        areaServed: "RU",
      },
    ],
    address: {
      "@type": "PostalAddress",
      ...(input.address
        ? { streetAddress: input.address, addressCountry: "RU" }
        : COMPANY_ADDRESS),
    },
    ...(input.taxId ? { taxID: input.taxId } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {})
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${SITE_NAME} — системы хранения металла`,
    url: SITE_URL,
    inLanguage: "ru-RU",
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function productSchema(product: ProductForSchema) {
  const offers =
    product.priceFrom && product.priceTo && product.priceTo > product.priceFrom
      ? {
          "@type": "AggregateOffer",
          url: product.url,
          lowPrice: product.priceFrom,
          highPrice: product.priceTo,
          priceCurrency: "RUB",
          seller: { "@type": "Organization", name: SITE_NAME }
        }
      : product.priceFrom
        ? {
            "@type": "Offer",
            url: product.url,
            price: product.priceFrom,
            priceCurrency: "RUB",
            seller: { "@type": "Organization", name: SITE_NAME }
          }
        : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.image,
    url: product.url,
    brand: { "@type": "Brand", name: SITE_NAME },
    manufacturer: { "@type": "Organization", name: SITE_NAME },
    ...(offers ? { offers } : {})
  };
}

export function itemListSchema(items: Array<{ name: string; url: string; image?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url,
      name: item.name,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
