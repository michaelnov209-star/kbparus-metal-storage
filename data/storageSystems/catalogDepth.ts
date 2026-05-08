import { visualAssets } from "./visualAssets";
import type { CalculatorProfileId } from "./excelCalculator";

export type ProductPageMode = "configurator" | "standard";
export type ProductPriceMode = "request" | "fixed";

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
  subcategoryId?: string;
  title: string;
  shortTitle: string;
  sku: string;
  image: string;
  gallery: string[];
  pageMode: ProductPageMode;
  /**
   * Future CMS behavior:
   * - pageMode "standard": regular product card, calculatorProfileId must stay empty.
   * - pageMode "configurator": product page renders a calculator bound to this profile.
   */
  calculatorProfileId?: CalculatorProfileId;
  priceMode: ProductPriceMode;
  priceFrom?: number;
  badge: string;
  summary: string;
  description: string;
  applications: string[];
  specs: Array<{ label: string; value: string }>;
  includes: string[];
  documents?: Array<{ title: string; href: string }>;
  referenceUrl?: string;
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
    id: "compact-3000x1500",
    categoryId: "auto-sheet-metal",
    title: "Автоматизированная система для хранения листового металла Compact 3000x1500",
    shortTitle: "Compact 3000x1500",
    sku: "KBP-SHM-COMPACT-3000-1500",
    image: "/assets/images/products/auto-sheet-metal/1.1.jpg",
    gallery: [
      "/assets/images/products/auto-sheet-metal/1.1.jpg",
      "/assets/images/products/auto-sheet-metal/1.2.jpg",
      "/assets/images/products/auto-sheet-metal/1.3.jpg"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Товар",
    summary: "Компактная автоматизированная система для хранения листового металла формата 3000x1500.",
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
      { label: "Формат листа", value: "3000x1500 мм" }
    ],
    includes: [
      "подбор ДхШхВ по ходовым значениям",
      "расчет нагрузки на уровни и опоры",
      "выбор количества полок и башен",
      "дополнительные опции безопасности и подачи"
    ]
  },
  {
    id: "logic-sheet-metal-storage",
    categoryId: "auto-sheet-metal",
    title: "Автоматизированная система для хранения листового металла Logic",
    shortTitle: "Logic",
    sku: "KBP-SHM-LOGIC",
    image: "/assets/images/products/auto-sheet-metal/2.1.jpg",
    gallery: [
      "/assets/images/products/auto-sheet-metal/2.1.jpg",
      "/assets/images/products/auto-sheet-metal/2.2.jpg",
      "/assets/images/products/auto-sheet-metal/2.3.jpg",
      "/assets/images/products/auto-sheet-metal/2.4.jpg"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Товар",
    summary: "Стандартное решение для автоматизированного хранения листового металла и подачи в производство.",
    description:
      "Logic подходит для производств, где нужно организовать понятное хранение листового металла и быстро выдавать материал в работу. Конфигурация подбирается по размерам листа, нагрузке, количеству полок, башен и опций безопасности.",
    applications: [
      "склад листового металла при станках резки",
      "производство металлоконструкций",
      "заготовительные участки с большим оборотом",
      "цеха, где важно сократить хаос на полу"
    ],
    specs: [
      { label: "Материал", value: "листовой металл" },
      { label: "Нагрузка", value: "до 5 000 кг на уровень" },
      { label: "Длина листа", value: "до 6 100 мм" },
      { label: "Линейка", value: "Logic" }
    ],
    includes: [
      "подбор вместимости под номенклатуру",
      "расчет нагрузки на кассеты и опоры",
      "выбор количества полок и башен",
      "подготовка данных для инженерного предложения"
    ]
  },
  {
    id: "spider-sheet-metal-storage",
    categoryId: "auto-sheet-metal",
    title: "Автоматизированная система для хранения листового металла Spider",
    shortTitle: "Spider",
    sku: "KBP-SHM-SPIDER",
    image: "/assets/images/products/auto-sheet-metal/3.1.jpg",
    gallery: [
      "/assets/images/products/auto-sheet-metal/3.1.jpg",
      "/assets/images/products/auto-sheet-metal/3.2.jpg",
      "/assets/images/products/auto-sheet-metal/3.3.jpg",
      "/assets/images/products/auto-sheet-metal/3.4.jpg"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Товар",
    summary: "Гибкая автоматизированная система хранения листового металла для сложных производственных сценариев.",
    description:
      "Spider используется там, где важно гибко организовать хранение, выдачу и подачу листового металла под разные производственные маршруты. Вместимость, количество кассет и опции уточняются после инженерной проверки.",
    applications: [
      "крупные металлообрабатывающие производства",
      "склады с большим оборотом листа",
      "производство металлоконструкций",
      "централизованная подача листа на несколько участков"
    ],
    specs: [
      { label: "Материал", value: "листовой металл" },
      { label: "Линейка", value: "Spider" },
      { label: "Нагрузка", value: "подбирается расчетом" },
      { label: "Исполнение", value: "двухбашенное" }
    ],
    includes: [
      "расчет вместимости склада",
      "проверка нагрузки на пол",
      "подбор кассет и башен",
      "инженерная проверка безопасности"
    ]
  },
  {
    id: "cross-sheet-metal-storage",
    categoryId: "auto-sheet-metal",
    title: "Автоматизированная система для хранения листового металла Cross",
    shortTitle: "Cross",
    sku: "KBP-SHM-CROSS",
    image: "/assets/images/products/auto-sheet-metal/4.1.jpg",
    gallery: [
      "/assets/images/products/auto-sheet-metal/4.1.jpg",
      "/assets/images/products/auto-sheet-metal/4.2.jpg",
      "/assets/images/products/auto-sheet-metal/4.3.jpg"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Товар",
    summary: "Автоматизированная система для хранения листового металла с удобной подачей и организацией складского потока.",
    description:
      "Cross помогает организовать хранение листового металла, когда нужно связать склад, выдачу и производственный участок в понятный поток без хаоса на полу.",
    applications: [
      "цеха с ограниченной площадью",
      "буфер листового металла возле производства",
      "участки резки и гибки",
      "склады с регулярной выдачей листа"
    ],
    specs: [
      { label: "Материал", value: "листовой металл" },
      { label: "Линейка", value: "Cross" },
      { label: "Нагрузка", value: "подбирается расчетом" },
      { label: "Исполнение", value: "двухбашенное" }
    ],
    includes: [
      "подбор под размеры листа",
      "расчет количества кассет",
      "проверка способа загрузки",
      "подготовка предложения инженером"
    ]
  }
];

const productContentEnhancements: Record<string, Partial<CatalogProduct>> = {
  "compact-3000x1500": {
    summary: "Компактная автоматизированная башенная система для листового металла формата 3000x1500 мм.",
    description:
      "Compact подходит для участка резки или заготовки, где листовой металл нужно хранить рядом с производством, быстро выдавать паллету оператору и освободить проходы от пачек металла. Конфигурация подбирается по высоте помещения, весу пачки, способу загрузки и требованиям безопасности.",
    specs: [
      { label: "Формат листа", value: "до 3000x1500 мм" },
      { label: "Высота пачки", value: "до 90 мм на полке" },
      { label: "Нагрузка на полку", value: "до 3 000 кг" },
      { label: "Количество полок", value: "15" },
      { label: "Вместимость", value: "до 45 000 кг" },
      { label: "Габариты ориентира", value: "4596x2905x3800 мм" },
      { label: "Скорость подъема", value: "до 10 м/мин" },
      { label: "Мощность", value: "около 3 кВт" }
    ],
    includes: [
      "проверка формата листа и высоты пачки",
      "расчет нагрузки на полки и опоры",
      "подбор высоты башни под помещение",
      "уточнение способа загрузки и зоны обслуживания"
    ],
    referenceUrl: "https://mossklad.ru/_PRODUCTPAGE/2862641"
  },
  "logic-sheet-metal-storage": {
    summary: "Стандартное решение для загрузки, выгрузки и хранения листового металла в производственном потоке.",
    description:
      "Logic используют там, где нужен понятный автоматизированный склад листа с регулярной выдачей материала в работу. Система подбирается под формат листа, нагрузку на полку, количество уровней и требуемую скорость подачи.",
    specs: [
      { label: "Формат листа", value: "1500x3000 / 2000x4000 / 2000x6000 / 2500x6000 мм" },
      { label: "Высота пачки", value: "до 90 мм" },
      { label: "Нагрузка на полку", value: "3 000 или 5 000 кг" },
      { label: "Количество полок", value: "24-62" },
      { label: "Высота башни", value: "4050-9250 мм" },
      { label: "Скорость подъема", value: "5 / 10 / 20 м/мин" },
      { label: "Мощность", value: "1,5 / 2,2 / 3 кВт" },
      { label: "Сценарий", value: "склад листа рядом с производством" }
    ],
    includes: [
      "подбор формата листа и количества уровней",
      "проверка нагрузки 3 или 5 тонн на полку",
      "оценка высоты башни под помещение",
      "подготовка исходных данных для инженерного предложения"
    ],
    referenceUrl: "https://mossklad.ru/_PRODUCTPAGE/2140361"
  },
  "spider-sheet-metal-storage": {
    summary: "Гибкая автоматизированная система хранения листового металла для больших складов и сложных маршрутов подачи.",
    description:
      "Spider подходит для производств, где нужно хранить много листового металла разных форматов и организовать выдачу материала в несколько рабочих зон. Система может проектироваться с одной или двумя башнями и масштабироваться под крупный складской поток.",
    specs: [
      { label: "Формат листа", value: "от 1500x3000 до 3000x12000 мм" },
      { label: "Количество башен", value: "1 или 2" },
      { label: "Количество полок", value: "31-154" },
      { label: "Высота системы", value: "6,2-14,7 м" },
      { label: "Нагрузка на полку", value: "до 5 000 кг" },
      { label: "Интеграция", value: "возможна связь с учетной системой" },
      { label: "Сценарий", value: "централизованная подача листа" },
      { label: "Тип проекта", value: "индивидуальная конфигурация" }
    ],
    includes: [
      "расчет вместимости склада",
      "выбор одной или двух башен",
      "проверка нагрузки на пол и опоры",
      "подбор сценария подачи к рабочим зонам"
    ],
    referenceUrl: "https://mossklad.ru/_PRODUCTPAGE/2142181"
  },
  "cross-sheet-metal-storage": {
    summary: "Автоматизированная система хранения и выдачи листового металла для связи склада со станками обработки.",
    description:
      "Cross помогает связать склад листового металла, выдачу и производственный участок в единый поток. Решение используют, когда важно быстро подавать лист к станкам, уменьшить перемещения по цеху и убрать хаотичное хранение материала на полу.",
    specs: [
      { label: "Формат листа", value: "от 1500x3000 до 3000x12000 мм" },
      { label: "Количество полок", value: "26-75" },
      { label: "Высота башни", value: "5,4-14,5 м" },
      { label: "Нагрузка на полку", value: "до 5 000 кг" },
      { label: "Состав системы", value: "кран, полки, стеллажная конструкция" },
      { label: "Сценарий", value: "связь склада и станков" },
      { label: "Поток", value: "автоматическая выдача листа" },
      { label: "Тип проекта", value: "индивидуальная конфигурация" }
    ],
    includes: [
      "подбор под формат листа и станки",
      "расчет количества полок",
      "проверка маршрута подачи",
      "подготовка предложения инженером"
    ],
    referenceUrl: "https://mossklad.ru/_PRODUCTPAGE/2143051"
  }
};

function enrichProduct(product: CatalogProduct): CatalogProduct {
  return { ...product, ...productContentEnhancements[product.id] };
}

export function getSubcategoriesByCategory(categoryId: string) {
  return catalogSubcategories.filter((item) => item.categoryId === categoryId);
}

export function getProductsByCategory(categoryId: string) {
  return catalogProducts.filter((item) => item.categoryId === categoryId).map(enrichProduct);
}

export function getProductsBySubcategory(categoryId: string, subcategoryId: string) {
  return catalogProducts.filter((item) => item.categoryId === categoryId && item.subcategoryId === subcategoryId).map(enrichProduct);
}

export function getCatalogProduct(categoryId: string, productId: string) {
  const product = catalogProducts.find((item) => item.categoryId === categoryId && item.id === productId);
  return product ? enrichProduct(product) : undefined;
}
