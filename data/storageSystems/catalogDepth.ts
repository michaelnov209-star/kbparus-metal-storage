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
  gallery: string[];
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
    image: "/assets/images/catalog/02-manual-sheet-metal.png"
  },
  {
    id: "manual-sheet-vertical-systems",
    categoryId: "manual-sheet-metal",
    title: "Вертикальные системы и пирамиды",
    summary: "Стационарные и передвижные решения для вертикального хранения листового металла на ограниченной площади.",
    image: "/assets/images/catalog/02-manual-sheet-metal.png"
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
  },
  // === Категория 2: Ручные системы хранения листового металла (9 продуктов) ===
  {
    id: "forklift-cassette-rack",
    categoryId: "manual-sheet-metal",
    subcategoryId: "manual-sheet-cassette-systems",
    title: "Кассетный стеллаж под погрузчик",
    shortTitle: "Кассеты под погрузчик",
    sku: "KBP-MSM-FORKLIFT-CASS",
    image: "/assets/images/products/manual-sheet-metal/2.1.png",
    gallery: ["/assets/images/products/manual-sheet-metal/2.1.png"],
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
    image: "/assets/images/products/manual-sheet-metal/2.2.png",
    gallery: ["/assets/images/products/manual-sheet-metal/2.2.png"],
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
    image: "/assets/images/products/manual-sheet-metal/2.3.png",
    gallery: ["/assets/images/products/manual-sheet-metal/2.3.png"],
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
    image: "/assets/images/products/manual-sheet-metal/2.4.png",
    gallery: ["/assets/images/products/manual-sheet-metal/2.4.png"],
    pageMode: "configurator",
    calculatorProfileId: "two-side-rollout-rack",
    priceMode: "request",
    badge: "Двусторонний",
    summary: "Выкатной стеллаж с возможностью выкатывания кассет с двух сторон для удвоенного доступа.",
    description: "Двустороннее исполнение увеличивает скорость работы: кассеты выкатываются в обе стороны, два оператора могут работать одновременно с разной номенклатурой.",
    applications: ["цеха с двумя рабочими постами", "распределительные склады", "производства с высоким оборотом"],
    specs: [
      { label: "Доступ", value: "с двух сторон" },
      { label: "Производительность", value: "до 2× против односторонних" },
      { label: "Нагрузка на кассету", value: "до 5 000 кг" }
    ],
    includes: ["проверка свободного пространства с двух сторон", "расчёт количества операторов", "оптимизация потока"]
  },
  {
    id: "vertical-rollout-cassette",
    categoryId: "manual-sheet-metal",
    subcategoryId: "manual-sheet-vertical-systems",
    title: "Стеллаж для вертикального хранения с выкатными кассетами",
    shortTitle: "Вертикальные выкатные",
    sku: "KBP-MSM-VERTICAL-ROLLOUT",
    image: "/assets/images/products/manual-sheet-metal/2.5.png",
    gallery: ["/assets/images/products/manual-sheet-metal/2.5.png"],
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
    image: "/assets/images/products/manual-sheet-metal/2.6.png",
    gallery: ["/assets/images/products/manual-sheet-metal/2.6.png"],
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
    image: "/assets/images/products/manual-sheet-metal/2.7.png",
    gallery: ["/assets/images/products/manual-sheet-metal/2.7.png"],
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
    subcategoryId: "manual-sheet-vertical-systems",
    title: "Полки для хранения листового металла",
    shortTitle: "Полки",
    sku: "KBP-MSM-SHELVES",
    image: "/assets/images/products/manual-sheet-metal/2.8.png",
    gallery: ["/assets/images/products/manual-sheet-metal/2.8.png"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Базовое решение",
    summary: "Базовые полочные стеллажи для хранения листового металла малого формата.",
    description: "Простое и надёжное решение для небольших цехов или участков, где нет необходимости в сложных автоматизированных системах. Открытые полки обеспечивают визуальный контроль материала.",
    applications: ["небольшие цеха", "ремонтные участки", "склады инструмента и металла"],
    specs: [
      { label: "Тип конструкции", value: "полочная" },
      { label: "Доступ", value: "открытый" },
      { label: "Применение", value: "малый формат листа" }
    ],
    includes: ["подбор количества уровней", "расчёт нагрузки", "проверка габаритов"]
  },
  {
    id: "depalletizer",
    categoryId: "manual-sheet-metal",
    subcategoryId: "manual-sheet-cassette-systems",
    title: "Депаллетайзер для листового металла",
    shortTitle: "Депаллетайзер",
    sku: "KBP-MSM-DEPAL",
    image: "/assets/images/products/manual-sheet-metal/2.9.png",
    gallery: ["/assets/images/products/manual-sheet-metal/2.9.png"],
    pageMode: "standard",
    priceMode: "request",
    badge: "Автоматизация",
    summary: "Депаллетайзер для автоматического разделения и подачи листового металла из пачки.",
    description: "Устройство, которое автоматически отделяет лист от пачки и подаёт его на следующий технологический этап. Применяется в линиях лазерной резки и комплектации.",
    applications: ["линии лазерной резки", "автоматизированная подача листа", "комплектовочные участки"],
    specs: [
      { label: "Назначение", value: "разделение и подача листа" },
      { label: "Тип работы", value: "автоматический" },
      { label: "Интеграция", value: "с линиями резки" }
    ],
    includes: ["проверка совместимости с оборудованием", "подбор по толщине листа", "интеграция в технологический поток"]
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
    gallery: ["/assets/images/products/manual-sort-and-pipe-storage/4.4.1.png"],
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
    gallery: ["/assets/images/products/manual-sort-and-pipe-storage/4.4.2.png"],
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
    gallery: ["/assets/images/products/manual-sort-and-pipe-storage/4.4.3.png"],
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
    gallery: ["/assets/images/products/manual-sort-and-pipe-storage/4.4.4.png"],
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
    .filter((item) => item.categoryId === categoryId && !item.draft)
    .slice()
    .sort(bySortOrder)
    .map(enrichProduct);
}

export function getProductsBySubcategory(categoryId: string, subcategoryId: string) {
  return catalogProducts
    .filter((item) => item.categoryId === categoryId && item.subcategoryId === subcategoryId && !item.draft)
    .slice()
    .sort(bySortOrder)
    .map(enrichProduct);
}

export function getCatalogProduct(categoryId: string, productId: string) {
  const product = catalogProducts.find((item) => item.categoryId === categoryId && item.id === productId && !item.draft);
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
