import type { CatalogProduct } from "@/data/storageSystems/catalogDepth";
import { formatRoundedRub } from "@/lib/calculator/format";

type ProductPriceFields = Pick<
  CatalogProduct,
  "priceFrom" | "priceLabel" | "priceMode" | "priceTo"
>;

export function getProductPriceLabel(product: ProductPriceFields) {
  const customLabel = product.priceLabel?.trim();
  if (customLabel) return customLabel;

  if (
    product.priceMode === "fixed" &&
    typeof product.priceFrom === "number" &&
    product.priceFrom > 0
  ) {
    if (
      typeof product.priceTo === "number" &&
      product.priceTo > product.priceFrom
    ) {
      return `от ${formatRoundedRub(product.priceFrom)} до ${formatRoundedRub(product.priceTo)}`;
    }

    return `от ${formatRoundedRub(product.priceFrom)}`;
  }

  return "Цена по запросу";
}
