import { describe, expect, it } from "vitest";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import { categorySeoGuides } from "@/data/storageSystems/categorySeoGuides";

describe("fallback category SEO guides", () => {
  it("contains one guide for every fallback category and no orphaned guides", () => {
    const catalogIds = excelHomeCatalog.map((category) => category.id).sort();
    const guideIds = Object.keys(categorySeoGuides).sort();

    expect(guideIds).toEqual(catalogIds);
    expect(guideIds).toHaveLength(17);
  });

  it("keeps every guide substantial and within the editorial structure", () => {
    for (const [categoryId, guide] of Object.entries(categorySeoGuides)) {
      expect(guide.intro, `${categoryId}: intro`).toHaveLength(2);
      expect(guide.selectionCriteria.length, `${categoryId}: selectionCriteria`).toBeGreaterThanOrEqual(3);
      expect(guide.selectionCriteria.length, `${categoryId}: selectionCriteria`).toBeLessThanOrEqual(5);
      expect(guide.suitableFor.length, `${categoryId}: suitableFor`).toBeGreaterThanOrEqual(3);
      expect(guide.suitableFor.length, `${categoryId}: suitableFor`).toBeLessThanOrEqual(5);
      expect(guide.integrationNotes.length, `${categoryId}: integrationNotes`).toBeGreaterThanOrEqual(2);
      expect(guide.integrationNotes.length, `${categoryId}: integrationNotes`).toBeLessThanOrEqual(3);

      for (const paragraph of guide.intro) {
        expect(paragraph.trim().length, `${categoryId}: short intro paragraph`).toBeGreaterThanOrEqual(180);
      }

      for (const item of [
        ...guide.selectionCriteria,
        ...guide.suitableFor,
        ...guide.integrationNotes
      ]) {
        expect(item.trim().length, `${categoryId}: short list item`).toBeGreaterThanOrEqual(45);
      }
    }
  });

  it("does not reuse paragraphs or list items between category guides", () => {
    const normalizedFragments = Object.values(categorySeoGuides).flatMap((guide) =>
      [
        ...guide.intro,
        ...guide.selectionCriteria,
        ...guide.suitableFor,
        ...guide.integrationNotes
      ].map((fragment) => fragment.toLocaleLowerCase("ru-RU").replaceAll(/\s+/g, " ").trim())
    );

    expect(new Set(normalizedFragments).size).toBe(normalizedFragments.length);
  });

  it("does not contain unsupported commercial or certification claims", () => {
    const text = JSON.stringify(categorySeoGuides).toLocaleLowerCase("ru-RU");

    expect(text).not.toMatch(
      /окупаемост|гарантирован|сертификат|гост|лидер рынка|лучший|№\s*1|процент|поставлено|реализовано/
    );
  });
});
