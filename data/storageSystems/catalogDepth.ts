import { visualAssets } from "./visualAssets";
import type { CalculatorProfileId } from "./excelCalculator";

export type ProductPageMode = "configurator" | "standard";

export interface CatalogSubcategory {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  image: string;
}

export interface CatalogProduct {
  id: string;
  categoryId: string;
  subcategoryId: string;
  title: string;
  shortTitle: string;
  sku: string;
  image: string;
  gallery: string[];
  pageMode: ProductPageMode;
  calculatorProfileId?: CalculatorProfileId;
  priceFrom?: number;
  badge: string;
  summary: string;
  description: string;
  applications: string[];
  specs: Array<{ label: string; value: string }>;
  includes: string[];
}

export const catalogSubcategories: CatalogSubcategory[] = [
  {
    id: "automatic-sheet-towers",
    categoryId: "auto-sheet-metal",
    title: "Автоматические стеллажи для листового металла",
    summary: "Башенные системы с подбором размеров, нагрузки, количества полок, башен и инженерных опций.",
    image: "/assets/images/catalog/01-auto-sheet-metal.jpg"
  },
  {
    id: "sheet-metal-modules",
    categoryId: "auto-sheet-metal",
    title: "Модульные системы хранения листа",
    summary: "Готовые решения для участков резки, гибки и комплектации, где не требуется большой конфигуратор.",
    image: visualAssets.sheetMetal
  }
];

export const catalogProducts: CatalogProduct[] = [
  {
    id: "automatic-sheet-metal-rack",
    categoryId: "auto-sheet-metal",
    subcategoryId: "automatic-sheet-towers",
    title: "Автоматический стеллаж листового металла",
    shortTitle: "Автоматический стеллаж листа",
    sku: "KBP-SHM-AUTO-LIST",
    image: "/assets/images/catalog/01-auto-sheet-metal.jpg",
    gallery: ["/assets/images/catalog/01-auto-sheet-metal.jpg"],
    pageMode: "configurator",
    calculatorProfileId: "auto-sheet-metal",
    badge: "Калькулятор",
    summary: "Система для хранения листового металла с выбором ходовых размеров, нагрузки, количества полок, башен и опций.",
    description:
      "Подходит для производств, где листовой металл нужно хранить компактно, быстро выдавать в работу и безопасно обслуживать кран-балкой или погрузчиком. На странице товара клиент сразу подбирает основные параметры и получает стоимость в формате от.",
    applications: [
      "участки лазерной и плазменной резки",
      "металлообработка и заготовительное производство",
      "склады листового металла",
      "производство металлоконструкций"
    ],
    specs: [
      { label: "Материал", value: "листовой металл" },
      { label: "Нагрузка", value: "до 5 000 кг на уровень" },
      { label: "Длина листа", value: "2 600 / 3 100 / 6 100 мм" },
      { label: "Исполнение", value: "автоматизированное" }
    ],
    includes: [
      "подбор ДхШхВ по ходовым значениям",
      "расчет нагрузки на уровни и опоры",
      "выбор количества полок и башен",
      "дополнительные опции безопасности и подачи"
    ]
  },
  {
    id: "automatic-sheet-buffer-module",
    categoryId: "auto-sheet-metal",
    subcategoryId: "sheet-metal-modules",
    title: "Буферный модуль хранения листового металла",
    shortTitle: "Буферный модуль листа",
    sku: "KBP-SHM-BUFFER-LIST",
    image: visualAssets.sheetMetal,
    gallery: [visualAssets.sheetMetal],
    pageMode: "standard",
    priceFrom: 1250000,
    badge: "Под заказ",
    summary: "Модуль для аккуратного хранения пачек листа рядом с производственным участком без сложной автоматизации.",
    description:
      "Используется как промежуточная зона хранения листового металла перед резкой, гибкой или комплектацией. Конструкция подбирается под размеры помещения, способ загрузки и требуемую грузоподъемность.",
    applications: [
      "буфер перед линией резки",
      "хранение сменного запаса листа",
      "участки ручной комплектации",
      "производства с ограниченной площадью"
    ],
    specs: [
      { label: "Материал", value: "лист, пачки листа" },
      { label: "Загрузка", value: "кран-балка или погрузчик" },
      { label: "Исполнение", value: "под размеры помещения" },
      { label: "Поставка", value: "производство, доставка, монтаж" }
    ],
    includes: [
      "проектирование под помещение",
      "расчет грузоподъемности",
      "покраска в корпоративный цвет",
      "подготовка к будущему расширению"
    ]
  }
];

export function getSubcategoriesByCategory(categoryId: string) {
  return catalogSubcategories.filter((item) => item.categoryId === categoryId);
}

export function getProductsByCategory(categoryId: string) {
  return catalogProducts.filter((item) => item.categoryId === categoryId);
}

export function getProductsBySubcategory(categoryId: string, subcategoryId: string) {
  return catalogProducts.filter((item) => item.categoryId === categoryId && item.subcategoryId === subcategoryId);
}

export function getCatalogProduct(categoryId: string, productId: string) {
  return catalogProducts.find((item) => item.categoryId === categoryId && item.id === productId);
}
