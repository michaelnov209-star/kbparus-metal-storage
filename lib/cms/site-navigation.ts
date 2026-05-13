import { cache } from "react";
import { getCmsClient } from "./client";

export interface SiteLink {
  label: string;
  href: string;
  openInNewTab?: boolean;
}

export interface SiteNavigationData {
  header: {
    catalog: {
      label: string;
      href: string;
      showDropdown: boolean;
    };
    links: SiteLink[];
    detailLinks: SiteLink[];
    contacts: {
      showTelegram: boolean;
      showMax: boolean;
      showPhones: boolean;
    };
  };
  footer: {
    description: string;
    links: SiteLink[];
    legalLinks: SiteLink[];
    cta?: SiteLink;
  };
}

export const DEFAULT_SITE_NAVIGATION: SiteNavigationData = {
  header: {
    catalog: { label: "Каталог", href: "#catalog", showDropdown: true },
    links: [
      { label: "Калькулятор", href: "#calculator" },
      { label: "Кейсы", href: "#cases" },
      { label: "География", href: "#geography" },
      { label: "О компании", href: "#about" },
      { label: "FAQ", href: "#faq" },
      { label: "Контакты", href: "#contacts" }
    ],
    detailLinks: [
      { label: "Каталог", href: "/#catalog" },
      { label: "Калькулятор", href: "/#calculator" },
      { label: "Контакты", href: "/#contacts" }
    ],
    contacts: {
      showTelegram: true,
      showMax: true,
      showPhones: true
    }
  },
  footer: {
    description: "Системы хранения металла",
    links: [
      { label: "Главная", href: "#top" },
      { label: "Каталог", href: "#catalog" },
      { label: "Калькулятор", href: "#calculator" },
      { label: "Кейсы", href: "#cases" },
      { label: "География", href: "#geography" },
      { label: "О компании", href: "#about" },
      { label: "FAQ", href: "#faq" },
      { label: "Контакты", href: "#contacts" }
    ],
    legalLinks: []
  }
};

interface NavigationGlobal {
  catalog?: {
    label?: string | null;
    href?: string | null;
    showDropdown?: boolean | null;
  } | null;
  headerLinks?: Array<RawLink | null> | null;
  detailPageLinks?: Array<RawLink | null> | null;
  headerContacts?: {
    showTelegram?: boolean | null;
    showMax?: boolean | null;
    showPhones?: boolean | null;
  } | null;
  footerDescription?: string | null;
  footerLinks?: Array<RawLink | null> | null;
  legalLinks?: Array<RawLink | null> | null;
  footerCta?: {
    enabled?: boolean | null;
    label?: string | null;
    href?: string | null;
  } | null;
}

interface RawLink {
  label?: string | null;
  href?: string | null;
  enabled?: boolean | null;
  openInNewTab?: boolean | null;
}

export const getSiteNavigation = cache(async (): Promise<SiteNavigationData> => {
  const cms = await getCmsClient();
  if (!cms) return DEFAULT_SITE_NAVIGATION;

  try {
    const navigation = (await cms.findGlobal({ slug: "site-navigation", depth: 0 })) as NavigationGlobal | null;
    if (!navigation) return DEFAULT_SITE_NAVIGATION;

    const headerLinks = normalizeLinks(navigation.headerLinks, DEFAULT_SITE_NAVIGATION.header.links);
    const detailLinks = normalizeLinks(navigation.detailPageLinks, DEFAULT_SITE_NAVIGATION.header.detailLinks);
    const footerLinks = normalizeLinks(navigation.footerLinks, DEFAULT_SITE_NAVIGATION.footer.links);
    const legalLinks = normalizeLinks(navigation.legalLinks, []);

    return {
      header: {
        catalog: {
          label: navigation.catalog?.label?.trim() || DEFAULT_SITE_NAVIGATION.header.catalog.label,
          href: navigation.catalog?.href?.trim() || DEFAULT_SITE_NAVIGATION.header.catalog.href,
          showDropdown: navigation.catalog?.showDropdown ?? DEFAULT_SITE_NAVIGATION.header.catalog.showDropdown
        },
        links: headerLinks,
        detailLinks,
        contacts: {
          showTelegram: navigation.headerContacts?.showTelegram ?? DEFAULT_SITE_NAVIGATION.header.contacts.showTelegram,
          showMax: navigation.headerContacts?.showMax ?? DEFAULT_SITE_NAVIGATION.header.contacts.showMax,
          showPhones: navigation.headerContacts?.showPhones ?? DEFAULT_SITE_NAVIGATION.header.contacts.showPhones
        }
      },
      footer: {
        description: navigation.footerDescription?.trim() || DEFAULT_SITE_NAVIGATION.footer.description,
        links: footerLinks,
        legalLinks,
        cta: normalizeFooterCta(navigation.footerCta)
      }
    };
  } catch (error) {
    console.warn("[cms] getSiteNavigation failed:", error);
    return DEFAULT_SITE_NAVIGATION;
  }
});

function normalizeLinks(value: NavigationGlobal["headerLinks"], fallback: SiteLink[]): SiteLink[] {
  const links =
    value
      ?.filter((item): item is RawLink => Boolean(item))
      .filter((item) => item.enabled !== false)
      .map((item) => ({
        label: item.label?.trim() || "",
        href: item.href?.trim() || "",
        openInNewTab: Boolean(item.openInNewTab)
      }))
      .filter((item) => item.label && item.href) || [];

  return links.length > 0 ? links : fallback;
}

function normalizeFooterCta(value: NavigationGlobal["footerCta"]): SiteLink | undefined {
  if (!value?.enabled) return undefined;
  const label = value.label?.trim();
  const href = value.href?.trim();
  if (!label || !href) return undefined;
  return { label, href };
}
