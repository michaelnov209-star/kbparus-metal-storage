import { getCmsClient } from "./client";

export interface SiteContactPhone {
  label: string;
  href: string;
}

export interface SiteContacts {
  phones: SiteContactPhone[];
  email: { label: string; href: string };
  address: string;
  worktime: string;
  legalName: string;
  inn?: string;
  socials: {
    telegram?: string;
    whatsapp?: string;
    max?: string;
    vk?: string;
  };
}

export const DEFAULT_CONTACTS: SiteContacts = {
  phones: [
    { label: "+7 (499) 403-39-62", href: "tel:+74994033962" },
    { label: "+7 (495) 741-87-10", href: "tel:+74957418710" }
  ],
  email: { label: "info@kbparus.ru", href: "mailto:info@kbparus.ru" },
  address: "МО, г. Ногинск, 1-й Кардолентный проезд, д. 5",
  worktime: "Пн–Пт 9:00–18:00",
  legalName: "ООО «Технокам»",
  socials: {}
};

export interface SiteSocialLinkInput {
  platform?: string | null;
  url?: string | null;
}

const SAFE_SOCIAL_PROTOCOLS = new Set(["https:"]);

interface ContactsGlobal {
  phones?: Array<{ number?: string | null }> | null;
  email?: string | null;
  workingHours?: string | null;
  address?: string | null;
  legalName?: string | null;
  inn?: string | null;
  socials?: SiteSocialLinkInput[] | null;
}

function phoneHref(value: string): string {
  const normalized = value.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : DEFAULT_CONTACTS.phones[0].href;
}

function emailHref(value: string): string {
  return `mailto:${value}`;
}

export function mapContactSocials(items: ContactsGlobal["socials"]): SiteContacts["socials"] {
  const socials: SiteContacts["socials"] = { ...DEFAULT_CONTACTS.socials };
  for (const item of items || []) {
    if (!item?.platform || !item.url) continue;
    let safeUrl: string;
    try {
      const parsed = new URL(item.url.trim());
      if (!SAFE_SOCIAL_PROTOCOLS.has(parsed.protocol)) continue;
      safeUrl = parsed.toString();
    } catch {
      continue;
    }

    if (item.platform === "telegram") socials.telegram = safeUrl;
    if (item.platform === "whatsapp") socials.whatsapp = safeUrl;
    if (item.platform === "max") socials.max = safeUrl;
    if (item.platform === "vk") socials.vk = safeUrl;
  }
  return socials;
}

export async function getSiteContacts(): Promise<SiteContacts> {
  const cms = await getCmsClient();
  if (!cms) return DEFAULT_CONTACTS;

  try {
    const contacts = (await cms.findGlobal({ slug: "contacts", depth: 1 })) as ContactsGlobal | null;
    if (!contacts) return DEFAULT_CONTACTS;

    const phones =
      contacts.phones
        ?.map((phone) => phone?.number?.trim())
        .filter((phone): phone is string => Boolean(phone))
        .map((phone) => ({ label: phone, href: phoneHref(phone) })) || [];

    const email = contacts.email?.trim();

    return {
      phones: phones.length > 0 ? phones : DEFAULT_CONTACTS.phones,
      email: email ? { label: email, href: emailHref(email) } : DEFAULT_CONTACTS.email,
      address: contacts.address?.trim() || DEFAULT_CONTACTS.address,
      worktime: contacts.workingHours?.trim() || DEFAULT_CONTACTS.worktime,
      legalName: contacts.legalName?.trim() || DEFAULT_CONTACTS.legalName,
      inn: contacts.inn?.trim() || undefined,
      socials: mapContactSocials(contacts.socials)
    };
  } catch (error) {
    console.warn("[cms] getSiteContacts failed:", error);
    return DEFAULT_CONTACTS;
  }
}
