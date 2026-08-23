import { readdirSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminSectionHero, type AdminSectionKey } from "@/app/(payload)/components/AdminSectionHero";
import { allCollections, allGlobals } from "./helpers/admin-configs";

const HERO_PATH = "@/app/(payload)/components/AdminSectionHero";

const sectionBySlug: Record<string, AdminSectionKey> = {
  "calculator-profiles": "calculator",
  categories: "categories",
  contacts: "contacts",
  "home-content": "home",
  leads: "leads",
  "lead-management": "lead-management",
  media: "media",
  products: "products",
  "site-navigation": "navigation",
  subcategories: "subcategories",
  users: "users"
};

const titleBySection: Record<AdminSectionKey, string> = {
  calculator: "Профили калькулятора",
  categories: "Категории оборудования",
  contacts: "Контакты компании",
  home: "Главная страница",
  leads: "Входящие заявки",
  "lead-management": "Формы и доставка заявок",
  media: "Медиа-библиотека",
  navigation: "Меню и подвал",
  products: "Товары и решения",
  subcategories: "Подкатегории",
  users: "Команда и доступы"
};

function componentPath(component: unknown): string | undefined {
  return component &&
    typeof component === "object" &&
    "path" in component &&
    typeof component.path === "string"
    ? component.path
    : undefined;
}

function componentSection(component: unknown): unknown {
  return component &&
    typeof component === "object" &&
    "serverProps" in component &&
    component.serverProps &&
    typeof component.serverProps === "object" &&
    "section" in component.serverProps
    ? component.serverProps.section
    : undefined;
}

function heroComponentFromField(field: unknown): unknown {
  if (!field || typeof field !== "object") return undefined;
  const admin = "admin" in field ? field.admin : undefined;
  if (!admin || typeof admin !== "object" || !("components" in admin)) {
    return undefined;
  }
  const components = admin.components;
  return components &&
    typeof components === "object" &&
    "Field" in components
    ? components.Field
    : undefined;
}

describe("unified premium headers in the admin", () => {
  it("keeps every source config registered in the live Payload configuration", () => {
    const collectionFiles = readdirSync(
      new URL("../payload/collections/", import.meta.url)
    ).filter((name) => name.endsWith(".ts"));
    const globalFiles = readdirSync(
      new URL("../payload/globals/", import.meta.url)
    ).filter((name) => name.endsWith(".ts"));

    expect(allCollections).toHaveLength(collectionFiles.length);
    expect(allGlobals).toHaveLength(globalFiles.length);
    expect(new Set(allCollections.map((config) => config.slug)).size).toBe(
      allCollections.length
    );
    expect(new Set(allGlobals.map((config) => config.slug)).size).toBe(
      allGlobals.length
    );
  });

  it("discovers every collection and verifies its list header and section mapping", () => {
    expect(allCollections.length).toBeGreaterThanOrEqual(7);

    for (const collection of allCollections) {
      const expectedSection = sectionBySlug[collection.slug];
      expect(expectedSection, `${collection.slug} has no section mapping`).toBeTruthy();

      const hero = (collection.admin?.components?.beforeList ?? []).find(
        (component) => componentPath(component) === HERO_PATH
      );
      expect(hero, `${collection.slug} list has no section header`).toBeTruthy();
      expect(componentSection(hero)).toBe(expectedSection);
    }
  });

  it("verifies standard edit headers and dedicated complex editors", () => {
    const dedicatedEditors: Record<string, string> = {
      "calculator-profiles":
        "@/app/(payload)/components/CalculatorProfileGuide",
      products: "@/app/(payload)/components/ProductEditorGuide"
    };

    for (const config of [...allCollections, ...allGlobals]) {
      const firstUiComponent = config.fields
        .map(heroComponentFromField)
        .find(Boolean);
      const expectedDedicatedPath = dedicatedEditors[config.slug];

      if (expectedDedicatedPath) {
        expect(componentPath(firstUiComponent)).toBe(expectedDedicatedPath);
        continue;
      }

      const hero = config.fields
        .map(heroComponentFromField)
        .find((component) => componentPath(component) === HERO_PATH);
      expect(hero, `${config.slug} edit screen has no section header`).toBeTruthy();
      expect(componentSection(hero)).toBe(sectionBySlug[config.slug]);
    }
  });

  it("renders meaningful copy and a real icon for every section", () => {
    for (const section of Object.values(sectionBySlug)) {
      const markup = renderToStaticMarkup(
        createElement(AdminSectionHero, { section })
      );

      expect(markup).toContain(titleBySection[section]);
      expect(markup).toContain("<svg");
      expect(markup).toContain(`aria-labelledby="kb-admin-${section}-title"`);
      expect(markup).not.toContain("Настройки и данные сайта.");
    }
  });
});
