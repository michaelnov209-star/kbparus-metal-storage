import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("product editor field guidance", () => {
  const helpLabel = source("app/(payload)/components/AdminHelpLabel.tsx");
  const guide = source("app/(payload)/components/ProductEditorGuide.tsx");
  const styles = source("app/(payload)/components/product-editor.scss");
  const products = source("payload/collections/Products.ts");

  it("restores the configured field label and required marker in custom help labels", () => {
    expect(helpLabel).toContain("labelProps.label ?? field?.label");
    expect(helpLabel).toContain("labelProps.required ?? field?.required ?? false");
    expect(helpLabel).toContain(
      "<FieldLabel {...labelProps} label={label} required={required} />"
    );
  });

  it("keeps the main product inputs explicitly named in Russian", () => {
    for (const label of [
      "Название товара",
      "Раздел каталога",
      "Подраздел (необязательно)",
      "Кратко: польза товара",
      "Подробное описание",
      "Как показывать цену",
      "Стоимость от, ₽",
      "Что показать на странице товара",
      "Калькулятор на странице товара"
    ]) {
      expect(products).toContain(`ru: "${label}"`);
    }
  });

  it("shows the calculator assignment in the product editor and list", () => {
    expect(products).toContain('name: "calculatorBindingStatus"');
    expect(products).toContain("ProductCalculatorBindingStatus");
    expect(products).toContain("ProductCalculatorProfileCell");
  });

  it("uses short complete step hints and allows them to wrap instead of truncating", () => {
    for (const hint of [
      "Название и польза",
      "Главное фото и ракурсы",
      "Цена и параметры",
      "SEO и публикация"
    ]) {
      expect(guide).toContain(`<small>${hint}</small>`);
    }

    expect(styles).toMatch(
      /\.product-editor-guide__steps small\s*\{[^}]*overflow-wrap:\s*anywhere;[^}]*white-space:\s*normal;/
    );
    expect(styles).not.toMatch(
      /\.product-editor-guide__steps small\s*\{[^}]*text-overflow:\s*ellipsis;/
    );
  });
});
