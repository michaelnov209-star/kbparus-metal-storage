"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent
} from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BadgePercent,
  Bot,
  Check,
  ClipboardCheck,
  CloudSun,
  Combine,
  Construction,
  Forklift,
  Gauge,
  GalleryHorizontalEnd,
  Info,
  Layers3,
  MapPin,
  MessageSquareText,
  MoveHorizontal,
  MoveVertical,
  PackageSearch,
  Ruler,
  Send,
  ShieldCheck,
  Warehouse,
  Weight,
  Workflow,
  type LucideIcon,
  X
} from "lucide-react";
import {
  calculatorProfiles as fallbackCalculatorProfiles,
  defaultCalculatorProfileId,
  getCalculatorProfile
} from "@/data/storageSystems/excelCalculator";
import type {
  CalculatorProfile,
  CalculatorProfileId
} from "@/data/storageSystems/excelCalculator";
import {
  calculateStorageSystem,
  formatRoundedRub,
  formatRub
} from "@/lib/calculator";
import type { CalculatorInput } from "@/lib/calculator";
import { trackYandexGoal } from "@/lib/analytics/metrika";
import {
  captureLeadUtm,
  getStoredLeadUtm,
  saveLastCalculatorLead
} from "@/lib/leads/client-state";
import { createLeadConsent } from "@/lib/leads/contract";
import { getLocalCatalogImageVariants } from "@/lib/cms/catalog-image-variants";
import { getLocalProductImageVariants } from "@/lib/cms/product-image-variants";
import { buildImageSrcSet } from "@/lib/media/srcset";
import { CalculatorV4ChoiceField as ChoiceField } from "@/components/calculator/CalculatorV4ChoiceField";
import { CalculatorV4Progress } from "@/components/calculator/CalculatorV4Progress";
import {
  buildInputForProfile,
  reconcileInputForProfile
} from "@/components/calculator/calculator-state";
import styles from "@/components/calculator/CalculatorV4.module.css";

const steps = ["Система", "Параметры", "Расчёт"] as const;

const profileCopy: Record<
  string,
  {
    title: string;
    shortTitle: string;
    description: string;
    bestFor: string;
    image: string;
  }
> = {
  "auto-sheet-metal": {
    title: "Автоматический стеллаж листового металла",
    shortTitle: "Автоматический стеллаж листового металла",
    description:
      "Для листового металла с подъёмным модулем, выдачей паллет и опциями безопасности.",
    bestFor:
      "производству с частым оборотом листов, дефицитом площади и автоматической выдачей.",
    image: "/assets/images/catalog/01-auto-sheet-metal.jpg"
  },
  "auto-sort-metal": {
    title: "Автоматический стеллаж сортового и трубного металлопроката",
    shortTitle: "Автоматический стеллаж сортового металла",
    description:
      "Для труб, профиля, балок и сортового проката с механизированной выдачей.",
    bestFor:
      "складу труб, профиля и балок с большим ассортиментом и регулярной комплектацией.",
    image: "/assets/images/catalog/03-sort-and-pipe-storage.jpg"
  },
  "rollout-cassette-rack": {
    title: "Система хранения с выкатными полками",
    shortTitle: "Система с выкатными полками",
    description:
      "Для листа и пачек, когда нужен прямой доступ к каждой кассете.",
    bestFor:
      "участку, где важен быстрый доступ к каждой пачке без разбора соседних уровней.",
    image: "/assets/images/products/manual-sheet-metal/2.2-safe-studio.png"
  },
  "forklift-cassette-rack": {
    title: "Кассетная система хранения листового металла",
    shortTitle: "Кассетная система под погрузчик",
    description:
      "Для плотного хранения листа с доступом погрузчиком или складской техникой.",
    bestFor:
      "складу с погрузчиком, где приоритетны плотность хранения и экономичность.",
    image: "/assets/images/products/manual-sheet-metal/2.1-safe-studio.png"
  },
  "two-side-rollout-rack": {
    title: "Двухсторонняя система хранения с выкатными полками",
    shortTitle: "Двухсторонняя выкатная система",
    description:
      "Для складов, где нужен доступ к кассетам с одной или двух сторон.",
    bestFor:
      "цеху с двумя проходами или одновременной работой нескольких операторов.",
    image: "/assets/images/products/manual-sheet-metal/2.4-safe-studio.png"
  },
  "hybrid-rollout-rack": {
    title: "Комбинированная система хранения с выкатными полками",
    shortTitle: "Гибридная система",
    description:
      "Комбинация полок под погрузчик и выкатных кассет в одной системе.",
    bestFor:
      "предприятию, которому нужны плотное хранение и быстрый доступ к ходовым позициям.",
    image: "/assets/images/products/manual-sheet-metal/2.3-safe-studio.png"
  }
};

const optionCopy: Record<string, string> = {
  scale: "Весы на распалетчик",
  "infrared-safety": "Инфракрасные ограждения безопасности",
  "vacuum-grip": "Вакуумный захват",
  "swing-crane": "Консольно-поворотный кран",
  "warehouse-accounting": "Передача данных в складской учёт"
};

const dimensionHints = {
  heightMm:
    "Высота ячейки или полезного пространства под материал. Выберите ближайший ходовой вариант.",
  widthMm: "Ширина рабочей зоны под лист, кассету или пачку материала.",
  lengthMm:
    "Длина рабочей зоны. Для труб, профиля и балок выбирайте вариант с запасом.",
  loadKg:
    "Расчётная нагрузка на одну полку или кассету. Финальный запас проверит инженер.",
  shelfCount:
    "Количество уровней хранения в одной башне или секции системы.",
  rolloutShelfCount:
    "Количество выкатных кассет для прямого доступа к материалу.",
  towerCount:
    "Количество башен или секций. Больше секций — выше вместимость."
};

const guidedChoices: Array<{
  title: string;
  text: string;
  profileId: CalculatorProfileId;
}> = [
  {
    title: "Листовой металл",
    text: "Листы, пачки листа и форматные заготовки.",
    profileId: "auto-sheet-metal"
  },
  {
    title: "Трубы и профиль",
    text: "Трубы, балки, швеллер и сортовой прокат.",
    profileId: "auto-sort-metal"
  },
  {
    title: "Прямой доступ к кассетам",
    text: "Нужный уровень выдвигается без разбора соседних.",
    profileId: "rollout-cassette-rack"
  }
];

const siteConditions: Array<{
  id: string;
  title: string;
  text: string;
  icon: LucideIcon;
}> = [
  {
    id: "narrow-access",
    title: "Сложно завезти оборудование",
    text: "Узкие ворота, проходы или разворотная зона.",
    icon: MoveHorizontal
  },
  {
    id: "low-ceiling",
    title: "Есть ограничения по высоте",
    text: "Низкий потолок, балки, коммуникации или крановые пути.",
    icon: MoveVertical
  },
  {
    id: "crane-loading",
    title: "Материал грузят кран-балкой",
    text: "Нужно учесть зону строповки и безопасный доступ сверху.",
    icon: Construction
  },
  {
    id: "forklift-loading",
    title: "Материал грузят погрузчиком",
    text: "Важны проходы, радиус разворота и высота подъёма.",
    icon: Forklift
  },
  {
    id: "floor-load",
    title: "Есть сомнения по полу",
    text: "Нужно проверить нагрузку на основание и опоры.",
    icon: Weight
  },
  {
    id: "outdoor",
    title: "Система будет стоять на улице",
    text: "Потребуются защита, покрытие и уточнение условий эксплуатации.",
    icon: CloudSun
  }
];

const systemIcons: Record<string, LucideIcon> = {
  "auto-sheet-metal": Bot,
  "auto-sort-metal": Workflow,
  "rollout-cassette-rack": GalleryHorizontalEnd,
  "forklift-cassette-rack": Forklift,
  "two-side-rollout-rack": ArrowLeftRight,
  "hybrid-rollout-rack": Combine
};

const iconKeyIcons: Record<string, LucideIcon> = {
  automation: Bot,
  "long-products": Workflow,
  rollout: GalleryHorizontalEnd,
  forklift: Forklift,
  "two-sided": ArrowLeftRight,
  hybrid: Combine
};

function systemIcon(profile: CalculatorProfile): LucideIcon {
  if (profile.iconKey && iconKeyIcons[profile.iconKey]) {
    return iconKeyIcons[profile.iconKey];
  }
  if (systemIcons[profile.id]) return systemIcons[profile.id];
  if (profile.pricing.kind === "automatic") return Bot;
  if (profile.pricing.kind === "forkliftCassette") return Forklift;
  if (profile.pricing.kind === "rollout") return GalleryHorizontalEnd;
  return Combine;
}

function defaultProfileImage(profile: CalculatorProfile) {
  if (profile.pricing.kind === "automatic") {
    return profile.productType === "automated" &&
      profile.id.includes("sort")
      ? "/assets/images/catalog/03-sort-and-pipe-storage.jpg"
      : "/assets/images/catalog/01-auto-sheet-metal.jpg";
  }
  if (profile.pricing.kind === "forkliftCassette") {
    return "/assets/images/products/manual-sheet-metal/2.1-safe-studio.png";
  }
  if (profile.pricing.kind === "hybrid") {
    return "/assets/images/products/manual-sheet-metal/2.3-safe-studio.png";
  }
  return "/assets/images/products/manual-sheet-metal/2.2-safe-studio.png";
}

function defaultBestFor(profile: CalculatorProfile) {
  if (profile.pricing.kind === "automatic") {
    return "производству с регулярным оборотом металла, высокой вместимостью и механизированной выдачей.";
  }
  if (profile.pricing.kind === "forkliftCassette") {
    return "складу с погрузчиком, где важны плотность хранения и простой доступ к кассетам.";
  }
  if (profile.pricing.kind === "hybrid") {
    return "предприятию, которому нужны плотное хранение и быстрый доступ к ходовым позициям.";
  }
  return "участку, где нужен прямой доступ к каждому уровню хранения.";
}

const citySuggestions = [
  "Москва",
  "Санкт-Петербург",
  "Воронеж",
  "Казань",
  "Нижний Новгород",
  "Екатеринбург",
  "Самара",
  "Ростов-на-Дону",
  "Краснодар",
  "Пермь",
  "Уфа",
  "Челябинск",
  "Новосибирск",
  "Минск"
];

function calculatorCardImage(source: string) {
  const catalogVariants = getLocalCatalogImageVariants(source);
  if (catalogVariants) {
    return {
      src: catalogVariants.medium,
      srcSet: `${catalogVariants.thumb} 320w, ${catalogVariants.medium} 640w, ${catalogVariants.large} 960w`
    };
  }

  const productVariants = getLocalProductImageVariants(source);
  if (!productVariants) return { src: source, srcSet: undefined };

  return {
    src: productVariants.medium.src,
    srcSet: buildImageSrcSet(Object.values(productVariants))
  };
}

function profileTypeLabel(profile: CalculatorProfile) {
  if (profile.productType === "automated") return "Автоматизированная";
  if (profile.productType === "rollout") return "Выкатная";
  if (profile.productType === "hybrid") return "Комбинированная";
  return "Ручная";
}

export function Calculator({
  profiles = fallbackCalculatorProfiles
}: {
  profiles?: readonly CalculatorProfile[];
}) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<CalculatorInput>(() =>
    buildInputForProfile(
      profiles[0]?.id ?? defaultCalculatorProfileId,
      profiles
    )
  );
  const [contact, setContact] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });
  const [leadStatus, setLeadStatus] = useState("");
  const [hpUrl, setHpUrl] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState("");
  const formStartedAt = useRef<number>(Date.now());
  const calculatorStarted = useRef(false);
  const leadFormRef = useRef<HTMLFormElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const mobileSummaryTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileSummaryCloseRef = useRef<HTMLButtonElement>(null);
  const mobileSummaryPanelRef = useRef<HTMLDivElement>(null);

  const profile = useMemo(
    () => getCalculatorProfile(input.systemId, profiles),
    [input.systemId, profiles]
  );
  const shelfCountOptions =
    profile.pricing.kind === "hybrid" && profile.maxCombinedShelfCount
      ? profile.shelfCountOptions.filter(
          (value) =>
            value + input.rolloutShelfCount <= profile.maxCombinedShelfCount!
        )
      : profile.shelfCountOptions;
  const rolloutShelfCountOptions =
    profile.pricing.kind === "hybrid" &&
    profile.maxCombinedShelfCount &&
    profile.rolloutShelfCountOptions
      ? profile.rolloutShelfCountOptions.filter(
          (value) => value + input.shelfCount <= profile.maxCombinedShelfCount!
        )
      : (profile.rolloutShelfCountOptions ?? []);
  const result = useMemo(
    () => calculateStorageSystem(input, profile),
    [input, profile]
  );
  const [animatedPrice, setAnimatedPrice] = useState(result.fromPrice);
  const display = useMemo(() => {
    const fallback = profileCopy[profile.id];
    return {
      ...fallback,
      title: fallback?.title || profile.title || "Система хранения металла",
      shortTitle:
        fallback?.shortTitle || profile.shortTitle || profile.title,
      description:
        fallback?.description ||
        profile.description ||
        "Конфигурация системы хранения под параметры вашего объекта.",
      bestFor:
        fallback?.bestFor || profile.bestFor || defaultBestFor(profile),
      image:
        profile.image || fallback?.image || defaultProfileImage(profile),
      imageAlt:
        profile.imageAlt ||
        profile.title ||
        fallback?.title ||
        "Система хранения металла"
    };
  }, [
    profile.bestFor,
    profile.description,
    profile.id,
    profile.image,
    profile.imageAlt,
    profile.pricing.kind,
    profile.productType,
    profile.shortTitle,
    profile.title
  ]);
  const displayImage = calculatorCardImage(display.image);
  const selectedOptions = profile.options.filter((option) =>
    input.optionIds.includes(option.id)
  );
  const selectedConditionTitles = selectedConditions
    .map((id) => siteConditions.find((condition) => condition.id === id)?.title)
    .filter((title): title is string => Boolean(title));
  const conditionsComment = selectedConditionTitles.length || customCondition
    ? `Условия объекта: ${[
        ...selectedConditionTitles,
        customCondition && `Свой вариант: ${customCondition}`
      ]
        .filter(Boolean)
        .join(", ")}`
    : "";
  const roundedPrice = formatRoundedRub(animatedPrice);
  const priceNumber = roundedPrice.replace(/\s?₽/u, "");
  const safePriceNumber = priceNumber.replace(/\s/g, "\u00a0");
  const priceLabel = `от\u00a0${safePriceNumber}\u00a0₽`;
  const storedWeightLabel =
    result.engineeringSummary.totalStoredWeightKg.toLocaleString("ru-RU");
  const supportLoadLabel =
    result.engineeringSummary.supportLoadKg.toLocaleString("ru-RU");
  const shelfFieldTitle =
    profile.pricing.kind === "hybrid"
      ? "Полки под погрузчик"
      : profile.pricing.kind === "rollout"
        ? "Выкатные кассеты"
        : profile.pricing.kind === "forkliftCassette"
          ? "Кассеты под погрузчик"
          : "Уровни хранения";
  const shelfFieldHint =
    profile.pricing.kind === "hybrid"
      ? "Количество обычных полок, которые обслуживаются погрузчиком. Выкатные кассеты выбираются отдельным параметром ниже."
      : profile.pricing.kind === "rollout"
        ? "Количество выкатных кассет в стеллаже. Каждая кассета выдвигается для доступа к листу или пачке."
        : profile.pricing.kind === "forkliftCassette"
          ? "Количество кассетных уровней, рассчитанных на обслуживание погрузчиком."
          : dimensionHints.shelfCount;
  const storageFormatLabel =
    profile.pricing.kind === "hybrid"
      ? `${input.shelfCount.toLocaleString(
          "ru-RU"
        )} полок под погрузчик + ${input.rolloutShelfCount.toLocaleString(
          "ru-RU"
        )} выкатных кассет`
      : profile.pricing.kind === "rollout"
        ? `${input.shelfCount.toLocaleString("ru-RU")} выкатных кассет`
        : profile.pricing.kind === "forkliftCassette"
          ? `${input.shelfCount.toLocaleString("ru-RU")} кассет под погрузчик`
          : `${input.shelfCount.toLocaleString("ru-RU")} уровней хранения`;
  const summaryFacts = [
    storageFormatLabel,
    `До ${input.loadKg.toLocaleString("ru-RU")} кг на уровень`,
    `Габарит системы: ${result.engineeringSummary.rackDimensionsLabel}`,
    `Рабочая ячейка: ${result.engineeringSummary.workingCellDimensionsLabel}`
  ];
  const resultFacts = [
    { label: "Вместимость", value: storageFormatLabel },
    {
      label: "Нагрузка",
      value: `${input.loadKg.toLocaleString("ru-RU")} кг на уровень`
    },
    {
      label: "Габарит системы",
      value: result.engineeringSummary.rackDimensionsLabel
    },
    {
      label: "Рабочая ячейка",
      value: result.engineeringSummary.workingCellDimensionsLabel
    }
  ];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimatedPrice(result.fromPrice);
      return;
    }

    const fromValue = animatedPrice;
    const toValue = result.fromPrice;
    const start = performance.now();
    const duration = 320;
    let frame = 0;

    function tick(now: number) {
      const ratio = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setAnimatedPrice(Math.round(fromValue + (toValue - fromValue) * eased));
      if (ratio < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.fromPrice]);

  useEffect(() => {
    captureLeadUtm();
  }, []);

  useEffect(() => {
    if (!mobileSummaryOpen) return;

    mobileSummaryCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileSummaryOpen(false);
        mobileSummaryTriggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        mobileSummaryPanelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => !element.hasAttribute("hidden"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileSummaryOpen]);

  useEffect(() => {
    saveLastCalculatorLead({
      calculatorInput: input,
      recommendedConfig: {
        title: display.title,
        dimensions: result.engineeringSummary.rackDimensionsLabel,
        loadKg: input.loadKg,
        shelfCount: input.shelfCount,
        rolloutShelfCount: input.rolloutShelfCount,
        towerCount: input.towerCount,
        options: profile.options
          .filter((option) => input.optionIds.includes(option.id))
          .map((option) => optionCopy[option.id] ?? option.title)
      },
      preliminaryPriceFrom: result.fromPrice,
      sourceTitle: display.title,
      sourceUrl:
        typeof window !== "undefined"
          ? `${window.location.origin}/#calculator`
          : undefined,
      sourceImage: display.image
    });
  }, [
    display.image,
    display.title,
    input,
    profile.options,
    result.engineeringSummary.rackDimensionsLabel,
    result.fromPrice
  ]);

  function markCalculatorStarted(action: string) {
    if (!calculatorStarted.current) {
      calculatorStarted.current = true;
      trackYandexGoal("calculator_start", { action });
    }
  }

  function goToStep(nextStep: number, source: string) {
    const normalizedStep = Math.max(0, Math.min(nextStep, steps.length - 1));
    if (normalizedStep === step) return;

    markCalculatorStarted(source);
    trackYandexGoal("calculator_step_change", {
      from: step + 1,
      to: normalizedStep + 1,
      source
    });
    setStep(normalizedStep);
  }

  function selectProfile(profileId: CalculatorProfileId) {
    markCalculatorStarted("select_profile");
    trackYandexGoal("calculator_parameter_change", {
      field: "systemId",
      value: profileId
    });
    setInput((current) =>
      reconcileInputForProfile(current, profileId, profiles)
    );
    setLeadStatus("");
  }

  function selectGuidedChoice(profileId: CalculatorProfileId) {
    markCalculatorStarted("guided_choice");
    trackYandexGoal("calculator_parameter_change", {
      field: "guidedChoice",
      value: profileId
    });
    setInput((current) =>
      reconcileInputForProfile(current, profileId, profiles)
    );
    setLeadStatus("");
  }

  function setNumberField(field: keyof CalculatorInput, value: number) {
    markCalculatorStarted("set_number_field");
    trackYandexGoal("calculator_parameter_change", {
      field: String(field),
      value
    });
    setInput((current) => ({
      ...current,
      [field]: value,
      ...(field === "lengthMm" ? { materialLengthMm: value } : {}),
      ...(field === "widthMm" ? { sheetWidthMm: value } : {}),
      ...(field === "loadKg"
        ? {
            totalStorageWeightKg:
              value * current.shelfCount * current.towerCount
          }
        : {}),
      ...(field === "shelfCount"
        ? { desiredCapacity: value, cassetteCount: value }
        : {}),
      ...(field === "rolloutShelfCount" ? { cassetteCount: value } : {})
    }));
  }

  function toggleOption(id: string) {
    markCalculatorStarted("toggle_option");
    trackYandexGoal("calculator_parameter_change", {
      field: "optionIds",
      value: id
    });
    setInput((current) => ({
      ...current,
      optionIds: current.optionIds.includes(id)
        ? current.optionIds.filter((optionId) => optionId !== id)
        : [...current.optionIds, id]
    }));
  }

  function toggleCondition(condition: string) {
    markCalculatorStarted("toggle_condition");
    trackYandexGoal("calculator_parameter_change", {
      field: "siteCondition",
      value: condition
    });
    setSelectedConditions((current) =>
      current.includes(condition)
        ? current.filter((item) => item !== condition)
        : [...current, condition]
    );
  }

  function setRolloutSide(value: CalculatorInput["rolloutSide"]) {
    markCalculatorStarted("set_rollout_side");
    trackYandexGoal("calculator_parameter_change", {
      field: "rolloutSide",
      value
    });
    setInput((current) => ({ ...current, rolloutSide: value }));
  }

  async function submitLead() {
    if (submittingLead) return;
    if (!consentAccepted) {
      setLeadStatus(
        "Подтвердите согласие на обработку персональных данных."
      );
      return;
    }
    setSubmittingLead(true);
    setLeadStatus("Готовим заявку для инженера...");
    trackYandexGoal("form_submit", {
      title: "calculator",
      leadType: "configurator"
    });
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadType: "configurator",
          contact: {
            name: contact.name || "Заявка с калькулятора",
            phone: contact.phone,
            email: contact.email
          },
          city: input.city,
          comment: [
            contact.address && `Адрес/объект: ${contact.address}`,
            conditionsComment,
            input.comment
          ]
            .filter(Boolean)
            .join("\n"),
          calculatorInput: input,
          recommendedConfig: {
            title: display.title,
            dimensions: result.engineeringSummary.rackDimensionsLabel,
            loadKg: input.loadKg,
            shelfCount: input.shelfCount,
            towerCount: input.towerCount,
            options: selectedOptions.map(
              (option) => optionCopy[option.id] ?? option.title
            )
          },
          preliminaryPriceFrom: result.fromPrice,
          source: `Калькулятор на главной — ${display.title}`,
          sourceTitle: display.title,
          sourceUrl:
            typeof window !== "undefined"
              ? `${window.location.origin}/#calculator`
              : undefined,
          sourceImage: display.image,
          hp_url: hpUrl,
          formStartedAt: formStartedAt.current,
          utm: getStoredLeadUtm(),
          consent: createLeadConsent()
        })
      });

      const data = await response.json().catch(() => ({}));
      setLeadStatus(
        response.ok
          ? "Заявка сформирована. Инженер увидит выбранные параметры и свяжется с вами."
          : (data?.error ??
              "Не удалось сформировать заявку. Попробуйте ещё раз или позвоните нам.")
      );
      if (response.ok) {
        trackYandexGoal("lead_submit_success", {
          title: "calculator",
          leadType: "configurator"
        });
        setConsentAccepted(false);
        formStartedAt.current = Date.now();
      }
    } catch {
      setLeadStatus(
        "Сеть недоступна. Попробуйте через минуту или позвоните нам."
      );
    } finally {
      setSubmittingLead(false);
    }
  }

  function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    void submitLead();
  }

  function focusLeadForm() {
    setMobileSummaryOpen(false);
    leadFormRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center"
    });
    window.setTimeout(() => phoneInputRef.current?.focus(), 180);
  }

  function requestDiscount() {
    markCalculatorStarted("discount_request");
    trackYandexGoal("calculator_discount_request", {
      title: display.title,
      priceFrom: result.fromPrice
    });
    setInput((current) => {
      const discountText =
        "Хочу обсудить скидку или альтернативную комплектацию под бюджет.";
      return {
        ...current,
        comment: current.comment?.includes(discountText)
          ? current.comment
          : [current.comment, discountText].filter(Boolean).join("\n")
      };
    });
    setLeadStatus(
      "Запрос на скидку добавлен в заявку. Оставьте телефон — инженер увидит это при расчёте."
    );
    window.setTimeout(() => phoneInputRef.current?.focus(), 160);
  }

  return (
    <section
      className={styles.root}
      data-character={profile.productType}
      data-testid="calculator"
      data-ui="calculator-v4"
      id="calculator"
    >
      <output
        aria-atomic="true"
        aria-live="polite"
        className={styles.visuallyHidden}
        data-testid="calculator-price"
      >
        {priceLabel}
      </output>
      <div className={styles.inner}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Предварительный подбор</span>
          <h2>Система хранения и ориентир по цене за 3 шага</h2>
          <p>
            Выберите оборудование и рабочие параметры. Калькулятор сразу
            пересчитает бюджет, а инженер проверит конфигурацию перед
            предложением.
          </p>
          <div className={styles.trustRow} aria-label="Преимущества расчёта">
            <span>
              <Gauge size={16} /> Цена обновляется сразу
            </span>
            <span>
              <ShieldCheck size={16} /> Итог проверит инженер
            </span>
          </div>
        </header>

        <CalculatorV4Progress
          currentStep={step}
          steps={steps}
          price={priceNumber}
          onStepChange={(nextStep) => goToStep(nextStep, "step_tab")}
        />

        <div className={styles.layout}>
          <section
            className={styles.workspace}
            aria-label="Параметры конфигуратора системы хранения"
          >
            {step === 0 && (
              <article className={styles.panel}>
                <div className={styles.panelHeading}>
                  <PackageSearch aria-hidden="true" size={22} />
                  <div>
                    <span>Шаг 1 из 3</span>
                    <h3>Что нужно хранить?</h3>
                    <p>
                      Начните с материала. При необходимости ниже можно выбрать
                      точный тип оборудования.
                    </p>
                  </div>
                </div>

                <div
                  className={styles.scenarioGrid}
                  aria-label="Сценарий хранения"
                >
                  {guidedChoices
                    .filter((choice) =>
                      profiles.some(
                        (candidate) => candidate.id === choice.profileId
                      )
                    )
                    .map((choice, index) => {
                      const ChoiceIcon =
                        index === 0
                          ? Layers3
                          : index === 1
                            ? Warehouse
                            : PackageSearch;
                      const active = choice.profileId === input.systemId;
                      return (
                        <button
                          aria-pressed={active}
                          className={
                            active
                              ? `${styles.scenarioCard} ${styles.isActive}`
                              : styles.scenarioCard
                          }
                          key={choice.title}
                          type="button"
                          onClick={() =>
                            selectGuidedChoice(choice.profileId)
                          }
                        >
                          <span className={styles.scenarioIcon}>
                            <ChoiceIcon size={21} />
                          </span>
                          <span>
                            <strong>{choice.title}</strong>
                            <small>{choice.text}</small>
                          </span>
                          <span
                            className={styles.selectionMark}
                            aria-hidden="true"
                          >
                            <Check size={14} />
                          </span>
                        </button>
                      );
                    })}
                </div>

                <div className={styles.selectedSystem}>
                  <img
                    src={displayImage.src}
                    srcSet={displayImage.srcSet}
                    sizes="(max-width: 760px) 112px, 180px"
                    alt={display.imageAlt}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    width={1536}
                    height={1024}
                  />
                  <div>
                    <span>Выбрано сейчас</span>
                    <h4>{display.shortTitle}</h4>
                    <p>{display.description}</p>
                  </div>
                </div>

                <details className={styles.systemPicker} open>
                  <summary>
                    <span>
                      <strong>Выбрать точный тип системы</strong>
                      <small>
                        Все автоматизированные, кассетные и выкатные варианты
                      </small>
                    </span>
                    <span className={styles.summaryAction}>
                      {profiles.length}{" "}
                      {profiles.length === 1 ? "вариант" : "вариантов"}
                    </span>
                  </summary>
                  <div
                    className={styles.systemGrid}
                    aria-label="Все типы систем хранения"
                  >
                    {profiles.map((item) => {
                      const copy = profileCopy[item.id];
                      const active = item.id === input.systemId;
                      const SystemIcon = systemIcon(item);
                      return (
                        <button
                          aria-pressed={active}
                          className={
                            active
                              ? `${styles.systemButton} ${styles.isActive}`
                              : styles.systemButton
                          }
                          key={item.id}
                          type="button"
                          onClick={() => selectProfile(item.id)}
                        >
                          <span className={styles.systemButtonHeader}>
                            <span className={styles.systemIcon}>
                              <SystemIcon aria-hidden="true" size={18} />
                            </span>
                            <span className={styles.systemType}>
                              {profileTypeLabel(item)}
                            </span>
                          </span>
                          <strong>
                            {copy?.shortTitle || item.shortTitle || item.title}
                          </strong>
                          <small>
                            {copy?.description ||
                              item.description ||
                              "Система хранения под параметры объекта."}
                          </small>
                          <span className={styles.systemUseCase}>
                            <Info aria-hidden="true" size={14} />
                            <span>
                              <b>Лучше подойдёт:</b>{" "}
                              {copy?.bestFor ||
                                item.bestFor ||
                                defaultBestFor(item)}
                            </span>
                          </span>
                          <Check
                            aria-hidden="true"
                            className={styles.systemSelection}
                            size={16}
                          />
                        </button>
                      );
                    })}
                  </div>
                </details>
              </article>
            )}

            {step === 1 && (
              <article className={styles.panel}>
                <div className={styles.panelHeading}>
                  <Ruler aria-hidden="true" size={22} />
                  <div>
                    <span>Шаг 2 из 3</span>
                    <h3>Параметры системы</h3>
                    <p>
                      Выбирайте ближайшие рабочие значения — расчёт обновляется
                      сразу.
                    </p>
                  </div>
                </div>

                <div className={styles.liveSpecification}>
                  <div>
                    <span>Рабочая ячейка</span>
                    <strong>{result.engineeringSummary.workingCellDimensionsLabel}</strong>
                  </div>
                  <div>
                    <span>Габарит системы</span>
                    <strong>{result.engineeringSummary.rackDimensionsLabel}</strong>
                  </div>
                  <div>
                    <span>Нагрузка</span>
                    <strong>
                      <AnimatedNumber value={input.loadKg} /> кг
                    </strong>
                  </div>
                  <div>
                    <span>Предварительно</span>
                    <strong>{priceLabel}</strong>
                  </div>
                </div>

                <div className={styles.parameterSections}>
                  <section className={styles.parameterCard}>
                    <div className={styles.sectionHeading}>
                      <span>01</span>
                      <div>
                        <h4>Габариты материала</h4>
                        <p>Рабочая зона под материал или кассету.</p>
                      </div>
                    </div>
                    <div className={styles.fieldStack}>
                      <ChoiceField
                        title="Длина"
                        hint={dimensionHints.lengthMm}
                        unit="мм"
                        ruler
                        values={profile.lengthOptions.map(
                          (option) => option.value
                        )}
                        active={input.lengthMm}
                        onSelect={(value) =>
                          setNumberField("lengthMm", value)
                        }
                      />
                      <ChoiceField
                        title="Ширина"
                        hint={dimensionHints.widthMm}
                        unit="мм"
                        ruler
                        values={profile.widthOptions.map(
                          (option) => option.value
                        )}
                        active={input.widthMm}
                        onSelect={(value) =>
                          setNumberField("widthMm", value)
                        }
                      />
                      <ChoiceField
                        title="Полезная высота"
                        hint={dimensionHints.heightMm}
                        unit="мм"
                        ruler
                        values={profile.heightOptions.map(
                          (option) => option.value
                        )}
                        active={input.heightMm}
                        onSelect={(value) =>
                          setNumberField("heightMm", value)
                        }
                      />
                      <ChoiceField
                        title="Вес на уровень"
                        hint={dimensionHints.loadKg}
                        unit="кг"
                        values={profile.loadOptions.map(
                          (option) => option.value
                        )}
                        active={input.loadKg}
                        onSelect={(value) =>
                          setNumberField("loadKg", value)
                        }
                      />
                    </div>
                  </section>

                  <section className={styles.parameterCard}>
                    <div className={styles.sectionHeading}>
                      <span>02</span>
                      <div>
                        <h4>Вместимость и доступ</h4>
                        <p>Количество уровней и секций системы.</p>
                      </div>
                    </div>
                    <div className={styles.fieldStack}>
                      <ChoiceField
                        title={shelfFieldTitle}
                        hint={shelfFieldHint}
                        unit="шт."
                        values={shelfCountOptions}
                        active={input.shelfCount}
                        onSelect={(value) =>
                          setNumberField("shelfCount", value)
                        }
                      />
                      <ChoiceField
                        title="Секции системы"
                        hint={dimensionHints.towerCount}
                        unit="шт."
                        values={profile.towerCountOptions}
                        active={input.towerCount}
                        onSelect={(value) =>
                          setNumberField("towerCount", value)
                        }
                      />
                      {rolloutShelfCountOptions.length > 0 && (
                        <ChoiceField
                          title="Выкатные кассеты"
                          hint={dimensionHints.rolloutShelfCount}
                          unit="шт."
                          values={rolloutShelfCountOptions}
                          active={input.rolloutShelfCount}
                          onSelect={(value) =>
                            setNumberField("rolloutShelfCount", value)
                          }
                        />
                      )}
                    </div>

                    {profile.pricing.kind === "rollout" &&
                      profile.pricing.sides && (
                        <fieldset className={styles.sideSelector}>
                          <legend>Доступ к кассетам</legend>
                          <div>
                            {profile.pricing.sides.map((side) => (
                              <button
                                aria-pressed={input.rolloutSide === side.value}
                                className={
                                  input.rolloutSide === side.value
                                    ? `${styles.sideButton} ${styles.isActive}`
                                    : styles.sideButton
                                }
                                key={side.value}
                                type="button"
                                onClick={() => setRolloutSide(side.value)}
                              >
                                {side.value === "two"
                                  ? "С двух сторон"
                                  : "С одной стороны"}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                      )}
                  </section>
                </div>

                <section className={styles.optionsSection}>
                  <div className={styles.sectionHeading}>
                    <span>03</span>
                    <div>
                      <h4>Дополнительные опции</h4>
                      <p>Отключите ненужное или добавьте оснащение.</p>
                    </div>
                  </div>
                  <div className={styles.optionGrid}>
                    {profile.options.map((option) => {
                      const active = input.optionIds.includes(option.id);
                      return (
                        <button
                          aria-pressed={active}
                          className={
                            active
                              ? `${styles.optionButton} ${styles.isActive}`
                              : styles.optionButton
                          }
                          key={option.id}
                          type="button"
                          onClick={() => toggleOption(option.id)}
                        >
                          <span className={styles.optionCheck}>
                            <Check aria-hidden="true" size={15} />
                          </span>
                          <span>
                            <strong>
                              {optionCopy[option.id] ?? option.title}
                            </strong>
                            <small>+ {formatRub(option.price)}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className={styles.conditionsSection}>
                  <div className={styles.conditionsHeader}>
                    <span>
                      <strong>Условия объекта</strong>
                      <small>
                        {selectedConditions.length || customCondition
                          ? `Инженер учтёт ${selectedConditions.length + (customCondition ? 1 : 0)} пункт.`
                          : "Если ограничений нет — ничего отмечать не нужно."}
                      </small>
                    </span>
                    <span className={styles.summaryAction}>Необязательно</span>
                  </div>
                  <p>
                    Нажмите на проблему, если она есть на объекте. Это поможет
                    инженеру не ошибиться с проходами, загрузкой и монтажом.
                  </p>
                  <div className={styles.conditionGrid}>
                    {siteConditions.map((condition) => {
                      const active = selectedConditions.includes(condition.id);
                      const ConditionIcon = condition.icon;
                      return (
                        <button
                          aria-pressed={active}
                          className={
                            active
                              ? `${styles.conditionButton} ${styles.isActive}`
                              : styles.conditionButton
                          }
                          key={condition.id}
                          type="button"
                          onClick={() => toggleCondition(condition.id)}
                        >
                          <ConditionIcon aria-hidden="true" size={17} />
                          <span>
                            <strong>{condition.title}</strong>
                            <small>{condition.text}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <label className={styles.customCondition}>
                    <span>Свой вариант</span>
                    <input
                      maxLength={220}
                      value={customCondition}
                      onChange={(event) =>
                        setCustomCondition(event.target.value)
                      }
                      placeholder="Например: неровный пол, мало места под монтаж, нужна ночная отгрузка"
                    />
                  </label>
                  <div className={styles.conditionsNote}>
                    <ShieldCheck size={17} />
                    <span>
                      {selectedConditions.length || customCondition
                        ? "Эти условия уйдут вместе с заявкой и будут видны инженеру."
                        : "Если ограничений нет, можно сразу перейти к расчёту."}
                    </span>
                  </div>
                </section>
              </article>
            )}

            {step === 2 && (
              <article className={`${styles.panel} ${styles.resultPanel}`}>
                <div className={styles.resultHero}>
                  <div>
                    <span className={styles.eyebrow}>Ваше решение</span>
                    <h3>{display.title}</h3>
                    <p>{display.description}</p>
                  </div>
                  <div className={styles.resultPrice}>
                    <span>Предварительная стоимость</span>
                    <strong className={styles.priceLine}>
                      {priceLabel}
                    </strong>
                    <p>Точную комплектацию и монтаж проверит инженер</p>
                  </div>
                </div>

                <div className={styles.factGrid}>
                  {resultFacts.map((fact) => (
                    <div key={fact.label}>
                      <span>{fact.label}</span>
                      <strong>{fact.value}</strong>
                    </div>
                  ))}
                </div>

                <div className={styles.engineerCheck}>
                  <ClipboardCheck size={22} />
                  <div>
                    <strong>Что проверит инженер</strong>
                    <p>
                      Нагрузку {storedWeightLabel} кг, ориентир на опору{" "}
                      {supportLoadLabel} кг, основание, способ загрузки,
                      безопасность монтажа и доставку.
                    </p>
                  </div>
                </div>

                <form
                  className={styles.leadForm}
                  onSubmit={handleLeadSubmit}
                  ref={leadFormRef}
                >
                  <div className={styles.formHeading}>
                    <span>Финальный шаг</span>
                    <h4>Передать конфигурацию инженеру</h4>
                    <p>
                      Телефон нужен для уточнения объекта. Остальные поля можно
                      заполнить по желанию.
                    </p>
                  </div>

                  <div className={styles.contactGrid}>
                    <label className={styles.formField}>
                      <span>Ваше имя</span>
                      <input
                        autoComplete="name"
                        data-testid="calculator-name"
                        maxLength={120}
                        name="name"
                        value={contact.name}
                        onChange={(event) =>
                          setContact((current) => ({
                            ...current,
                            name: event.target.value
                          }))
                        }
                        placeholder="Иван Смирнов"
                      />
                    </label>
                    <label className={styles.formField}>
                      <span>Телефон *</span>
                      <input
                        autoComplete="tel"
                        data-testid="calculator-phone"
                        inputMode="tel"
                        maxLength={30}
                        name="phone"
                        ref={phoneInputRef}
                        required
                        value={contact.phone}
                        onChange={(event) =>
                          setContact((current) => ({
                            ...current,
                            phone: event.target.value
                          }))
                        }
                        placeholder="+7 (999) 999-99-99"
                      />
                    </label>
                    <label className={styles.formField}>
                      <span>Почта</span>
                      <input
                        autoComplete="email"
                        maxLength={254}
                        name="email"
                        type="email"
                        value={contact.email}
                        onChange={(event) =>
                          setContact((current) => ({
                            ...current,
                            email: event.target.value
                          }))
                        }
                        placeholder="name@company.ru"
                      />
                    </label>
                    <label className={styles.formField}>
                      <span>
                        <MapPin size={15} /> Город или регион
                      </span>
                      <input
                        autoComplete="address-level2"
                        list="calculator-city-suggestions"
                        maxLength={120}
                        name="city"
                        value={input.city}
                        onChange={(event) =>
                          setInput((current) => ({
                            ...current,
                            city: event.target.value
                          }))
                        }
                        placeholder="Начните вводить город"
                      />
                      <datalist id="calculator-city-suggestions">
                        {citySuggestions.map((city) => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                    </label>
                    <label className={styles.formField}>
                      <span>Адрес объекта</span>
                      <input
                        autoComplete="street-address"
                        maxLength={240}
                        name="address"
                        value={contact.address}
                        onChange={(event) =>
                          setContact((current) => ({
                            ...current,
                            address: event.target.value
                          }))
                        }
                        placeholder="Адрес или ориентир"
                      />
                    </label>
                    <label
                      className={`${styles.formField} ${styles.commentField}`}
                    >
                      <span>
                        <MessageSquareText size={15} /> Комментарий
                      </span>
                      <textarea
                        maxLength={1000}
                        name="comment"
                        value={input.comment ?? ""}
                        onChange={(event) =>
                          setInput((current) => ({
                            ...current,
                            comment: event.target.value
                          }))
                        }
                        placeholder="Особенности загрузки, монтажа или сроков"
                      />
                    </label>
                  </div>

                  <div
                    aria-hidden="true"
                    className={styles.honeypot}
                  >
                    <label>
                      Не заполняйте это поле
                      <input
                        name="hp_url"
                        value={hpUrl}
                        onChange={(event) => setHpUrl(event.target.value)}
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </label>
                  </div>

                  <label className={styles.consent}>
                    <input
                      checked={consentAccepted}
                      data-testid="calculator-consent"
                      name="consent"
                      onChange={(event) =>
                        setConsentAccepted(event.target.checked)
                      }
                      required
                      type="checkbox"
                    />
                    <span>
                      Согласен на обработку персональных данных и ознакомлен с{" "}
                      <a
                        href="/privacy-policy"
                        target="_blank"
                        rel="noreferrer"
                      >
                        политикой конфиденциальности
                      </a>
                      .
                    </span>
                  </label>

                  <div className={styles.formActions}>
                    <button
                      className={styles.submitButton}
                      data-testid="calculator-submit"
                      type="submit"
                      disabled={submittingLead}
                    >
                      <Send size={18} />
                      {submittingLead
                        ? "Отправляем конфигурацию..."
                        : "Получить инженерный расчёт"}
                    </button>
                    <button
                      className={styles.discountButton}
                      type="button"
                      onClick={requestDiscount}
                    >
                      <BadgePercent size={18} />
                      Хочу скидку
                    </button>
                  </div>
                  {leadStatus && (
                    <p
                      aria-live="polite"
                      className={styles.leadStatus}
                      data-testid="calculator-status"
                      role="status"
                    >
                      {leadStatus}
                    </p>
                  )}
                </form>
              </article>
            )}

            <div className={styles.controls}>
              <button
                className={styles.backButton}
                type="button"
                disabled={step === 0}
                onClick={() => goToStep(step - 1, "back_button")}
              >
                <ArrowLeft size={18} />
                Назад
              </button>
              {step < steps.length - 1 && (
                <button
                  className={styles.nextButton}
                  type="button"
                  onClick={() => goToStep(step + 1, "next_button")}
                >
                  {step === 1 ? "Показать расчёт" : "Перейти к параметрам"}
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </section>

          <aside className={styles.desktopSummary}>
            <span className={styles.eyebrow}>Текущая конфигурация</span>
            <h3>{display.shortTitle}</h3>
            <div className={styles.summaryImageFrame}>
              <img
                src={displayImage.src}
                srcSet={displayImage.srcSet}
                sizes="420px"
                alt={display.imageAlt}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                width={1536}
                height={1024}
              />
            </div>
            <div className={styles.summaryPrice}>
              <span>{priceLabel}</span>
              <small>ориентир до инженерной проверки</small>
            </div>
            <div className={styles.summaryFacts}>
              {summaryFacts.map((fact) => (
                <span key={fact}>
                  <Check size={15} />
                  {fact}
                </span>
              ))}
            </div>
            <div className={styles.summaryVerification}>
              <ShieldCheck size={17} />
              <span>Цена предварительная — проект проверит инженер.</span>
            </div>
            <button
              className={styles.summaryButton}
              type="button"
              onClick={() =>
                step === steps.length - 1
                  ? goToStep(1, "summary_edit")
                  : goToStep(2, "summary_cta")
              }
            >
              {step === steps.length - 1
                ? "Изменить параметры"
                : "Показать расчёт"}
              <ArrowRight size={17} />
            </button>
          </aside>
        </div>
      </div>

      <div className={styles.mobileBar} aria-label="Краткий итог расчёта">
        <button
          className={styles.mobilePrice}
          ref={mobileSummaryTriggerRef}
          type="button"
          onClick={() => setMobileSummaryOpen(true)}
        >
          <strong>{priceLabel}</strong>
          <small>{display.shortTitle}</small>
        </button>
        <button
          className={styles.mobileAction}
          type="button"
          onClick={() =>
            step < steps.length - 1
              ? goToStep(step + 1, "mobile_next")
              : focusLeadForm()
          }
        >
          {step < steps.length - 1 ? "Далее" : "К заявке"}
          <ArrowRight size={16} />
        </button>
      </div>

      {mobileSummaryOpen && (
        <div
          className={styles.mobileModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="calculator-mobile-summary-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setMobileSummaryOpen(false);
              mobileSummaryTriggerRef.current?.focus();
            }
          }}
        >
          <div
            className={styles.mobilePanel}
            ref={mobileSummaryPanelRef}
          >
            <button
              className={styles.mobileClose}
              ref={mobileSummaryCloseRef}
              type="button"
              onClick={() => {
                setMobileSummaryOpen(false);
                mobileSummaryTriggerRef.current?.focus();
              }}
              aria-label="Закрыть итог"
            >
              <X size={20} />
            </button>
            <span className={styles.eyebrow}>Итог конфигурации</span>
            <h3 id="calculator-mobile-summary-title">
              {display.shortTitle}
            </h3>
            <div className={styles.modalPrice}>{priceLabel}</div>
            <div className={styles.modalFacts}>
              {summaryFacts.map((fact) => (
                <span key={fact}>
                  <Check size={15} />
                  {fact}
                </span>
              ))}
              <span>
                <Check size={15} />
                Опции: {selectedOptions.length || "не выбраны"}
              </span>
            </div>
            <button
              className={styles.submitButton}
              type="button"
              onClick={() => {
                goToStep(2, "mobile_summary_cta");
                window.setTimeout(focusLeadForm, 0);
              }}
            >
              <Send size={18} />
              Оставить заявку
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      return;
    }

    const fromValue = displayValue;
    const toValue = value;
    const start = performance.now();
    const duration = 280;
    let frame = 0;

    function tick(now: number) {
      const ratio = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setDisplayValue(Math.round(fromValue + (toValue - fromValue) * eased));
      if (ratio < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{displayValue.toLocaleString("ru-RU")}</>;
}
