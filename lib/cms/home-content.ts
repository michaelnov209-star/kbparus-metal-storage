import { visualAssets } from "@/data/storageSystems/visualAssets";
import { getCmsClient } from "./client";

export type IconKey =
  | "badge-check"
  | "boxes"
  | "clipboard-check"
  | "factory"
  | "globe"
  | "layers"
  | "message-circle"
  | "package-check"
  | "route"
  | "shield-check"
  | "truck"
  | "warehouse"
  | "wrench"
  | "zap";

export interface HeroAction {
  label: string;
  href: string;
  style: "primary" | "secondary";
}

export interface HeroData {
  eyebrow: string;
  title: string;
  description?: string;
  background:
    | { type: "video"; videoUrl: string; posterUrl: string }
    | { type: "image"; imageUrl: string; imageSrcSet?: string; alt: string };
  metrics: Array<{ value: string; label: string }>;
  actions: HeroAction[];
}

export interface HomePageContent {
  hero: HeroData;
  storedMaterials: Array<{ title: string; text: string; label: string; icon: IconKey; imageUrl?: string; imageAlt?: string }>;
  beforeAfter: {
    before: { title: string; text: string; imageUrl: string; imageAlt: string; points: string[] };
    after: { title: string; text: string; imageUrl: string; imageAlt: string; points: string[] };
  };
  advantages: Array<{ title: string; text: string; icon: IconKey }>;
  cases: Array<{ customer: string; title: string; task: string; result: string; imageUrl: string; imageAlt: string }>;
  geography: {
    projects: Array<{ city: string; company: string }>;
    totalLabel: string;
  };
  reviews: Array<{ name: string; role: string; text: string; imageUrl?: string; imageAlt?: string }>;
  about: {
    title: string;
    text: string;
    features: Array<{ label: string; icon: IconKey }>;
    metrics: Array<{ value: string; label: string; icon: IconKey }>;
  };
  banners: {
    kbparus: { imageUrl: string; imageAlt: string; url: string; ctaLabel: string };
    coating: { imageUrl: string; imageAlt: string; url: string; ctaLabel: string };
  };
  shipmentSteps: Array<{ title: string; text: string; icon: IconKey }>;
  partners: Array<{ name: string; mark: string; logoUrl?: string; logoAlt?: string; url?: string }>;
  faq: Array<{ question: string; answer: string }>;
}

interface MediaDoc {
  url?: string | null;
  alt?: string | null;
  sizes?: Record<string, { url?: string | null; width?: number | null }> | null;
}

type MaybeMedia = MediaDoc | number | null | undefined;
type AnyRecord = Record<string, any>;

export const DEFAULT_HOME_CONTENT: HomePageContent = {
  hero: {
    eyebrow: "КБ Парус / складские системы для металла",
    title: "Системы хранения металла",
    background: {
      type: "video",
      videoUrl: "/assets/videos/metal-storage-hero-trimmed.mp4",
      posterUrl: visualAssets.hero
    },
    metrics: [
      { value: "500+", label: "проектов" },
      { value: "20+", label: "лет на рынке" },
      { value: "12 000+", label: "тонн металла под управлением" }
    ],
    actions: [
      { label: "Рассчитать стоимость", href: "#calculator", style: "primary" },
      { label: "Получить КП", href: "#request", style: "secondary" }
    ]
  },
  storedMaterials: [
    {
      title: "Листовой металл",
      text: "Пачки листа, форматные заготовки, деловые обрезки.",
      label: "Лист / кассеты",
      icon: "layers"
    },
    {
      title: "Трубы и профиль",
      text: "Круглые и профильные трубы, уголок, швеллер, балка.",
      label: "Трубы / профиль",
      icon: "boxes"
    },
    {
      title: "Сортовой прокат",
      text: "Пруток, уголок, швеллер, балка, пачки заготовок и смешанная номенклатура.",
      label: "Пруток / балка",
      icon: "warehouse"
    },
    {
      title: "Оснастка и комплектующие",
      text: "Инструмент, расходники, кабель, паллеты и складские позиции.",
      label: "Оснастка / ЗИП",
      icon: "package-check"
    }
  ],
  beforeAfter: {
    before: {
      title: "Хаос, металл на полу",
      text: "Проходы заняты, материал сложно найти, погрузчик тратит время на перекладку.",
      imageUrl: visualAssets.beforeWarehouse,
      imageAlt: "До внедрения: металл на полу и хаос на складе",
      points: [
        "Проходы заняты пачками листа и профилем",
        "Погрузчик тратит время на перекладку",
        "Материал царапается и деформируется"
      ]
    },
    after: {
      title: "Система хранения, порядок",
      text: "Материал получает адрес, доступ становится быстрее, склад готов к росту.",
      imageUrl: visualAssets.afterWarehouse,
      imageAlt: "После внедрения: система хранения и порядок на складе",
      points: [
        "Каждая партия хранится в своей зоне",
        "Материал быстрее подается в работу",
        "Проходы свободны для техники и людей"
      ]
    }
  },
  advantages: [
    {
      title: "Инженерный подбор",
      text: "Считаем нагрузку, габариты, способ загрузки и реальные ограничения помещения.",
      icon: "badge-check"
    },
    {
      title: "Собственное производство",
      text: "Проектирование, металлообработка, покраска и сборка остаются в одной цепочке.",
      icon: "factory"
    },
    {
      title: "Быстрый доступ к металлу",
      text: "Материал получает адрес, а погрузчик или кран-балка работают без лишней перекладки.",
      icon: "zap"
    },
    {
      title: "Безопасность склада",
      text: "Проверяем опоры, нагрузку, проходы, зоны обслуживания и запас прочности.",
      icon: "shield-check"
    },
    {
      title: "Доставка и монтаж",
      text: "Учитываем логистику, подъезд, сборку и ввод оборудования на объекте.",
      icon: "truck"
    },
    {
      title: "Готовность к учету",
      text: "Заявку и параметры можно передавать в CRM, 1С или складскую систему.",
      icon: "clipboard-check"
    }
  ],
  cases: [
    {
      customer: "Компания-заказчик",
      title: "Хранение листового металла рядом с зоной резки",
      task: "Убрать листы из проходов и ускорить подачу материала к станку.",
      result: "Система хранения освободила рабочую зону и упростила поиск нужного формата.",
      imageUrl: visualAssets.productionLine,
      imageAlt: "Хранение листового металла рядом с производственной линией"
    },
    {
      customer: "Компания-заказчик",
      title: "Адресное хранение труб и профиля",
      task: "Разделить типоразмеры и убрать постоянную перекладку пачек.",
      result: "Погрузчик подъезжает к нужной зоне без лишних маневров и потери времени.",
      imageUrl: visualAssets.tubesProfile,
      imageAlt: "Адресное хранение труб и профиля"
    },
    {
      customer: "Компания-заказчик",
      title: "Консольные стеллажи для металлоконструкций",
      task: "Организовать балки, швеллер и профиль с доступом кран-балкой.",
      result: "Склад стал понятнее для мастеров, а выдача металла стала безопаснее.",
      imageUrl: visualAssets.steelProfile,
      imageAlt: "Консольные стеллажи для металлоконструкций"
    },
    {
      customer: "Компания-заказчик",
      title: "Выкатные кассеты для частого отбора",
      task: "Дать прямой доступ к листу и заготовкам без повреждений.",
      result: "Оператор получает нужную кассету без разбора соседних уровней.",
      imageUrl: visualAssets.forklift,
      imageAlt: "Выкатные кассеты для частого отбора листового металла"
    }
  ],
  geography: {
    projects: [
      { city: "Москва", company: "производство металлоконструкций" },
      { city: "Санкт-Петербург", company: "склад металлопроката" },
      { city: "Казань", company: "машиностроительный цех" },
      { city: "Екатеринбург", company: "участок лазерной резки" },
      { city: "Новосибирск", company: "производственный склад" },
      { city: "Краснодар", company: "склад труб и профиля" }
    ],
    totalLabel: "700+ городов обслуживания"
  },
  reviews: [
    {
      name: "Виктор М.",
      role: "руководитель склада",
      text: "Понравилось, что нам не пытались продать абстрактный стеллаж. Сначала разобрали металл, габариты, погрузчик и только потом предложили схему."
    },
    {
      name: "Александр Т.",
      role: "начальник производства",
      text: "После внедрения стало проще искать нужный профиль. Сотрудники меньше перекладывают металл, проходы свободнее."
    },
    {
      name: "Николай Б.",
      role: "главный инженер",
      text: "Хороший инженерный подход: сразу посчитали нагрузку, опоры, высоту и варианты расширения."
    },
    {
      name: "Сергей А.",
      role: "директор",
      text: "Нужна была система с запасом по нагрузке и нормальной покраской. Получили понятное решение под помещение."
    }
  ],
  about: {
    title: "Мы проектируем и производим промышленное оборудование под задачи заказчика",
    text:
      "КБ Парус работает с 2009 года. Мы занимаемся промышленным оборудованием, автоматизацией, металлообработкой и инженерными решениями, которые должны работать в реальном цехе, а не только хорошо выглядеть в каталоге.",
    features: [
      { label: "Собственное производство", icon: "factory" },
      { label: "Проектирование под задачу", icon: "wrench" },
      { label: "Расчет под нагрузку", icon: "shield-check" }
    ],
    metrics: [
      { value: "2009", label: "работаем с промышленным оборудованием", icon: "factory" },
      { value: "15+ лет", label: "проектируем и производим решения", icon: "wrench" },
      { value: "3000+", label: "покупателей оборудования", icon: "badge-check" },
      { value: "18 мес.", label: "гарантийный подход к продукции", icon: "shield-check" }
    ]
  },
  banners: {
    kbparus: {
      imageUrl: "/assets/images/kbparus-cnc-banner.png",
      imageAlt: "КБ Парус — производитель оборудования для металлообработки",
      url: "https://www.kbparus.ru/",
      ctaLabel: "Перейти на kbparus.ru"
    },
    coating: {
      imageUrl: "/assets/images/baner_liniiokraski.png",
      imageAlt: "ЛинииОкраски.рф — линии порошковой окраски от КБ Парус",
      url: "https://линииокраски.рф/",
      ctaLabel: "Перейти на линииокраски.рф"
    }
  },
  shipmentSteps: [
    {
      title: "Получаем заявку",
      text: "Фиксируем задачу, материал, размеры, нагрузку и условия склада.",
      icon: "message-circle"
    },
    {
      title: "Выполняем расчет",
      text: "Подбираем конструкцию, опции, покраску, доставку и монтаж.",
      icon: "wrench"
    },
    {
      title: "Отгружаем на объект",
      text: "Готовим оборудование, документы и передаем систему в монтаж.",
      icon: "route"
    }
  ],
  partners: Array.from({ length: 8 }, (_, index) => ({
    name: `Логотип партнера ${index + 1}`,
    mark: String(index + 1).padStart(2, "0")
  })),
  faq: [
    {
      question: "Как понять, какая система хранения подойдет нашему складу?",
      answer:
        "Нужно оценить материал, габариты, вес пачек, частоту отбора, технику загрузки и ограничения помещения. Калькулятор собирает первичные данные, а инженер проверяет схему."
    },
    {
      question: "Можно ли хранить трубы, профиль, балки и швеллер?",
      answer:
        "Да. Для труб, профиля, балок и швеллера обычно подходят консольные, ячеистые или специальные системы под погрузчик и кран-балку."
    },
    {
      question: "Можно ли хранить листовой металл вертикально или в кассетах?",
      answer:
        "Да. Лист можно хранить вертикально, в кассетах под погрузчик или в выкатных кассетах. Выбор зависит от формата листа, веса пачки и частоты доступа."
    },
    {
      question: "Как рассчитывается нагрузка?",
      answer:
        "Берется максимальный вес материала на полку или кассету, количество уровней, схема опирания и способ загрузки. После этого инженер закладывает запас прочности."
    },
    {
      question: "Можно ли изготовить систему под размеры нашего помещения?",
      answer:
        "Да. Мы учитываем высоту, ширину проходов, ворота, колонны, зоны обслуживания и работу погрузчика или кран-балки."
    },
    {
      question: "Можно ли загружать металл погрузчиком или кран-балкой?",
      answer:
        "Да. Способ загрузки выбирается заранее, потому что от него зависит конструкция, доступ к ячейкам и требования к безопасности."
    },
    {
      question: "Сколько места можно сэкономить?",
      answer:
        "Зависит от текущего склада, номенклатуры и высоты помещения. Обычно экономия появляется за счет вертикального использования объема и адресного хранения."
    },
    {
      question: "Делаете ли вы доставку и монтаж?",
      answer:
        "Да. Доставку и монтаж можно включить в предложение после уточнения состава системы и условий объекта."
    },
    {
      question: "Можно ли потом расширить систему?",
      answer:
        "Да. Расширение можно предусмотреть на этапе проектирования: по секциям, башням, кассетам или дополнительным зонам хранения."
    },
    {
      question: "Можно ли передавать заявки и расчеты в CRM, 1С или складскую систему?",
      answer:
        "Да, заявки и расчеты можно передавать в CRM или учетную систему. Это нужно, чтобы менеджер сразу видел параметры запроса и быстрее готовил предложение."
    }
  ]
};

function pickUrl(media: MaybeMedia): string | undefined {
  if (!media || typeof media === "number") return undefined;
  return media.url ?? undefined;
}

function pickAlt(media: MaybeMedia): string | undefined {
  if (!media || typeof media === "number") return undefined;
  return media.alt ?? undefined;
}

function buildSrcSet(media: MaybeMedia): string | undefined {
  if (!media || typeof media === "number" || !media.sizes) return undefined;
  const entries: string[] = [];
  for (const size of Object.values(media.sizes)) {
    if (size?.url && size?.width) entries.push(`${size.url} ${size.width}w`);
  }
  return entries.length > 0 ? entries.join(", ") : undefined;
}

function nonEmptyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function textList(rows: Array<{ value?: string | null }> | null | undefined): string[] {
  return rows?.map((row) => row.value).filter((value): value is string => Boolean(value)) ?? [];
}

function withFallback<T>(items: T[] | null | undefined, fallback: T[]): T[] {
  return items && items.length > 0 ? items : fallback;
}

function mediaWithFallback(media: MaybeMedia, fallbackUrl: string, fallbackAlt: string) {
  return {
    imageUrl: pickUrl(media) ?? fallbackUrl,
    imageAlt: pickAlt(media) ?? fallbackAlt
  };
}

function normalizeHomeContent(home: AnyRecord | null | undefined): HomePageContent {
  const hero = normalizeHero(home?.hero);
  const defaults = DEFAULT_HOME_CONTENT;

  return {
    hero,
    storedMaterials: normalizeStoredMaterials(home?.storedMaterials, defaults.storedMaterials),
    beforeAfter: normalizeBeforeAfter(home, defaults.beforeAfter),
    advantages: normalizeIconCards(home?.advantages, defaults.advantages, "badge-check"),
    cases: normalizeCases(home?.cases, defaults.cases),
    geography: {
      projects: withFallback(
        home?.geoProjects
          ?.map((item: AnyRecord) => ({
            city: item.city,
            company: item.project
          }))
          .filter((item: { city?: string; company?: string }) => item.city && item.company),
        defaults.geography.projects
      ),
      totalLabel: defaults.geography.totalLabel
    },
    reviews: withFallback(
      home?.reviews
        ?.map((item: AnyRecord, index: number) => ({
          name: item.name,
          role: item.role ?? "",
          text: item.text,
          imageUrl: pickUrl(item.image),
          imageAlt: pickAlt(item.image) ?? item.name ?? defaults.reviews[index]?.imageAlt
        }))
        .filter((item: { name?: string; text?: string }) => item.name && item.text),
      defaults.reviews
    ),
    about: {
      title: nonEmptyString(home?.aboutTitle, defaults.about.title),
      text: nonEmptyString(home?.aboutText, defaults.about.text),
      features: withFallback(
        home?.aboutFeatures
          ?.map((item: AnyRecord, index: number) => ({
            label: item.label,
            icon: (item.icon ?? defaults.about.features[index]?.icon ?? "factory") as IconKey
          }))
          .filter((item: { label?: string }) => item.label),
        defaults.about.features
      ),
      metrics: withFallback(
        home?.aboutMetrics
          ?.map((item: AnyRecord, index: number) => ({
            value: item.value,
            label: item.label,
            icon: defaults.about.metrics[index]?.icon ?? "badge-check"
          }))
          .filter((item: { value?: string; label?: string }) => item.value && item.label),
        defaults.about.metrics
      )
    },
    banners: normalizeBanners(home, defaults.banners),
    shipmentSteps: normalizeIconCards(home?.shipmentSteps, defaults.shipmentSteps, "route"),
    partners: normalizePartners(home?.partners, defaults.partners),
    faq: withFallback(
      home?.faq
        ?.map((item: AnyRecord) => ({ question: item.question, answer: item.answer }))
        .filter((item: { question?: string; answer?: string }) => item.question && item.answer),
      defaults.faq
    )
  };
}

function normalizeHero(hero: AnyRecord | null | undefined): HeroData {
  const defaults = DEFAULT_HOME_CONTENT.hero;
  if (!hero) return defaults;

  const metrics = withFallback(
    hero.metrics
      ?.map((item: AnyRecord) => ({ value: item.value, label: item.label }))
      .filter((item: { value?: string; label?: string }) => item.value && item.label),
    defaults.metrics
  );
  const actions = withFallback(
    hero.actions
      ?.map((item: AnyRecord) => ({
        label: item.label,
        href: item.href,
        style: (item.style === "secondary" ? "secondary" : "primary") as HeroAction["style"]
      }))
      .filter((item: { label?: string; href?: string }) => item.label && item.href),
    defaults.actions
  );
  const bg = hero.background;
  const wantVideo = bg?.type === "video" || !bg?.type;

  if (wantVideo) {
    return {
      eyebrow: nonEmptyString(hero.eyebrow, defaults.eyebrow),
      title: nonEmptyString(hero.title, defaults.title),
      description: hero.description ?? undefined,
      background: {
        type: "video",
        videoUrl: pickUrl(bg?.video) ?? (defaults.background as { videoUrl: string }).videoUrl,
        posterUrl: pickUrl(bg?.poster) ?? (defaults.background as { posterUrl: string }).posterUrl
      },
      metrics,
      actions
    };
  }

  const imageUrl = pickUrl(bg?.image);
  if (!imageUrl) return defaults;

  return {
    eyebrow: nonEmptyString(hero.eyebrow, defaults.eyebrow),
    title: nonEmptyString(hero.title, defaults.title),
    description: hero.description ?? undefined,
    background: {
      type: "image",
      imageUrl,
      imageSrcSet: buildSrcSet(bg?.image),
      alt: pickAlt(bg?.image) ?? "Производство КБ Парус — системы хранения металла"
    },
    metrics,
    actions
  };
}

function normalizeStoredMaterials(items: AnyRecord[] | null | undefined, defaults: HomePageContent["storedMaterials"]) {
  const normalized =
    items
      ?.map((item, index) => ({
        title: item.title,
        text: item.description,
        label: item.label ?? defaults[index]?.label ?? item.title,
        icon: (item.icon ?? defaults[index]?.icon ?? "package-check") as IconKey,
        imageUrl: pickUrl(item.image) ?? defaults[index]?.imageUrl,
        imageAlt: pickAlt(item.image) ?? item.title
      }))
      .filter((item) => item.title && item.text) ?? [];
  return normalized.length > 0 ? normalized : defaults;
}

function normalizeBeforeAfter(home: AnyRecord | null | undefined, defaults: HomePageContent["beforeAfter"]) {
  const beforeMedia = mediaWithFallback(home?.beforeBlock?.image, defaults.before.imageUrl, defaults.before.imageAlt);
  const afterMedia = mediaWithFallback(home?.afterBlock?.image, defaults.after.imageUrl, defaults.after.imageAlt);

  return {
    before: {
      title: nonEmptyString(home?.beforeBlock?.title, defaults.before.title),
      text: nonEmptyString(home?.beforeBlock?.text, defaults.before.text),
      ...beforeMedia,
      points: withFallback(textList(home?.beforeBlock?.points), defaults.before.points)
    },
    after: {
      title: nonEmptyString(home?.afterBlock?.title, defaults.after.title),
      text: nonEmptyString(home?.afterBlock?.text, defaults.after.text),
      ...afterMedia,
      points: withFallback(textList(home?.afterBlock?.points), defaults.after.points)
    }
  };
}

function normalizeIconCards<T extends { title: string; text: string; icon: IconKey }>(
  items: AnyRecord[] | null | undefined,
  defaults: T[],
  defaultIcon: IconKey
): T[] {
  const normalized =
    items
      ?.map((item, index) => ({
        title: item.title,
        text: item.description ?? item.text,
        icon: (item.icon ?? defaults[index]?.icon ?? defaultIcon) as IconKey
      }))
      .filter((item) => item.title && item.text) ?? [];
  return (normalized.length > 0 ? normalized : defaults) as T[];
}

function normalizeCases(items: AnyRecord[] | null | undefined, defaults: HomePageContent["cases"]) {
  const normalized =
    items
      ?.map((item, index) => {
        const media = mediaWithFallback(item.image, defaults[index]?.imageUrl ?? visualAssets.productionLine, item.title ?? "Кейс");
        return {
          customer: item.customer ?? item.title ?? defaults[index]?.customer ?? "Компания-заказчик",
          title: item.title,
          task: item.task ?? item.description ?? defaults[index]?.task ?? "",
          result: item.result ?? defaults[index]?.result ?? "",
          ...media
        };
      })
      .filter((item) => item.title && (item.task || item.result)) ?? [];
  return normalized.length > 0 ? normalized : defaults;
}

function normalizeBanners(home: AnyRecord | null | undefined, defaults: HomePageContent["banners"]) {
  return {
    kbparus: {
      ...mediaWithFallback(home?.kbparusBanner?.image, defaults.kbparus.imageUrl, defaults.kbparus.imageAlt),
      url: nonEmptyString(home?.kbparusBanner?.url, defaults.kbparus.url),
      ctaLabel: nonEmptyString(home?.kbparusBanner?.ctaLabel, defaults.kbparus.ctaLabel)
    },
    coating: {
      ...mediaWithFallback(home?.coatingBanner?.image, defaults.coating.imageUrl, defaults.coating.imageAlt),
      url: nonEmptyString(home?.coatingBanner?.url, defaults.coating.url),
      ctaLabel: nonEmptyString(home?.coatingBanner?.ctaLabel, defaults.coating.ctaLabel)
    }
  };
}

function normalizePartners(items: AnyRecord[] | null | undefined, defaults: HomePageContent["partners"]) {
  const normalized =
    items
      ?.map((item, index) => ({
        name: item.name,
        mark: defaults[index]?.mark ?? String(index + 1).padStart(2, "0"),
        logoUrl: pickUrl(item.logo),
        logoAlt: pickAlt(item.logo) ?? item.name,
        url: item.url
      }))
      .filter((item) => item.name) ?? [];
  return normalized.length > 0 ? normalized : defaults;
}

export async function getHomePageContent(): Promise<HomePageContent> {
  const cms = await getCmsClient();
  if (!cms) return DEFAULT_HOME_CONTENT;

  try {
    const home = (await cms.findGlobal({ slug: "home-content", depth: 2 })) as AnyRecord | null;
    return normalizeHomeContent(home);
  } catch (error) {
    console.warn("[cms] getHomePageContent failed:", error);
    return DEFAULT_HOME_CONTENT;
  }
}

export async function getHeroContent(): Promise<HeroData> {
  return (await getHomePageContent()).hero;
}
