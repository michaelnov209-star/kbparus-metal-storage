import type { Field } from "payload";
import type { AdminSectionKey } from "../../app/(payload)/components/AdminSectionHero";

const ADMIN_SECTION_HERO_PATH =
  "@/app/(payload)/components/AdminSectionHero";

export function adminSectionHero(
  section: AdminSectionKey
) {
  return {
    path: ADMIN_SECTION_HERO_PATH,
    exportName: "AdminSectionHero",
    serverProps: { section }
  } as const;
}

export function adminSectionHeroField(
  section: AdminSectionKey
): Field {
  return {
    name: `adminSectionHero_${section.replaceAll("-", "_")}`,
    type: "ui",
    admin: {
      components: {
        Field: adminSectionHero(section)
      }
    }
  };
}
