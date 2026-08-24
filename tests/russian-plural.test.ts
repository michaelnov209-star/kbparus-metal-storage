import { describe, expect, it } from "vitest";
import { pluralRu } from "@/lib/text/russian-plural";

describe("pluralRu", () => {
  it("formats Russian product counters correctly", () => {
    const label = (count: number) =>
      pluralRu(
        count,
        "товар в разделе",
        "товара в разделе",
        "товаров в разделе"
      );

    expect(label(1)).toBe("товар в разделе");
    expect(label(2)).toBe("товара в разделе");
    expect(label(4)).toBe("товара в разделе");
    expect(label(5)).toBe("товаров в разделе");
    expect(label(9)).toBe("товаров в разделе");
    expect(label(11)).toBe("товаров в разделе");
    expect(label(21)).toBe("товар в разделе");
  });
});
