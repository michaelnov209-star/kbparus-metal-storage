/**
 * JSON-LD schema.org helpers for SEO.
 * Reference: https://schema.org/, https://developers.google.com/search/docs/appearance/structured-data
 */

export const SITE_URL = "https://kbparus-metal-storage.vercel.app";
export const SITE_NAME = "КБ Парус";
export const COMPANY_LEGAL_NAME = "ООО «Технокам»";
export const COMPANY_PHONE = "+7 (495) 137-94-50";
export const COMPANY_EMAIL = "info@kbparus.ru";
export const COMPANY_ADDRESS = {
  streetAddress: "Москва",
  addressLocality: "Москва",
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
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    legalName: COMPANY_LEGAL_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo-g.png`,
    description:
      "Производитель промышленных систем хранения металла: автоматизированные склады, кассетные системы, консольные стеллажи и складское оборудование.",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: COMPANY_PHONE,
        contactType: "sales",
        email: COMPANY_EMAIL,
        availableLanguage: ["Russian"],
        areaServed: "RU",
      },
    ],
    address: {
      "@type": "PostalAddress",
      ...COMPANY_ADDRESS,
    },
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
  const offers: Record<string, unknown> = {
    "@type": "Offer",
    url: product.url,
    priceCurrency: "RUB",
    availability: "https://schema.org/InStock",
    priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    seller: { "@type": "Organization", name: SITE_NAME },
  };

  if (product.priceFrom) {
    offers.price = product.priceFrom;
  } else {
    offers.priceSpecification = {
      "@type": "PriceSpecification",
      priceCurrency: "RUB",
      description: "Цена по запросу — финальная стоимость рассчитывается инженером по параметрам объекта.",
    };
  }

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
    offers,
  };
}

export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
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
