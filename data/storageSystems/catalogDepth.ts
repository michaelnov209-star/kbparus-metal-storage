import { visualAssets } from "./visualAssets";
import type { CalculatorProfileId } from "./excelCalculator";

export type ProductPageMode = "configurator" | "standard";
export type ProductPriceMode = "request" | "fixed";

/**
 * SEO-поля для категорий и товаров.
 * Все опциональные с разумными дефолтами (title → seoTitle, summary → seoDescription, image → ogImage).
 * Эти поля будут редактируемыми из CMS-админки (Этап 2 интеграции Sanity).
 */
export interface SeoOverrides {
  /** Кастомный <title> страницы. По умолчанию = title. */
  seoTitle?: string;
  /** Кастомное meta description. По умолчанию = summary. До 160 символов. */
  seoDescription?: string;
  /** Кастомная Open Graph картинка. По умолчанию = image. */
  ogImage?: string;
  /** Ключевые слова через запятую — для meta keywords и для контент-стратегии. */
  keywords?: string[];
  /** Если true — страница исключается из индексации (`<meta name="robots" content="noindex">`). */
  noIndex?: boolean;
  /** Канонический URL, если страница доступна по нескольким URL. */
  canonicalUrl?: string;
}

export interface CatalogSubcategory extends SeoOverrides {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  image: string;
  /** Если true — подкатегория показывается в featured-блоке на главной странице категории. */
  featured?: boolean;
  /** Sort order — меньшее число = выше в списке. По умолчанию = порядок в массиве. */
  sortOrder?: number;
}

export interface CatalogProduct extends SeoOverrides {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  title: string;
  shortTitle: string;
  sku: string;
  image: string;
  imageAlt?: string;
  imageThumb?: string;
  imageMedium?: string;
  imageLarge?: string;
  gallery: string[];
  galleryAlts?: string[];
  galleryThumbs?: string[];
  galleryMediums?: string[];
  galleryLarges?: string[];
  pageMode: ProductPageMode;
  /**
   * Future CMS behavior:
   * - pageMode "standard": regular product card, calculatorProfileId must stay empty.
   * - pageMode "configurator": product page renders a calculator bound to this profile.
   */
  calculatorProfileId?: CalculatorProfileId;
  priceMode: ProductPriceMode;
  /** Минимальная цена «от X». Используется в Schema.org Product Offer. */
  priceFrom?: number;
  /** Максимальная цена для отображения диапазона «от X до Y» (опционально). */
  priceTo?: number;
  /** Кастомный лейбл цены (например, «Договорная»), если нужно переопределить отображение. */
  priceLabel?: string;
  badge: string;
  summary: string;
  description: string;
  applications: string[];
  specs: Array<{ label: string; value: string }>;
  includes: string[];
  documents?: Array<{ title: string; href: string }>;
  referenceUrl?: string;
  modelName?: string;
  operationMode?: "manual" | "mechanized" | "automated";
  storageMaterials?: Array<
    | "sheet-metal"
    | "pipes"
    | "profiles"
    | "pallets"
    | "tooling"
    | "parts"
    | "cable"
    | "mixed"
  >;
  loadingMethods?: Array<
    "manual" | "forklift" | "stacker" | "crane" | "vacuum" | "extractor"
  >;
  maxLoadKg?: number;
  warrantyMonths?: number;
  overallDimensions?: {
    lengthMm?: number;
    widthMm?: number;
    heightMm?: number;
  };
  installationEnvironments?: Array<
    "workshop" | "warehouse" | "covered-outdoor" | "outdoor"
  >;
  /** Featured-товар показывается в верхней части категории. */
  featured?: boolean;
  /** Sort order — меньшее число = выше в списке. */
  sortOrder?: number;
  /** Скрыть товар без удаления (для подготовки к публикации). */
  draft?: boolean;
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
  },
  {
    id: "manual-sheet-cassette-systems",
    categoryId: "manual-sheet-metal",
    title: "Кассетные системы хранения листа",
    summary: "Кассеты под погрузчик, выкатные и гибридные стеллажи для оперативного доступа к листовому металлу.",
    image: "/assets/images/catalog/02-manual-sheet-metal-safe.png"
  },
  {
    id: "manual-sheet-vertical-systems",
    categoryId: "manual-sheet-metal",
    title: "Вертикальные системы и пирамиды",
    summary: "Стационарные и передвижные решения для вертикального хранения листового металла на ограниченной площади.",
    image: "/assets/images/catalog/02-manual-sheet-metal-safe.png"
  },
  {
    id: "manual-sort-fishbone",
    categoryId: "manual-sort-and-pipe-storage",
    title: "Стеллажи типа «Ёлочка»",
    summary: "Двусторонние и односторонние ёлочки и пирамиды для длинномерного проката с боковой загрузкой.",
    image: "/assets/images/products/manual-sort-and-pipe-storage/4.4.png"
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
    pageMode: "configurator",
    calculatorProfileId: "auto-sheet-metal",
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
    pageMode: "configurator",
    calculatorProfileId: "auto-sheet-metal",
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
    pageMode: "configurator",
    calculatorProfileId: "auto-sheet-metal",
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
    pageMode: "configurator",
    calculatorProfileId: "auto-sheet-metal",
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
  },
  // === Категория 2: Ручные системы хранения листового металла (9 продуктов) ===
  {
    id: "forklift-cassette-rack",
    categoryId: "manual-sheet-metal",
    subcategoryId: "manual-sheet-cassette-systems",
    title: "Кассетный стеллаж под погрузчик",
    shortTitle: "Кассеты под погрузчик",
    sku: "KBP-MSM-FORKLIFT-CASS",
    image: "/assets/images/products/manual-sheet-metal/2.1-safe-studio.png",
    imageAlt: "Кассетный стеллаж с отдельными кассетами и карманами под вилочный погрузчик",
    gallery: [
      "/assets/images/products/manual-sheet-metal/2.1-safe-studio.png",
      "/assets/images/products/manual-sheet-metal/2.1-safe-detail.png"
    ],
    galleryAlts: [
      "Кассетный стеллаж под погрузчик — общий вид",
      "Съёмная кассета и закрытые карманы под вилы — детальный ракурс"
    ],
    pageMode: "configurator",
    calculatorProfileId: "forklift-cassette-rack",
    priceMode: "request",
    badge: "Под погрузчик",
    summary: "Кассетная система хранения листового металла, рассчитанная на загрузку и выгрузку вилочным погрузчиком.",
    description: "Решение для производств с активным оборотом листа, где обслуживание ведётся стандартным вилочным погрузчиком. Кассеты выдвигаются в зону работы и обеспечивают безопасный доступ к материалу.",
    applications: ["цеха с погрузчиком", "склады листа на средних объёмах", "участки лазерной резки"],
    specs: [
      { label: "Тип загрузки", value: "вилочный погрузчик" },
      { label: "Нагрузка на кассету", value: "до 5 000 кг" },
      { label: "Длина листа", value: "2 600 / 3 100 мм" }
    ],
    includes: ["подбор количества кассет", "расчёт нагрузки", "проверка зоны обслуживания"]
  },
  {
    id: "rollout-cassette-rack",
    categoryId: "manual-sheet-metal",
    subcategoryId: "manual-sheet-cassette-systems",
    title: "Стеллаж с выкатными кассетами",
    shortTitle: "Выкатные кассеты",
    sku: "KBP-MSM-ROLLOUT-CASS",
    image: "/assets/images/products/manual-sheet-metal/2.2-safe-studio.png",
    imageAlt: "Стеллаж с шестью закрытыми выкатными кассетами",
    gallery: [
      "/assets/images/products/manual-sheet-metal/2.2-safe-studio.png",
      "/assets/images/products/manual-sheet-metal/2.2-safe-action.png"
    ],
    galleryAlts: [
      "Стеллаж с выкатными кассетами — общий вид",
      "Одна кассета выдвинута на штатной боковой опорной раме"
    ],
    pageMode: "configurator",
    calculatorProfileId: "rollout-cassette-rack",
    priceMode: "request",
    badge: "Выкатной",
    summary: "Кассетный стеллаж с выкатными уровнями для удобного доступа к листовому металлу без погрузчика.",
    description: "Каждая кассета выкатывается в зону работы оператора. Подходит для участков, где нужен быстрый и безопасный доступ к листу без работы погрузчика внутри стеллажа.",
    applications: ["заготовительные участки", "цеха с краном-балкой", "склады с ограниченной площадью"],
    specs: [
      { label: "Тип доступа", value: "выкатной" },
      { label: "Нагрузка на кассету", value: "до 5 000 кг" },
      { label: "Исполнение", value: "одностороннее" }
    ],
    includes: ["подбор количества и нагрузки", "расчёт пространства для выкатывания", "опции безопасности"]
  },
  {
    id: "hybrid-rollout-rack",
    categoryId: "manual-sheet-metal",
    subcategoryId: "manual-sheet-cassette-systems",
    title: "Совмещённый (гибридный) стеллаж",
    shortTitle: "Гибридный стеллаж",
    sku: "KBP-MSM-HYBRID",
    image: "/assets/images/products/manual-sheet-metal/2.3-safe-studio.png",
    imageAlt: "Гибридный стеллаж с верхними кассетами под погрузчик и нижними выкатными кассетами",
    gallery: [
      "/assets/images/products/manual-sheet-metal/2.3-safe-studio.png",
      "/assets/images/products/manual-sheet-metal/2.3-safe-action.png"
    ],
    galleryAlts: ["Гибридный кассетный стеллаж — общий вид", "Безопасная работа с нижней выкатной кассетой"],
    pageMode: "configurator",
    calculatorProfileId: "hybrid-rollout-rack",
    priceMode: "request",
    badge: "Гибрид",
    summary: "Гибридный стеллаж с выдвижными кассетами и кассетами под погрузчик в одной конструкции.",
    description: "Сочетает оба способа работы: верхние ряды обслуживаются погрузчиком, нижние выкатываются для оператора. Универсальное решение для смешанных потоков.",
    applications: ["производства со смешанной номенклатурой", "цеха с разным потоком листа", "распределительные склады"],
    specs: [
      { label: "Тип доступа", value: "гибридный" },
      { label: "Верхние уровни", value: "погрузчик" },
      { label: "Нижние уровни", value: "выкатные кассеты" }
    ],
    includes: ["подбор соотношения уровней", "расчёт нагрузки", "интеграция в производственный поток"]
  },
  {
    id: "two-side-rollout-rack",
    categoryId: "manual-sheet-metal",
    subcategoryId: "manual-sheet-cassette-systems",
    title: "Стеллаж с выкатными кассетами двустороннего исполнения",
    shortTitle: "Двусторонние выкатные",
    sku: "KBP-MSM-2SIDE-ROLLOUT",
    image: "/assets/images/products/manual-sheet-metal/2.4-safe-studio.png",
    imageAlt: "Анкерованный двусторонний стеллаж с закрытыми кассетами",
    gallery: [
      "/assets/images/products/manual-sheet-metal/2.4-safe-studio.png",
      "/assets/images/products/manual-sheet-metal/2.4-safe-action.png"
    ],
    galleryAlts: ["Двусторонний стеллаж в закрытом положении", "Подача листа с единственной открытой кассеты"],
    pageMode: "configurator",
    calculatorProfileId: "two-side-rollout-rack",
    priceMode: "request",
    badge: "Двусторонний",
    summary: "Выкатной стеллаж с доступом к кассетам с обеих сторон и блокировкой одновременного открытия.",
    description: "Двустороннее исполнение позволяет организовать удобный доступ из двух проходов. В рабочее положение выводится только одна кассета: остальные уровни блокируются, чтобы снизить риск опрокидывания.",
    applications: ["цеха с двумя проходами обслуживания", "распределительные склады", "производства с высоким оборотом"],
    specs: [
      { label: "Доступ", value: "с двух сторон" },
      { label: "Безопасность", value: "одновременно открывается одна кассета" },
      { label: "Нагрузка на кассету", value: "до 5 000 кг" }
    ],
    includes: ["проверка свободного пространства с двух сторон", "подбор межблокировки кассет", "оптимизация потока"]
  },
  {
    id: "vertical-rollout-cassette",
    categoryId: "manual-sheet-metal",
    subcategoryId: "manual-sheet-vertical-systems",
    title: "Стеллаж для вертикального хранения с выкатными кассетами",
    shortTitle: "Вертикальные выкатные",
    sku: "KBP-MSM-VERTICAL-ROLLOUT",
    image: "/assets/images/products/manual-sheet-metal/2.5-safe-studio.png",
    imageAlt: "Вертикальный выкатной кассетный стеллаж с одной рабочей кассетой",
    gallery: [
      "/assets/images/products/manual-sheet-metal/2.5-safe-studio.png",
      "/assets/images/products/manual-sheet-metal/2.5-safe-detail.png"
    ],
    galleryAlts: [
      "Вертикальный стеллаж с одной выдвинутой кассетой",
      "Направляющие и опоры вертикальной выкатной кассеты"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Вертикальный",
    summary: "Вертикальное хранение листового металла с выкатными кассетами для экономии площади.",
    description: "Лист размещается вертикально, что значительно уменьшает занимаемую площадь. Выкатные кассеты обеспечивают доступ к каждому листу без перебора пачки.",
    applications: ["цеха с ограниченной площадью", "архив листовых материалов", "склад редко используемого металла"],
    specs: [
      { label: "Ориентация листа", value: "вертикальная" },
      { label: "Доступ к листу", value: "выкатной" },
      { label: "Экономия площади", value: "до 60% против горизонтального" }
    ],
    includes: ["подбор высоты помещения", "расчёт количества кассет", "проверка способа загрузки"]
  },
  {
    id: "vertical-stationary",
    categoryId: "manual-sheet-metal",
    subcategoryId: "manual-sheet-vertical-systems",
    title: "Стеллаж вертикального хранения стационарный/передвижной",
    shortTitle: "Вертикальный стационарный",
    sku: "KBP-MSM-VERTICAL-STAT",
    image: "/assets/images/products/manual-sheet-metal/2.6-safe-studio.png",
    imageAlt: "Стационарный вертикальный стеллаж с разделителями для листового металла",
    gallery: [
      "/assets/images/products/manual-sheet-metal/2.6-safe-studio.png",
      "/assets/images/products/manual-sheet-metal/2.6-safe-detail.png"
    ],
    galleryAlts: [
      "Стационарный стеллаж вертикального хранения с двумя пачками листа",
      "Опоры, ограничители и анкер стационарного вертикального стеллажа"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Вертикальный",
    summary: "Стационарное или передвижное вертикальное хранение листового металла без выкатных уровней.",
    description: "Базовое вертикальное хранение для случаев, когда лист не нужно часто перебирать. Существуют стационарные и передвижные исполнения для гибкости планировки склада.",
    applications: ["долгосрочное хранение листа", "архив редко используемого металла", "буферный склад"],
    specs: [
      { label: "Исполнение", value: "стационарное / передвижное" },
      { label: "Ориентация листа", value: "вертикальная" },
      { label: "Тип доступа", value: "ручной" }
    ],
    includes: ["проверка площадки", "выбор стационар/передвижной", "расчёт количества секций"]
  },
  {
    id: "pyramid-vertical",
    categoryId: "manual-sheet-metal",
    subcategoryId: "manual-sheet-vertical-systems",
    title: "Пирамиды вертикального хранения стационарные/передвижные",
    shortTitle: "Пирамиды вертикальные",
    sku: "KBP-MSM-PYRAMID",
    image: "/assets/images/products/manual-sheet-metal/2.7-safe-studio.png",
    imageAlt: "Стационарная пирамида для вертикального хранения листового металла",
    gallery: [
      "/assets/images/products/manual-sheet-metal/2.7-safe-studio.png",
      "/assets/images/products/manual-sheet-metal/2.7-safe-detail.png"
    ],
    galleryAlts: [
      "Стационарная пирамида с пачкой листового металла",
      "Нижняя опора и анкер пирамиды вертикального хранения"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Пирамида",
    summary: "Пирамидальные стеллажи для вертикального хранения листового металла различных форматов.",
    description: "Пирамиды используются для хранения листа разных размеров. Конструкция позволяет сортировать материал по габаритам и обеспечивает удобную выборку.",
    applications: ["склады с разноформатным листом", "цеха обработки", "распределительные центры"],
    specs: [
      { label: "Тип конструкции", value: "пирамидальная" },
      { label: "Исполнение", value: "стационарное / передвижное" },
      { label: "Сортировка", value: "по форматам листа" }
    ],
    includes: ["подбор габаритов под номенклатуру", "выбор количества секций", "проверка способа загрузки"]
  },
  {
    id: "shelves-manual-sheet",
    categoryId: "manual-sheet-metal",
    subcategoryId: "manual-sheet-cassette-systems",
    title: "Мобильная кассета-платформа для листового металла",
    shortTitle: "Мобильная кассета-платформа",
    sku: "KBP-MSM-MOBILE-CASSETTE",
    image: "/assets/images/products/manual-sheet-metal/2.8-safe-studio.png",
    imageAlt: "Низкопрофильная мобильная кассета-платформа для пачки листового металла",
    gallery: [
      "/assets/images/products/manual-sheet-metal/2.8-safe-studio.png",
      "/assets/images/products/manual-sheet-metal/2.8-safe-loaded.png"
    ],
    galleryAlts: [
      "Пустая мобильная кассета-платформа с роликами, упорами и ручкой",
      "Мобильная кассета-платформа с пачкой листового металла у станка лазерной резки"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Мобильная кассета",
    summary: "Низкопрофильная кассета для хранения и перемещения пачки листового металла внутри производственного участка.",
    description: "Жёсткая рамная платформа удерживает пачку листа между боковыми упорами. Роликовая опора и ручка упрощают перемещение кассеты по предусмотренному маршруту; точная схема движения, фиксации и грузоподъёмность определяются проектом.",
    applications: ["буфер материала у станка", "внутрицеховое перемещение пачек", "низкоуровневое хранение листа"],
    specs: [
      { label: "Тип конструкции", value: "низкопрофильная рамная кассета" },
      { label: "Перемещение", value: "роликовая опора, схема по проекту" },
      { label: "Фиксация груза", value: "переставляемые боковые упоры" }
    ],
    includes: ["подбор габаритов под формат листа", "расчёт кассеты по массе пачки", "проверка маршрута и способа фиксации"]
  },
  {
    id: "depalletizer",
    categoryId: "manual-sheet-metal",
    subcategoryId: "manual-sheet-cassette-systems",
    title: "Штыревой депаллетайзер для листового металла",
    shortTitle: "Штыревой депаллетайзер",
    sku: "KBP-MSM-DEPAL",
    image: "/assets/images/products/manual-sheet-metal/2.9-safe-studio.png",
    imageAlt: "Пассивный штыревой депаллетайзер для снятия пачки листового металла с деревянного поддона",
    gallery: [
      "/assets/images/products/manual-sheet-metal/2.9-safe-studio.png",
      "/assets/images/products/manual-sheet-metal/2.9-safe-detail.png"
    ],
    galleryAlts: [
      "Низкопрофильный штыревой депаллетайзер с двенадцатью переставляемыми опорами",
      "Крепления переставляемых штырей и вилочный тоннель депаллетайзера крупным планом"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Подготовка материала",
    summary: "Пассивный штыревой стол для быстрого снятия пачки листового металла с деревянного поддона или транспортных брусьев.",
    description: "Переставляемые штыри с защитными наконечниками располагаются в проёмах деревянного поддона и принимают пачку листа при опускании. Поддон освобождается, а материал можно перенести в кассету хранения. Устройство не подаёт лист автоматически и работает совместно с погрузчиком или другим предусмотренным подъёмным оборудованием.",
    applications: ["перегрузка листа с деревянных поддонов", "комплектация кассет хранения", "участки приёмки листового металла"],
    specs: [
      { label: "Тип работы", value: "пассивный штыревой стол" },
      { label: "Опоры", value: "12 переставляемых штырей" },
      { label: "Перемещение", value: "вилочные тоннели для погрузчика" }
    ],
    includes: ["проверка формата поддонов и брусьев", "расстановка штырей под окна поддона", "расчёт по массе пачки", "проверка сценария безопасной перегрузки"]
  },
  // === Категория 4: Ручные системы хранения сортового металла ===
  // Подкатегория «Стеллажи типа Ёлочка» (4 товара из листа Excel "Елочка")
  {
    id: "fishbone-double-sided",
    categoryId: "manual-sort-and-pipe-storage",
    subcategoryId: "manual-sort-fishbone",
    title: "Стеллаж ёлочка двухсторонний",
    shortTitle: "Ёлочка двухсторонняя",
    sku: "KBP-MSP-FISHBONE-2S",
    image: "/assets/images/products/manual-sort-and-pipe-storage/4.4.1.png",
    gallery: [
      "/assets/images/products/manual-sort-and-pipe-storage/4.4.1.png",
      "/assets/images/products/manual-sort-and-pipe-storage/fishbone-racks-in-action.png"
    ],
    galleryAlts: [
      "Стеллаж ёлочка двухсторонний",
      "Двусторонний стеллаж ёлочка с сортовым металлом в работе"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Двусторонний",
    summary: "Двусторонний ёлочка-стеллаж с боковой загрузкой для длинномерного проката.",
    description: "Конструкция с наклонными плечами в форме ёлочки. Двустороннее исполнение позволяет загружать металл с обеих сторон, повышая производительность работы склада.",
    applications: ["хранение длинномера", "балки и швеллеры", "цеха металлоконструкций"],
    specs: [
      { label: "Тип конструкции", value: "ёлочка наклонная" },
      { label: "Доступ", value: "с двух сторон" },
      { label: "Загрузка", value: "боковая" }
    ],
    includes: ["подбор высоты и длины", "расчёт нагрузки", "выбор количества плеч"]
  },
  {
    id: "fishbone-pyramid-reinforced",
    categoryId: "manual-sort-and-pipe-storage",
    subcategoryId: "manual-sort-fishbone",
    title: "Стеллаж пирамида ёлочка усиленный двухсторонний",
    shortTitle: "Пирамида усиленная",
    sku: "KBP-MSP-FISHBONE-PYR-REIN",
    image: "/assets/images/products/manual-sort-and-pipe-storage/4.4.2.png",
    gallery: [
      "/assets/images/products/manual-sort-and-pipe-storage/4.4.2.png",
      "/assets/images/products/manual-sort-and-pipe-storage/fishbone-racks-in-action.png"
    ],
    galleryAlts: [
      "Усиленный двухсторонний стеллаж пирамида ёлочка",
      "Загрузка длинномерного металлопроката в стеллаж ёлочка"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Усиленный",
    summary: "Усиленная пирамидальная ёлочка двустороннего исполнения для тяжёлого длинномера.",
    description: "Усиленная конструкция выдерживает повышенные нагрузки тяжёлого длинномерного проката. Пирамидальная форма обеспечивает устойчивость, двустороннее исполнение — высокую производительность.",
    applications: ["тяжёлый прокат", "балки большого сечения", "склад с высокой нагрузкой"],
    specs: [
      { label: "Тип конструкции", value: "пирамида ёлочка" },
      { label: "Усиление", value: "повышенная нагрузка" },
      { label: "Доступ", value: "с двух сторон" }
    ],
    includes: ["расчёт нагрузки на плечи", "проверка пола под массу", "подбор размеров"]
  },
  {
    id: "fishbone-pyramid-double",
    categoryId: "manual-sort-and-pipe-storage",
    subcategoryId: "manual-sort-fishbone",
    title: "Стеллаж пирамида ёлочка двухсторонний",
    shortTitle: "Пирамида ёлочка",
    sku: "KBP-MSP-FISHBONE-PYR-2S",
    image: "/assets/images/products/manual-sort-and-pipe-storage/4.4.3.png",
    gallery: [
      "/assets/images/products/manual-sort-and-pipe-storage/4.4.3.png",
      "/assets/images/products/manual-sort-and-pipe-storage/fishbone-racks-in-action.png"
    ],
    galleryAlts: [
      "Двухсторонний стеллаж пирамида ёлочка",
      "Хранение труб и профиля на промышленном стеллаже ёлочка"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Пирамида",
    summary: "Пирамидальная ёлочка двустороннего исполнения для длинномерного проката.",
    description: "Базовая пирамидальная ёлочка с возможностью загрузки с двух сторон. Универсальное решение для большинства складов длинномера среднего сечения.",
    applications: ["длинномер среднего сечения", "трубы и профиль", "склады металлоконструкций"],
    specs: [
      { label: "Тип конструкции", value: "пирамида ёлочка" },
      { label: "Доступ", value: "с двух сторон" },
      { label: "Применение", value: "среднее сечение" }
    ],
    includes: ["подбор габаритов", "расчёт нагрузки", "выбор количества плеч"]
  },
  {
    id: "fishbone-pyramid-single",
    categoryId: "manual-sort-and-pipe-storage",
    subcategoryId: "manual-sort-fishbone",
    title: "Стеллаж ёлочка пирамида односторонний",
    shortTitle: "Пирамида односторонняя",
    sku: "KBP-MSP-FISHBONE-PYR-1S",
    image: "/assets/images/products/manual-sort-and-pipe-storage/4.4.4.png",
    gallery: [
      "/assets/images/products/manual-sort-and-pipe-storage/4.4.4.png",
      "/assets/images/products/manual-sort-and-pipe-storage/fishbone-racks-in-action.png"
    ],
    galleryAlts: [
      "Односторонний стеллаж пирамида ёлочка",
      "Промышленная работа со стеллажом для длинномерного проката"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Односторонний",
    summary: "Односторонняя пирамидальная ёлочка для пристенного хранения длинномера.",
    description: "Односторонний доступ позволяет устанавливать стеллаж вдоль стены или в углу склада. Экономит площадь, но снижает производительность по сравнению с двусторонним исполнением.",
    applications: ["пристенное хранение", "склады с ограниченной площадью", "цеха с одной рабочей зоной"],
    specs: [
      { label: "Тип конструкции", value: "пирамида ёлочка" },
      { label: "Доступ", value: "с одной стороны" },
      { label: "Сценарий", value: "пристенное хранение" }
    ],
    includes: ["подбор габаритов", "проверка проходов", "расчёт нагрузки"]
  },
  {
    id: "automated-long-goods-tower",
    categoryId: "sort-and-pipe-storage",
    title: "Автоматизированная башенная система для сортового и трубного металлопроката",
    shortTitle: "Автоматический склад длинномера",
    sku: "KBP-LGM-AUTO-TOWER",
    modelName: "Автоматический склад длинномера",
    image: "/assets/images/products/sort-and-pipe-storage/automated-long-goods-tower.png",
    imageAlt: "Автоматизированная башенная система хранения труб и сортового металлопроката",
    gallery: [
      "/assets/images/products/sort-and-pipe-storage/automated-long-goods-tower.png",
      "/assets/images/products/sort-and-pipe-storage/automated-long-goods-tower-in-action.png"
    ],
    galleryAlts: [
      "Башенная система хранения длинномерного металлопроката",
      "Автоматическая выдача кассеты с трубами и профилем"
    ],
    pageMode: "configurator",
    calculatorProfileId: "auto-sort-metal",
    priceMode: "request",
    badge: "Расчёт по параметрам",
    operationMode: "automated",
    storageMaterials: ["pipes", "profiles"],
    loadingMethods: ["crane", "forklift", "extractor"],
    installationEnvironments: ["workshop", "warehouse"],
    summary: "Башенная система с кассетами для компактного хранения, учёта и механизированной выдачи длинномерного металлопроката.",
    description: "Решение объединяет кассеты, вертикальную стеллажную конструкцию и механизм подачи. Конфигурация подбирается по длине и сечению проката, массе кассеты, количеству номенклатурных позиций, высоте помещения и выбранному способу загрузки.",
    applications: ["металлообрабатывающие производства", "заготовительные участки", "склады труб и профиля"],
    specs: [
      { label: "Материал", value: "трубы, профиль и сортовой прокат" },
      { label: "Принцип хранения", value: "кассетный, вертикальный" },
      { label: "Выдача", value: "механизированная" },
      { label: "Конфигурация", value: "по длине, сечению и массе материала" }
    ],
    includes: ["расчёт кассет и башен", "проверка нагрузок на пол", "подбор способа подачи", "схема интеграции в производственный поток"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Автоматический склад труб и сортового металлопроката",
    seoDescription: "Башенная кассетная система для труб, профиля, балок и сортового проката. Инженерный подбор по помещению, нагрузке и способу подачи.",
    keywords: ["автоматический склад труб", "башенный стеллаж для длинномера", "хранение сортового металлопроката"]
  },
  {
    id: "vertical-carousel-module",
    categoryId: "carousel-vertical-module",
    title: "Вертикальный карусельный модуль для промышленного хранения",
    shortTitle: "Вертикальный карусельный модуль",
    sku: "KBP-VCM-INDUSTRIAL",
    modelName: "Vertical Carousel",
    image: "/assets/images/products/carousel-vertical-module/vertical-carousel-module.png",
    imageAlt: "Вертикальный карусельный складской модуль",
    gallery: [
      "/assets/images/products/carousel-vertical-module/vertical-carousel-module.png",
      "/assets/images/products/carousel-vertical-module/vertical-carousel-module-in-action.png"
    ],
    galleryAlts: ["Вертикальный карусельный модуль", "Выдача полки оператору"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Вертикальное хранение",
    operationMode: "automated",
    storageMaterials: ["tooling", "parts"],
    loadingMethods: ["manual", "extractor"],
    installationEnvironments: ["workshop", "warehouse"],
    summary: "Закрытый вертикальный модуль, который подаёт нужную полку к эргономичному окну выдачи.",
    description: "Карусельный принцип помогает использовать высоту помещения и сократить перемещения сотрудников. Размеры носителей, управление доступом и связь с учётной системой подбираются под номенклатуру и рабочий процесс.",
    applications: ["инструментальные кладовые", "хранение оснастки", "комплектовочные зоны"],
    specs: [
      { label: "Принцип работы", value: "карусельная подача носителей" },
      { label: "Доступ", value: "через окно выдачи" },
      { label: "Хранение", value: "закрытое" }
    ],
    includes: ["анализ номенклатуры", "подбор носителей", "проверка высоты помещения", "сценарий доступа и учёта"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Вертикальный карусельный складской модуль",
    seoDescription: "Автоматизированная подача инструмента, оснастки и комплектующих к оператору. Подбор модуля под помещение и номенклатуру.",
    keywords: ["вертикальный карусельный модуль", "автоматический склад инструмента", "вертикальное хранение оснастки"]
  },
  {
    id: "pallet-asrs-stacker-crane",
    categoryId: "automated-warehouse-systems",
    title: "Автоматизированный паллетный склад со штабелером-краном",
    shortTitle: "Паллетный AS/RS",
    sku: "KBP-ASRS-PALLET",
    modelName: "Pallet AS/RS",
    image: "/assets/images/products/automated-warehouse-systems/pallet-asrs-stacker-crane.png",
    imageAlt: "Автоматизированный паллетный склад со штабелером-краном",
    gallery: [
      "/assets/images/products/automated-warehouse-systems/pallet-asrs-stacker-crane.png",
      "/assets/images/products/automated-warehouse-systems/pallet-asrs-stacker-crane-in-action.png"
    ],
    galleryAlts: ["Паллетный автоматизированный склад", "Штабелер-кран перемещает паллету"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Комплексный проект",
    operationMode: "automated",
    storageMaterials: ["pallets"],
    loadingMethods: ["forklift", "stacker", "extractor"],
    installationEnvironments: ["warehouse"],
    summary: "Комплекс стеллажей, штабелера-крана и передаточных станций для автоматического размещения и выдачи паллет.",
    description: "Система проектируется как единый материальный поток: приём груза, идентификация, адресное хранение и выдача по заданию. Топология и производительность рассчитываются после обследования склада.",
    applications: ["распределительные центры", "производственные склады", "буферные склады"],
    specs: [
      { label: "Единица хранения", value: "паллетированный груз" },
      { label: "Транспорт", value: "штабелер-кран" },
      { label: "Управление", value: "автоматическое адресное хранение" }
    ],
    includes: ["анализ грузопотока", "расчёт ёмкости и производительности", "план передаточных станций", "сценарий интеграции с WMS"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Автоматизированный паллетный склад AS/RS",
    seoDescription: "Проектирование паллетного автоматизированного склада со штабелером-краном, передаточными станциями и интеграцией с WMS.",
    keywords: ["автоматизированный паллетный склад", "склад со штабелером краном", "AS RS склад"]
  },
  {
    id: "smart-industrial-locker",
    categoryId: "inlocker",
    title: "Автоматизированный шкаф InLocker для инструмента и расходных материалов",
    shortTitle: "Шкаф InLocker",
    sku: "KBP-INLOCKER-SMART",
    modelName: "InLocker",
    image: "/assets/images/products/inlocker/smart-industrial-locker.png",
    imageAlt: "Автоматизированный шкаф InLocker с ячейками",
    gallery: [
      "/assets/images/products/inlocker/smart-industrial-locker.png",
      "/assets/images/products/inlocker/smart-industrial-locker-in-action.png"
    ],
    galleryAlts: ["Шкаф InLocker", "Сотрудник получает инструмент из ячейки"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Контролируемая выдача",
    operationMode: "automated",
    storageMaterials: ["tooling", "parts"],
    loadingMethods: ["manual"],
    installationEnvironments: ["workshop", "warehouse"],
    summary: "Ячеечный шкаф с идентификацией пользователя, контролируемой выдачей и фиксацией возврата материальных ценностей.",
    description: "InLocker помогает организовать выдачу инструмента и расходников непосредственно рядом с рабочей зоной. Состав ячеек, роли доступа и обмен данными уточняются по номенклатуре и правилам предприятия.",
    applications: ["выдача инструмента", "учёт расходных материалов", "хранение СИЗ и оснастки"],
    specs: [
      { label: "Тип хранения", value: "индивидуальные ячейки" },
      { label: "Доступ", value: "по идентификации пользователя" },
      { label: "Учёт", value: "выдача и возврат позиций" }
    ],
    includes: ["анализ номенклатуры", "подбор размеров ячеек", "матрица прав доступа", "сценарий обмена с учётной системой"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Автоматизированный шкаф InLocker для инструмента",
    seoDescription: "Контролируемая выдача и возврат инструмента, СИЗ и расходных материалов через индивидуальные ячейки.",
    keywords: ["автоматический шкаф для инструмента", "учёт выдачи инструмента", "шкаф InLocker"]
  },
  {
    id: "vacuum-sheet-lifter-jib",
    categoryId: "lifting-equipment",
    title: "Вакуумный подъёмник для листового металла с консольно-поворотным краном",
    shortTitle: "Вакуумный подъёмник листа",
    sku: "KBP-LIFT-VAC-SHEET",
    modelName: "Вакуумный захват для листа",
    image: "/assets/images/products/lifting-equipment/vacuum-sheet-lifter-jib.png",
    imageAlt: "Вакуумный подъёмник листового металла на консольном кране",
    gallery: [
      "/assets/images/products/lifting-equipment/vacuum-sheet-lifter-jib.png",
      "/assets/images/products/lifting-equipment/vacuum-sheet-lifter-jib-in-action.png"
    ],
    galleryAlts: ["Вакуумный захват на консольном кране", "Перемещение металлического листа вакуумным подъёмником"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Безопасная подача",
    operationMode: "mechanized",
    storageMaterials: ["sheet-metal"],
    loadingMethods: ["vacuum", "crane"],
    installationEnvironments: ["workshop", "warehouse"],
    summary: "Комплекс для захвата, подъёма и позиционирования металлических листов без ручной строповки.",
    description: "Тип и схема вакуумного захвата подбираются по материалу, габаритам, массе и состоянию поверхности листа. Проект также учитывает рабочую зону крана и маршрут перемещения.",
    applications: ["загрузка станков резки", "перемещение листа со стеллажа", "комплектация заказов"],
    specs: [
      { label: "Груз", value: "листовой металл" },
      { label: "Захват", value: "вакуумный" },
      { label: "Перемещение", value: "в рабочей зоне крана" }
    ],
    includes: ["проверка параметров листа", "подбор схемы присосок", "расчёт рабочей зоны", "проверка сценария безопасной эксплуатации"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Вакуумный подъёмник для листового металла",
    seoDescription: "Вакуумный захват и консольно-поворотный кран для безопасной подачи металлических листов к станку или стеллажу.",
    keywords: ["вакуумный подъёмник листового металла", "вакуумный захват для листа", "кран для подачи листа"]
  },
  {
    id: "heavy-duty-pullout-rack",
    categoryId: "rollout-shelf-storage",
    title: "Стеллаж с выкатными полками для тяжёлых заготовок и оснастки",
    shortTitle: "Стеллаж с выкатными полками",
    sku: "KBP-ROLL-HEAVY",
    modelName: "Heavy Pull-Out Rack",
    image: "/assets/images/products/rollout-shelf-storage/heavy-duty-pullout-rack-studio-safe.png",
    imageAlt: "Двухсекционный промышленный стеллаж с восемью закрытыми выкатными полками",
    gallery: [
      "/assets/images/products/rollout-shelf-storage/heavy-duty-pullout-rack-studio-safe.png",
      "/assets/images/products/rollout-shelf-storage/heavy-duty-pullout-rack-action-safe.png"
    ],
    galleryAlts: [
      "Двухсекционный стеллаж с четырьмя закрытыми выкатными уровнями в каждой секции",
      "Обслуживание одной выдвинутой нижней полки талью и двухветвевым цепным стропом"
    ],
    pageMode: "standard",
    priceMode: "request",
    badge: "Прямой доступ",
    operationMode: "manual",
    storageMaterials: ["tooling", "parts"],
    loadingMethods: ["crane", "manual"],
    installationEnvironments: ["workshop", "warehouse"],
    summary: "Каждая полка выдвигается в рабочую зону, обеспечивая прямой доступ к оснастке и заготовкам.",
    description: "Стеллаж проектируется по размерам и массе каждой позиции, способу подъёма и доступному проходу. Тип фиксации полок и схема обслуживания уточняются инженерным расчётом.",
    applications: ["хранение пресс-форм", "штамповый участок", "склад тяжёлой оснастки"],
    specs: [
      { label: "Тип полок", value: "выкатные" },
      { label: "Доступ", value: "прямой к каждой полке" },
      { label: "Обслуживание", value: "с пола или грузоподъёмным оборудованием" }
    ],
    includes: ["ведомость грузов", "расчёт полок и рамы", "проверка проходов", "подбор способа загрузки"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Стеллаж с выкатными полками для тяжёлых грузов",
    seoDescription: "Выкатные полки для штампов, пресс-форм, оснастки и тяжёлых заготовок. Инженерный подбор под размеры и способ загрузки.",
    keywords: ["стеллаж с выкатными полками", "стеллаж для пресс форм", "хранение тяжёлой оснастки"]
  },
  {
    id: "double-sided-cantilever-rack",
    categoryId: "cantilever-racks",
    title: "Двусторонний консольный стеллаж для труб и длинномерного проката",
    shortTitle: "Консольный стеллаж двусторонний",
    sku: "KBP-CANT-DOUBLE",
    modelName: "Double-Sided Cantilever",
    image: "/assets/images/products/cantilever-racks/double-sided-cantilever-rack.png",
    imageAlt: "Двусторонний консольный стеллаж с трубами и профилем",
    gallery: [
      "/assets/images/products/cantilever-racks/double-sided-cantilever-rack.png",
      "/assets/images/products/cantilever-racks/double-sided-cantilever-rack-in-action.png"
    ],
    galleryAlts: ["Двусторонний консольный стеллаж", "Загрузка длинномера на консоли"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Двусторонний",
    operationMode: "manual",
    storageMaterials: ["pipes", "profiles"],
    loadingMethods: ["forklift", "crane"],
    installationEnvironments: ["workshop", "warehouse", "covered-outdoor"],
    summary: "Открытая двусторонняя конструкция с консолями для раздельного хранения длинномерных материалов.",
    description: "Шаг стоек, длина и количество консолей рассчитываются по номенклатуре, прогибу материала и способу загрузки. Для площадок вне помещения исполнение требует отдельного проектного подтверждения.",
    applications: ["металлобазы", "цеха металлоконструкций", "склады труб и профиля"],
    specs: [
      { label: "Конструкция", value: "двусторонняя консольная" },
      { label: "Материал", value: "длинномерный прокат" },
      { label: "Доступ", value: "с двух сторон" }
    ],
    includes: ["анализ номенклатуры", "расчёт консолей и стоек", "проверка основания", "схема безопасных проходов"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Двусторонний консольный стеллаж для труб",
    seoDescription: "Консольное хранение труб, профиля, балок и другого длинномера. Расчёт конструкции под номенклатуру и способ загрузки.",
    keywords: ["консольный стеллаж для труб", "стеллаж для длинномера", "двусторонний консольный стеллаж"]
  },
  {
    id: "selective-pallet-rack",
    categoryId: "front-pallet-racks",
    title: "Фронтальный паллетный стеллаж для адресного хранения",
    shortTitle: "Фронтальный паллетный стеллаж",
    sku: "KBP-PALLET-SELECTIVE",
    modelName: "Selective Pallet Rack",
    image: "/assets/images/products/front-pallet-racks/selective-pallet-rack.png",
    imageAlt: "Фронтальные паллетные стеллажи на складе",
    gallery: [
      "/assets/images/products/front-pallet-racks/selective-pallet-rack.png",
      "/assets/images/products/front-pallet-racks/selective-pallet-rack-in-action.png"
    ],
    galleryAlts: ["Фронтальный паллетный стеллаж", "Погрузчик обслуживает паллетный стеллаж"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Прямой доступ к паллете",
    operationMode: "manual",
    storageMaterials: ["pallets"],
    loadingMethods: ["forklift", "stacker"],
    installationEnvironments: ["warehouse"],
    summary: "Классическая фронтальная система, обеспечивающая прямой доступ к каждому паллетному месту.",
    description: "Схема рядов и уровней рассчитывается по типу паллет, массе груза, характеристикам техники, высоте помещения и требуемым проходам.",
    applications: ["распределительные склады", "производственные запасы", "адресное хранение"],
    specs: [
      { label: "Единица хранения", value: "паллетированный груз" },
      { label: "Доступ", value: "фронтальный к каждому месту" },
      { label: "Обслуживание", value: "погрузочной техникой" }
    ],
    includes: ["сбор исходных данных по паллетам", "расчёт секций и уровней", "проверка проходов техники", "схема защитных элементов"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Фронтальные паллетные стеллажи для склада",
    seoDescription: "Адресное хранение паллет с прямым доступом к каждому месту. Проектирование под груз, технику и геометрию склада.",
    keywords: ["фронтальные паллетные стеллажи", "стеллажи для паллет", "адресное хранение паллет"]
  },
  {
    id: "electric-pallet-equipment",
    categoryId: "warehouse-equipment",
    title: "Электрическая складская техника для перемещения паллет",
    shortTitle: "Электрическая паллетная техника",
    sku: "KBP-WHE-ELECTRIC",
    modelName: "Electric Pallet Handling",
    image: "/assets/images/products/warehouse-equipment/electric-pallet-equipment.png",
    imageAlt: "Электрическая складская техника для паллет",
    gallery: [
      "/assets/images/products/warehouse-equipment/electric-pallet-equipment.png",
      "/assets/images/products/warehouse-equipment/electric-pallet-equipment-in-action.png"
    ],
    galleryAlts: ["Электрическая паллетная техника", "Перемещение паллеты на складе"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Подбор под маршрут",
    operationMode: "mechanized",
    storageMaterials: ["pallets"],
    loadingMethods: ["forklift", "stacker"],
    installationEnvironments: ["warehouse", "workshop"],
    summary: "Техника для внутрискладского перемещения паллет между приёмкой, хранением, производством и отгрузкой.",
    description: "Тип техники определяется массой груза, высотой подъёма, длиной маршрута, интенсивностью работы, шириной проходов и условиями зарядки.",
    applications: ["приёмка и отгрузка", "подача паллет в производство", "комплектация заказов"],
    specs: [
      { label: "Груз", value: "паллетированный" },
      { label: "Привод", value: "электрический" },
      { label: "Подбор", value: "по маршруту и режиму работы" }
    ],
    includes: ["аудит маршрутов", "проверка проходов", "подбор класса техники", "рекомендации по зарядной зоне"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Электрическая складская техника для паллет",
    seoDescription: "Подбор электрической техники для перемещения паллет по маршруту приёмка — хранение — производство — отгрузка.",
    keywords: ["электрическая складская техника", "техника для перемещения паллет", "электротележка для склада"]
  },
  {
    id: "industrial-shelving",
    categoryId: "shelf-racks",
    title: "Промышленный полочный стеллаж для ручного отбора",
    shortTitle: "Промышленный полочный стеллаж",
    sku: "KBP-SHELF-INDUSTRIAL",
    modelName: "Industrial Shelving",
    image: "/assets/images/products/shelf-racks/industrial-shelving.png",
    imageAlt: "Промышленные полочные стеллажи с ручным отбором",
    gallery: [
      "/assets/images/products/shelf-racks/industrial-shelving.png",
      "/assets/images/products/shelf-racks/industrial-shelving-in-action.png"
    ],
    galleryAlts: ["Промышленный полочный стеллаж", "Ручной отбор с промышленного полочного стеллажа"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Ручной отбор",
    operationMode: "manual",
    storageMaterials: ["parts", "tooling", "mixed"],
    loadingMethods: ["manual"],
    installationEnvironments: ["warehouse", "workshop"],
    summary: "Модульная полочная система для адресного хранения небольших грузов и быстрого ручного отбора.",
    description: "Глубина, шаг и тип полок подбираются по размерам тары, массе одной позиции, частоте отбора и доступной площади. Секции можно объединять в линии и зонировать по номенклатуре.",
    applications: ["склады ЗИП", "цеховые кладовые", "сервисные и комплектовочные зоны"],
    specs: [
      { label: "Тип хранения", value: "полочное" },
      { label: "Отбор", value: "ручной" },
      { label: "Компоновка", value: "модульные секции" }
    ],
    includes: ["анализ тары и номенклатуры", "подбор полок и секций", "схема адресного хранения", "проверка проходов"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Промышленные полочные стеллажи для склада",
    seoDescription: "Модульные полочные стеллажи для коробов, комплектующих, инструмента и ЗИП с удобным ручным отбором.",
    keywords: ["промышленные полочные стеллажи", "стеллажи для ручного отбора", "стеллажи для ЗИП"]
  },
  {
    id: "warehouse-mezzanine",
    categoryId: "mezzanines",
    title: "Складской мезонин для увеличения полезной площади",
    shortTitle: "Складской мезонин",
    sku: "KBP-MEZZ-WAREHOUSE",
    modelName: "Warehouse Mezzanine",
    image: "/assets/images/products/mezzanines/warehouse-mezzanine.png",
    imageAlt: "Стальной складской мезонин с рабочими уровнями",
    gallery: [
      "/assets/images/products/mezzanines/warehouse-mezzanine.png",
      "/assets/images/products/mezzanines/warehouse-mezzanine-in-action.png"
    ],
    galleryAlts: ["Складской мезонин", "Многоуровневый складской мезонин"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Использование высоты",
    operationMode: "manual",
    storageMaterials: ["parts", "mixed"],
    loadingMethods: ["manual"],
    installationEnvironments: ["warehouse", "workshop"],
    summary: "Стальная многоуровневая конструкция для организации хранения и рабочих зон по высоте помещения.",
    description: "Мезонин проектируется по планировке здания, нагрузкам, высоте, эвакуационным маршрутам и способу подачи грузов. Состав ограждений, лестниц и ворот определяется проектом.",
    applications: ["увеличение складской площади", "комплектовочные этажи", "хранение коробов и ЗИП"],
    specs: [
      { label: "Конструкция", value: "многоуровневая стальная" },
      { label: "Назначение", value: "хранение и рабочие зоны" },
      { label: "Проектирование", value: "по зданию, нагрузкам и логистике" }
    ],
    includes: ["обмер помещения", "расчёт несущей схемы", "план лестниц и ограждений", "проверка грузовых маршрутов"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Складской мезонин под ключ",
    seoDescription: "Проектирование многоуровневого складского мезонина под помещение, нагрузку, хранение и рабочие процессы.",
    keywords: ["складской мезонин", "многоуровневый склад", "мезонин для склада"]
  },
  {
    id: "cable-drum-rack",
    categoryId: "cable-racks",
    title: "Стеллаж для хранения и размотки кабельных барабанов",
    shortTitle: "Стеллаж для кабельных барабанов",
    sku: "KBP-CABLE-DRUM",
    modelName: "Cable Drum Rack",
    image: "/assets/images/products/cable-racks/cable-drum-rack.png",
    imageAlt: "Стеллаж с кабельными барабанами и размоткой",
    gallery: [
      "/assets/images/products/cable-racks/cable-drum-rack.png",
      "/assets/images/products/cable-racks/cable-drum-rack-in-action.png"
    ],
    galleryAlts: ["Стеллаж для кабельных барабанов", "Размотка кабеля со стеллажа для барабанов"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Хранение и размотка",
    operationMode: "manual",
    storageMaterials: ["cable"],
    loadingMethods: ["forklift", "crane", "manual"],
    installationEnvironments: ["warehouse", "workshop"],
    summary: "Стеллаж с валами для безопасного хранения барабанов и выдачи кабеля без перемещения барабана на пол.",
    description: "Количество ярусов, размеры валов и способ загрузки подбираются по ведомости барабанов. Проект учитывает свободное вращение, фиксацию и рабочую зону размотки.",
    applications: ["кабельные склады", "электромонтажные производства", "участки комплектации"],
    specs: [
      { label: "Груз", value: "кабельные барабаны и катушки" },
      { label: "Функция", value: "хранение и размотка" },
      { label: "Размещение", value: "на несущих валах" }
    ],
    includes: ["ведомость барабанов", "подбор валов и ярусов", "проверка способа загрузки", "организация безопасной зоны размотки"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Стеллаж для кабельных барабанов и размотки",
    seoDescription: "Хранение кабельных барабанов на валах с удобной размоткой. Подбор по размерам барабанов, массе и способу загрузки.",
    keywords: ["стеллаж для кабельных барабанов", "стеллаж для размотки кабеля", "хранение кабельных катушек"]
  },
  {
    id: "packing-marking-workstation",
    categoryId: "packing-marking-storage",
    title: "Промышленное рабочее место упаковки и маркировки",
    shortTitle: "Пост упаковки и маркировки",
    sku: "KBP-PACK-WORKSTATION",
    modelName: "Packing & Marking Workstation",
    image: "/assets/images/products/packing-marking/packing-marking-workstation.png",
    imageAlt: "Промышленный пост упаковки и маркировки продукции",
    gallery: [
      "/assets/images/products/packing-marking/packing-marking-workstation.png",
      "/assets/images/products/packing-marking/packing-marking-workstation-in-action.png"
    ],
    galleryAlts: ["Пост упаковки и маркировки", "Оператор на посту упаковки и маркировки"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Организация рабочего места",
    operationMode: "manual",
    storageMaterials: ["parts", "mixed"],
    loadingMethods: ["manual"],
    installationEnvironments: ["warehouse", "workshop"],
    summary: "Организованный пост для упаковки, печати этикеток, маркировки и подготовки продукции к отгрузке.",
    description: "Состав рабочего места подбирается по габаритам продукции, последовательности операций, используемому оборудованию и запасу упаковочных материалов.",
    applications: ["финальная упаковка", "маркировка продукции", "комплектация отгрузок"],
    specs: [
      { label: "Процесс", value: "упаковка и маркировка" },
      { label: "Компоновка", value: "под рабочий маршрут оператора" },
      { label: "Оснащение", value: "по применяемому оборудованию и материалам" }
    ],
    includes: ["карта операций", "эргономичная компоновка", "места хранения расходников", "подготовка точек подключения"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Промышленный пост упаковки и маркировки",
    seoDescription: "Рабочее место для упаковки, печати этикеток, маркировки и подготовки заказов к отгрузке.",
    keywords: ["пост упаковки и маркировки", "рабочее место упаковщика", "оборудование зоны упаковки"]
  },
  {
    id: "warehouse-management-system",
    categoryId: "warehouse-erp",
    title: "Система управления складом и интеграции с ERP",
    shortTitle: "Управление складом",
    sku: "KBP-WMS-INTEGRATION",
    modelName: "Warehouse Management Integration",
    image: "/assets/images/products/warehouse-erp/warehouse-management-system.png",
    imageAlt: "Интерфейс управления складом и интеграции с ERP",
    gallery: [
      "/assets/images/products/warehouse-erp/warehouse-management-system.png",
      "/assets/images/products/warehouse-erp/warehouse-management-system-in-action.png"
    ],
    galleryAlts: ["Система управления складом", "Оператор работает в системе управления складом"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Цифровой контур",
    operationMode: "automated",
    installationEnvironments: ["warehouse", "workshop"],
    summary: "Цифровой контур для адресного учёта, складских заданий и обмена данными между оборудованием, WMS и ERP.",
    description: "Состав решения определяется текущей учётной системой, оборудованием, правилами идентификации и маршрутами материалов. Перед внедрением фиксируются границы интеграции и ответственность каждой системы.",
    applications: ["адресное хранение", "управление заданиями", "интеграция автоматизированного оборудования"],
    specs: [
      { label: "Функции", value: "адреса, остатки и складские задания" },
      { label: "Интеграция", value: "WMS, ERP и складское оборудование" },
      { label: "Проектирование", value: "по бизнес-процессам предприятия" }
    ],
    includes: ["аудит процессов", "карта интеграций", "модель складских статусов", "план тестирования обмена"],
    featured: true,
    sortOrder: 0,
    seoTitle: "Система управления складом и интеграция с ERP",
    seoDescription: "Адресный учёт, складские задания и интеграция оборудования с WMS и ERP по согласованной карте процессов.",
    keywords: ["система управления складом", "интеграция WMS ERP", "автоматизация складского учёта"]
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

function bySortOrder<T extends { sortOrder?: number }>(a: T, b: T) {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
}

export function getSubcategoriesByCategory(categoryId: string) {
  return catalogSubcategories.filter((item) => item.categoryId === categoryId).slice().sort(bySortOrder);
}

export function getProductsByCategory(categoryId: string) {
  return catalogProducts
    .filter((item) => item.categoryId === categoryId)
    .slice()
    .sort(bySortOrder)
    .map(enrichProduct);
}

export function getProductsBySubcategory(categoryId: string, subcategoryId: string) {
  return catalogProducts
    .filter((item) => item.categoryId === categoryId && item.subcategoryId === subcategoryId)
    .slice()
    .sort(bySortOrder)
    .map(enrichProduct);
}

export function getCatalogProduct(categoryId: string, productId: string) {
  const product = catalogProducts.find((item) => item.categoryId === categoryId && item.id === productId);
  return product ? enrichProduct(product) : undefined;
}

/**
 * Получить SEO-метаданные товара или категории с применёнными дефолтами.
 * Используется в generateMetadata() и в JsonLd Product schema.
 */
export function getSeoForItem(item: { title: string; summary: string; image: string } & SeoOverrides) {
  return {
    title: item.seoTitle ?? item.title,
    description: item.seoDescription ?? item.summary,
    ogImage: item.ogImage ?? item.image,
    keywords: item.keywords ?? [],
    noIndex: item.noIndex ?? false,
    canonicalUrl: item.canonicalUrl
  };
}
