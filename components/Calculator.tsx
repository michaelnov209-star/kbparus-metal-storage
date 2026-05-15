"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Gauge,
  Info,
  Layers3,
  MapPin,
  MessageSquareText,
  PackageSearch,
  Ruler,
  Send,
  ShieldCheck,
  Warehouse,
  X
} from "lucide-react";
import { calculatorProfiles, getCalculatorProfile } from "@/data/storageSystems/excelCalculator";
import type { CalculatorProfileId } from "@/data/storageSystems/excelCalculator";
import { calculateStorageSystem, formatRoundedRub, formatRub, normalizeCalculatorInput } from "@/lib/calculator";
import type { CalculatorInput } from "@/lib/calculator";

const steps = ["Материал", "Габариты", "Доступ", "Решение"];

const profileCopy: Record<CalculatorProfileId, { title: string; shortTitle: string; description: string; image: string }> = {
  "auto-sheet-metal": {
    title: "Автоматический стеллаж листового металла",
    shortTitle: "Автоматический стеллаж листового металла",
    description: "Для листового металла с подъемным модулем, выдачей паллет и опциями безопасности.",
    image: "/assets/images/catalog/01-auto-sheet-metal.jpg"
  },
  "auto-sort-metal": {
    title: "Автоматический стеллаж сортового и трубного металлопроката",
    shortTitle: "Автоматический стеллаж сортового и трубного металлопроката",
    description: "Для труб, профиля, балок и сортового проката с механизированной выдачей.",
    image: "/assets/images/catalog/03-sort-and-pipe-storage.jpg"
  },
  "rollout-cassette-rack": {
    title: "Система хранения с выкатными полками",
    shortTitle: "Система с выкатными полками",
    description: "Для листа и пачек, когда нужен прямой доступ к каждой кассете.",
    image: "/assets/images/catalog/02-manual-sheet-metal.png"
  },
  "forklift-cassette-rack": {
    title: "Кассетная система хранения листового металла",
    shortTitle: "Кассетная система хранения листового металла",
    description: "Для плотного хранения листа с доступом погрузчиком или складской техникой.",
    image: "/assets/images/products/manual-sheet-metal/2.1.png"
  },
  "two-side-rollout-rack": {
    title: "Двухсторонняя система хранения с выкатными полками",
    shortTitle: "Двухсторонняя выкатная система",
    description: "Для складов, где нужен доступ к кассетам с одной или двух сторон.",
    image: "/assets/images/calculator-configurator.svg"
  },
  "hybrid-rollout-rack": {
    title: "Комбинированная система хранения с выкатными полками",
    shortTitle: "Гибридная система",
    description: "Комбинация полок под погрузчик и выкатных кассет в одной системе.",
    image: "/assets/images/calculator-configurator.svg"
  }
};

const optionCopy: Record<string, string> = {
  scale: "Весы на распалетчик",
  "infrared-safety": "Инфракрасные ограждения безопасности",
  "vacuum-grip": "Вакуумный захват",
  "swing-crane": "Консольно-поворотный кран",
  "warehouse-accounting": "Передача данных в складской учет"
};

const dimensionHints = {
  heightMm: "Высота ячейки или полезного пространства под материал. Выберите ближайший ходовой вариант.",
  widthMm: "Ширина рабочей зоны под лист, кассету или пачку материала.",
  lengthMm: "Длина рабочей зоны. Для труб, профиля и балок выбирайте вариант с запасом по максимальной длине.",
  loadKg: "Расчетная нагрузка на одну полку или кассету. Финальный запас проверяет инженер.",
  shelfCount: "Количество уровней хранения в одной башне или секции.",
  rolloutShelfCount: "Сколько выкатных кассет нужно для прямого доступа к материалу.",
  towerCount: "Количество башен или секций системы. Чем больше башен, тем выше вместимость."
};

const guidedChoices: Array<{
  title: string;
  text: string;
  profileId: CalculatorProfileId;
  comment: string;
}> = [
  {
    title: "Храним листовой металл",
    text: "Листы, пачки листа, форматные заготовки.",
    profileId: "auto-sheet-metal",
    comment: "Клиент выбрал быстрый подбор: хранение листового металла."
  },
  {
    title: "Храним трубы и профиль",
    text: "Трубы, профиль, балки, швеллер, сортовой прокат.",
    profileId: "auto-sort-metal",
    comment: "Клиент выбрал быстрый подбор: хранение труб, профиля и сортового проката."
  },
  {
    title: "Нужен прямой доступ к кассетам",
    text: "Важно выдвигать нужный уровень без разбора соседних.",
    profileId: "rollout-cassette-rack",
    comment: "Клиент выбрал быстрый подбор: нужен прямой доступ к выкатным кассетам."
  }
];

const siteConditions = [
  "Узкий проезд",
  "Кран-балка",
  "Ограничение высоты",
  "Погрузчик",
  "Нагрузка пола",
  "Улица"
];

function buildInputForProfile(profileId: CalculatorProfileId): CalculatorInput {
  const profile = getCalculatorProfile(profileId);
  const defaults = profile.defaultValues;

  return normalizeCalculatorInput({
    systemId: profile.id,
    heightMm: defaults.heightMm,
    widthMm: defaults.widthMm,
    lengthMm: defaults.lengthMm,
    materialLengthMm: defaults.lengthMm,
    sheetWidthMm: defaults.widthMm,
    loadKg: defaults.loadKg,
    totalStorageWeightKg: defaults.loadKg * defaults.shelfCount * defaults.towerCount,
    desiredCapacity: defaults.shelfCount,
    shelfCount: defaults.shelfCount,
    rolloutShelfCount: defaults.rolloutShelfCount ?? defaults.shelfCount,
    cassetteCount: defaults.rolloutShelfCount ?? defaults.shelfCount,
    towerCount: defaults.towerCount,
    rolloutSide: defaults.rolloutSide ?? "one",
    optionIds: [],
    execution: profile.productType === "automated" ? "automatic" : "manual",
    needsRolloutCassettes: profile.productType === "rollout" || profile.productType === "hybrid",
    city: "Москва"
  });
}

export function Calculator() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<CalculatorInput>(() => buildInputForProfile("auto-sheet-metal"));
  const [contact, setContact] = useState({ name: "", phone: "", email: "", address: "" });
  const [leadStatus, setLeadStatus] = useState("");
  const [hpUrl, setHpUrl] = useState("");
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const formStartedAt = useRef<number>(Date.now());
  const profile = useMemo(() => getCalculatorProfile(input.systemId), [input.systemId]);
  const result = useMemo(() => calculateStorageSystem(input), [input]);
  const [animatedPrice, setAnimatedPrice] = useState(result.fromPrice);
  const progress = ((step + 1) / steps.length) * 100;
  const display = profileCopy[profile.id];
  const selectedOptions = profile.options.filter((option) => input.optionIds.includes(option.id));
  const systemCharacter = profile.productType === "automated" ? "tech" : profile.productType === "hybrid" ? "hybrid" : "manual";
  const scaleScore =
    input.loadKg / 1000 +
    input.shelfCount * 0.75 +
    input.towerCount * 1.35 +
    selectedOptions.length * 0.7 +
    (profile.productType === "automated" ? 2.1 : 0) +
    (profile.productType === "hybrid" ? 1.3 : 0);
  const projectScale =
    scaleScore >= 15
      ? { id: "complex", label: "Тяжелый промышленный комплекс", text: "Серьезная промышленная конфигурация", progress: 100 }
      : scaleScore >= 10
        ? { id: "industrial", label: "Промышленная система", text: "Индустриальная складская система", progress: 78 }
        : scaleScore >= 6
          ? { id: "module", label: "Складской модуль", text: "Складской модуль под регулярную работу", progress: 54 }
          : { id: "compact", label: "Компактное решение", text: "Компактное решение для участка", progress: 32 };
  const conditionsComment = selectedConditions.length ? `Условия объекта: ${selectedConditions.join(", ")}` : "";
  const dimensionLabel = `${input.lengthMm.toLocaleString("ru-RU")}×${input.widthMm.toLocaleString("ru-RU")}×${input.heightMm.toLocaleString("ru-RU")} мм`;
  const roundedPrice = formatRoundedRub(animatedPrice);
  const priceNumber = roundedPrice.replace(/\s?₽/u, "");
  const storedWeightLabel = result.engineeringSummary.totalStoredWeightKg.toLocaleString("ru-RU");
  const supportLoadLabel = result.engineeringSummary.supportLoadKg.toLocaleString("ru-RU");
  const conditionResponses: Record<string, string> = {
    "Узкий проезд": "Потребуется проверить зону обслуживания и траекторию подачи материала.",
    "Кран-балка": "Можно учесть верхнюю подачу и безопасные зоны работы крана.",
    "Ограничение высоты": "Высоту системы нужно сверить с полезным просветом помещения.",
    "Погрузчик": "Конфигурация должна учитывать радиус маневра и фронт загрузки.",
    "Нагрузка пола": "Инженер проверит нагрузку на основание и распределение опор.",
    "Улица": "Понадобится проверить исполнение, защиту и условия эксплуатации."
  };
  const selectedConditionCards = selectedConditions.map((condition) => ({
    title: condition,
    text: conditionResponses[condition]
  }));
  const engineeringSignals = [
    input.loadKg >= 3000 ? "Высокая нагрузка учтена в предварительном подборе" : "Нагрузка находится в рабочем диапазоне системы",
    profile.productType === "automated" ? "Конфигурация подходит для интенсивной выдачи материала" : "Схема сохраняет понятный доступ к каждому уровню",
    selectedConditions.includes("Погрузчик") ? "Доступ погрузчиком отмечен для инженерной проверки" : "Инженер проверит запас, монтаж и безопасность объекта"
  ];
  const summaryFacts = [
    `${input.shelfCount.toLocaleString("ru-RU")} полок хранения в системе`,
    `Нагрузка до ${input.loadKg.toLocaleString("ru-RU")} кг на уровень хранения`,
    `${input.towerCount.toLocaleString("ru-RU")} секций, зона ${input.lengthMm.toLocaleString("ru-RU")}×${input.widthMm.toLocaleString("ru-RU")} мм`
  ];
  const resultFacts = [
    { label: "Формат", value: `${input.shelfCount.toLocaleString("ru-RU")} полок / ${input.towerCount.toLocaleString("ru-RU")} секций` },
    { label: "Нагрузка", value: `${input.loadKg.toLocaleString("ru-RU")} кг на уровень` },
    { label: "Рабочая зона", value: dimensionLabel }
  ];

  useEffect(() => {
    const fromValue = animatedPrice;
    const toValue = result.fromPrice;
    const start = performance.now();
    const duration = 420;
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

  function selectProfile(profileId: CalculatorProfileId) {
    setInput(buildInputForProfile(profileId));
    setLeadStatus("");
  }

  function selectGuidedChoice(profileId: CalculatorProfileId, comment: string) {
    setInput({
      ...buildInputForProfile(profileId),
      comment
    });
    setLeadStatus("");
  }

  function setNumberField(field: keyof CalculatorInput, value: number) {
    setInput((current) => ({
      ...current,
      [field]: value,
      ...(field === "lengthMm" ? { materialLengthMm: value } : {}),
      ...(field === "widthMm" ? { sheetWidthMm: value } : {}),
      ...(field === "loadKg" ? { totalStorageWeightKg: value * current.shelfCount * current.towerCount } : {}),
      ...(field === "shelfCount" ? { desiredCapacity: value, cassetteCount: value } : {}),
      ...(field === "rolloutShelfCount" ? { cassetteCount: value } : {})
    }));
  }

  function toggleOption(id: string) {
    setInput((current) => ({
      ...current,
      optionIds: current.optionIds.includes(id)
        ? current.optionIds.filter((optionId) => optionId !== id)
        : [...current.optionIds, id]
    }));
  }

  function toggleCondition(condition: string) {
    setSelectedConditions((current) =>
      current.includes(condition)
        ? current.filter((item) => item !== condition)
        : [...current, condition]
    );
  }

  async function submitLead() {
    setLeadStatus("Готовим заявку для инженера...");
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
          comment: [contact.address && `Адрес/объект: ${contact.address}`, conditionsComment, input.comment].filter(Boolean).join("\n"),
          calculatorInput: input,
          recommendedConfig: {
            title: display.title,
            dimensions: dimensionLabel,
            loadKg: input.loadKg,
            shelfCount: input.shelfCount,
            towerCount: input.towerCount,
            options: selectedOptions.map((option) => optionCopy[option.id] ?? option.title)
          },
          preliminaryPriceFrom: result.fromPrice,
          source: `Калькулятор на главной — ${display.title}`,
          sourceTitle: display.title,
          sourceUrl: typeof window !== "undefined" ? `${window.location.origin}/#calculator` : undefined,
          sourceImage: display.image,
          hp_url: hpUrl,
          formStartedAt: formStartedAt.current,
          utm: {}
        })
      });

      const data = await response.json().catch(() => ({}));
      setLeadStatus(
        response.ok
          ? "Заявка сформирована. Инженер увидит выбранные параметры и свяжется с вами."
          : (data?.error ?? "Не удалось сформировать заявку. Попробуйте еще раз или позвоните нам.")
      );
    } catch {
      setLeadStatus("Сеть недоступна. Попробуйте через минуту или позвоните нам.");
    }
  }

  return (
    <section className={`calculator-shell reveal character-${systemCharacter} scale-${projectScale.id}`} id="calculator">
      <div className="calculator-heading">
        <span className="line-kicker">Конфигуратор системы хранения</span>
        <h2>Соберите решение для склада за четыре спокойных шага</h2>
        <p>
          Минимум полей, только важные решения: материал, габариты, доступ к хранению и финальная инженерная рекомендация.
        </p>
      </div>

      <div className="calculator-product">
        <div className="calc-progress" aria-label="Прогресс конфигуратора">
          <div className="calc-steps">
            {steps.map((item, index) => (
              <button className={index === step ? "is-active" : ""} key={item} type="button" onClick={() => setStep(index)}>
                <span>{index + 1}</span>
                {item}
              </button>
            ))}
          </div>
          <div className="calc-progress-line"><span style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="calc-workspace">
          {step === 0 && (
            <div className="calc-panel calc-panel-intro">
              <div className="calc-panel-title">
                <PackageSearch size={24} />
                <div>
                  <h3>Выберите систему хранения</h3>
                  <p>Сначала выберите реальное направление оборудования. Если сомневаетесь, ниже есть быстрый помощник.</p>
                </div>
              </div>

              <div className="system-showcase" aria-label="Системы хранения">
                {calculatorProfiles.map((item, index) => {
                  const card = profileCopy[item.id];
                  const isActive = item.id === input.systemId;
                  const isRecommended = index < 2;
                  const typeLabel = item.productType === "automated"
                    ? "Автоматизированная"
                    : item.productType === "rollout"
                      ? "Выкатная"
                      : item.productType === "hybrid"
                        ? "Комбинированная"
                        : "Ручная";
                  return (
                    <button
                      className={isActive ? "system-card is-active" : "system-card"}
                      key={item.id}
                      type="button"
                      onClick={() => selectProfile(item.id)}
                    >
                      <div className="system-card-tags">
                        <span>{typeLabel}</span>
                        {isRecommended && <em>Рекомендуем</em>}
                        {isActive && <b>Выбрано</b>}
                      </div>
                      <img src={card.image} alt={card.title} />
                      <strong>{card.shortTitle}</strong>
                      <small>{card.description}</small>
                    </button>
                  );
                })}
              </div>

              <div className="guided-assist">
                <div>
                  <span className="guided-kicker">Помочь с подбором</span>
                  <strong>Если не уверены, выберите сценарий хранения</strong>
                  <small>Сценарий только подставит подходящее направление. Переход дальше остается под вашим контролем.</small>
                </div>
                <div className="guided-actions">
                  {guidedChoices.map((choice) => (
                    <button
                      className={choice.profileId === input.systemId ? "guided-choice is-active" : "guided-choice"}
                      key={choice.title}
                      type="button"
                      onClick={() => selectGuidedChoice(choice.profileId, choice.comment)}
                    >
                      <span>{choice.title}</span>
                      <small>{choice.text}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="calc-panel calc-panel-focus">
              <div className="calc-panel-title">
                <Ruler size={24} />
                <div>
                  <h3>Габариты и нагрузка</h3>
                  <p>Выберите ближайшие рабочие значения. Точный запас прочности проверит инженер.</p>
                </div>
              </div>

              <div className="parameter-hero">
                <article>
                  <small>Рабочая зона</small>
                  <strong className="parameter-live-value">
                    <AnimatedNumber value={input.lengthMm} />×<AnimatedNumber value={input.widthMm} />×<AnimatedNumber value={input.heightMm} /> мм
                  </strong>
                </article>
                <article>
                  <small>Нагрузка</small>
                  <strong className="parameter-live-value"><AnimatedNumber value={input.loadKg} /> кг</strong>
                </article>
              </div>

              <div className="parameter-flow">
                <OptionGroup
                  title="Длина материала"
                  hint={dimensionHints.lengthMm}
                  unit="мм"
                  values={profile.lengthOptions.map((option) => option.value)}
                  active={input.lengthMm}
                  onSelect={(value) => setNumberField("lengthMm", value)}
                />
                <OptionGroup
                  title="Ширина материала"
                  hint={dimensionHints.widthMm}
                  unit="мм"
                  values={profile.widthOptions.map((option) => option.value)}
                  active={input.widthMm}
                  onSelect={(value) => setNumberField("widthMm", value)}
                />
                <OptionGroup
                  title="Полезная высота"
                  hint={dimensionHints.heightMm}
                  unit="мм"
                  values={profile.heightOptions.map((option) => option.value)}
                  active={input.heightMm}
                  onSelect={(value) => setNumberField("heightMm", value)}
                />
                <OptionGroup
                  title="Вес на уровень"
                  hint={dimensionHints.loadKg}
                  unit="кг"
                  values={profile.loadOptions.map((option) => option.value)}
                  active={input.loadKg}
                  onSelect={(value) => setNumberField("loadKg", value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="calc-panel calc-panel-focus">
              <div className="calc-panel-title">
                <Warehouse size={24} />
                <div>
                  <h3>Формат хранения и доступ</h3>
                  <p>Настройте вместимость, секции и опции без лишних инженерных деталей.</p>
                </div>
              </div>

              <div className="access-layout">
                <div className="access-column access-column-primary">
                  <div className="access-section-heading">
                    <span>01</span>
                    <strong>Вместимость системы</strong>
                  </div>
                  <div className="parameter-flow">
                    <OptionGroup
                      title={profile.pricing.kind === "hybrid" ? "Полки под погрузчик" : "Количество полок"}
                      hint={dimensionHints.shelfCount}
                      unit="шт."
                      values={profile.shelfCountOptions}
                      active={input.shelfCount}
                      onSelect={(value) => setNumberField("shelfCount", value)}
                    />
                    <OptionGroup
                      title="Секции системы"
                      hint={dimensionHints.towerCount}
                      unit="шт."
                      values={profile.towerCountOptions}
                      active={input.towerCount}
                      onSelect={(value) => setNumberField("towerCount", value)}
                    />
                    {profile.rolloutShelfCountOptions && (
                      <OptionGroup
                        title="Выкатные кассеты"
                        hint={dimensionHints.rolloutShelfCount}
                        unit="шт."
                        values={profile.rolloutShelfCountOptions}
                        active={input.rolloutShelfCount}
                        onSelect={(value) => setNumberField("rolloutShelfCount", value)}
                      />
                    )}
                  </div>

                  {profile.pricing.kind === "rollout" && profile.pricing.sides && (
                    <div className="access-selector">
                      <div>
                        <strong>Доступ к кассетам</strong>
                        <span>Как оператор подходит к системе</span>
                      </div>
                      <div className="calc-chip-row">
                        {profile.pricing.sides.map((side) => (
                          <button
                            className={input.rolloutSide === side.value ? "calc-chip is-active" : "calc-chip"}
                            key={side.value}
                            type="button"
                            onClick={() => setInput((current) => ({ ...current, rolloutSide: side.value }))}
                          >
                            {side.value === "two" ? "Две стороны" : "Одна сторона"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <details className="option-details" open>
                    <summary>
                      <span>02</span>
                      <strong>Дополнительные опции</strong>
                      <small>Выберите при необходимости: весы, безопасность, кран или складской учет.</small>
                    </summary>
                    <div className="option-list">
                      {profile.options.map((option) => (
                        <button
                          className={input.optionIds.includes(option.id) ? "option-card is-active" : "option-card"}
                          key={option.id}
                          type="button"
                          onClick={() => toggleOption(option.id)}
                        >
                          <Check size={18} />
                          <span>{optionCopy[option.id] ?? option.title}</span>
                          <strong>+ {formatRub(option.price)}</strong>
                        </button>
                      ))}
                    </div>
                  </details>
                </div>

                <div className="access-column access-column-conditions">
                  <div className="site-condition-panel">
                    <div className="site-condition-copy">
                      <strong>Условия объекта</strong>
                      <span>Отметьте факторы, которые инженер должен учесть при проверке решения.</span>
                    </div>
                    <div className="site-condition-grid">
                      {siteConditions.map((condition) => (
                        <button
                          className={selectedConditions.includes(condition) ? "condition-chip is-active" : "condition-chip"}
                          key={condition}
                          type="button"
                          onClick={() => toggleCondition(condition)}
                        >
                          <Check size={16} />
                          {condition}
                        </button>
                      ))}
                    </div>
                    <div className="condition-response-grid">
                      {selectedConditionCards.length > 0 ? (
                        selectedConditionCards.map((condition) => (
                          <div className="condition-response" key={condition.title}>
                            <strong>{condition.title}</strong>
                            <span>{condition.text}</span>
                          </div>
                        ))
                      ) : (
                        <div className="condition-response is-muted">
                          <strong>Без специальных ограничений</strong>
                          <span>Можно перейти к финальному расчету. Дополнительные ограничения можно добавить позже в комментарии.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="calc-client-block">
                    <label className="text-field">
                      <span><MapPin size={16} />Город или регион</span>
                      <input
                        value={input.city}
                        onChange={(event) => setInput((current) => ({ ...current, city: event.target.value }))}
                        placeholder="Москва, Казань, Минск"
                      />
                    </label>
                    <label className="text-field">
                      <span><MessageSquareText size={16} />Комментарий для инженера</span>
                      <textarea
                        value={input.comment ?? ""}
                        onChange={(event) => setInput((current) => ({ ...current, comment: event.target.value }))}
                        placeholder="Дополнительные детали: режим загрузки, требования к монтажу, сроки"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="calc-panel final-panel">
              <div className="recommendation-screen">
                <div className="result-card solution-hero">
                  <div className="solution-copy">
                    <span>Готовое промышленное решение</span>
                    <h3>{display.title}</h3>
                    <p>{display.description}</p>
                  </div>
                  <div className="result-price-box price-live">
                    <small>Предварительно</small>
                    <strong className="price-line"><span>от</span><b>{priceNumber}</b><em>₽</em></strong>
                  </div>
                </div>

                <div className="solution-evidence">
                  <div className="project-scale-card">
                    <div>
                      <span>Масштаб проекта</span>
                      <strong>{projectScale.label}</strong>
                      <small>{projectScale.text}</small>
                    </div>
                    <i><b style={{ width: `${projectScale.progress}%` }} /></i>
                  </div>

                  <div className="result-facts">
                    {resultFacts.map((fact) => (
                      <article key={fact.label}>
                        <small>{fact.label}</small>
                        <strong>{fact.value}</strong>
                      </article>
                    ))}
                  </div>

                  <div className="engineering-signal-grid">
                    {engineeringSignals.map((signal) => (
                      <span key={signal}><Gauge size={16} />{signal}</span>
                    ))}
                  </div>
                </div>

                <div className="confidence-card">
                  <ShieldCheck size={22} />
                  <div>
                    <strong>Инженерная проверка после заявки</strong>
                    <span>Проверим нагрузку {storedWeightLabel} кг, ориентир на опору {supportLoadLabel} кг, способ загрузки и безопасность монтажа.</span>
                  </div>
                </div>

                <div className="result-request-panel">
                  <div>
                    <span>Следующий шаг</span>
                    <strong>Передать конфигурацию инженеру</strong>
                    <small>Контакты нужны только для уточнения объекта и финального расчета.</small>
                  </div>
                  <div className="calc-contact-grid">
                    <label className="text-field">
                      Ваше имя
                      <input value={contact.name} onChange={(event) => setContact((current) => ({ ...current, name: event.target.value }))} placeholder="Иван Смирнов" />
                    </label>
                    <label className="text-field">
                      Телефон
                      <input value={contact.phone} onChange={(event) => setContact((current) => ({ ...current, phone: event.target.value }))} placeholder="+7 (999) 999-99-99" />
                    </label>
                    <label className="text-field">
                      Почта
                      <input value={contact.email} onChange={(event) => setContact((current) => ({ ...current, email: event.target.value }))} placeholder="name@company.ru" />
                    </label>
                    <label className="text-field">
                      Адрес объекта
                      <input value={contact.address} onChange={(event) => setContact((current) => ({ ...current, address: event.target.value }))} placeholder="Город, адрес или ориентир" />
                    </label>
                  </div>
                </div>

                {/* Honeypot — невидимое поле для ботов. Не трогать. */}
                <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}>
                  <label>
                    Не заполняйте это поле
                    <input value={hpUrl} onChange={(event) => setHpUrl(event.target.value)} type="text" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                <button className="primary-button result-submit" type="button" onClick={submitLead}>
                  <Send size={18} />
                  Получить инженерный расчет
                </button>
                {leadStatus && <p className="lead-status">{leadStatus}</p>}
              </div>
            </div>
          )}

          <div className="calc-controls">
            <button className="ghost-button" type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(current - 1, 0))}>
              <ArrowLeft size={18} />
              Назад
            </button>
            <button className="secondary-button" type="button" disabled={step === steps.length - 1} onClick={() => setStep((current) => Math.min(current + 1, steps.length - 1))}>
              Далее
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <aside className="calc-summary">
          <span className="line-kicker">Ваше решение</span>
          <h3>{display.shortTitle}</h3>
          <img src={display.image} alt={display.title} />
          <div className="summary-price price-live">
            <span className="price-line"><span>от</span><b>{priceNumber}</b><em>₽</em></span>
            <small>ориентир до инженерной проверки</small>
          </div>
          <div className="summary-scale">
            <span>{projectScale.label}</span>
            <i><b style={{ width: `${projectScale.progress}%` }} /></i>
          </div>
          <div className="summary-spec-grid" aria-label="Ключевые параметры">
            {summaryFacts.map((fact) => (
              <span key={fact}><Check size={16} />{fact}</span>
            ))}
          </div>
          <button className="primary-button summary-cta" type="button" onClick={() => setStep(3)}>
            <Send size={18} />
            Перейти к заявке
          </button>
        </aside>

        <div className="mobile-summary-bar" aria-label="Краткий итог расчета">
          <button className="mobile-summary-main" type="button" onClick={() => setMobileSummaryOpen(true)}>
            <span className="price-line"><span>от</span><b>{priceNumber}</b><em>₽</em></span>
            <small>{display.shortTitle} · {input.loadKg.toLocaleString("ru-RU")} кг</small>
          </button>
          <button
            className="mobile-summary-action"
            type="button"
            onClick={() => (step < steps.length - 1 ? setStep((current) => current + 1) : setMobileSummaryOpen(true))}
          >
            {step < steps.length - 1 ? "Далее" : "Итог"}
            <ArrowRight size={16} />
          </button>
        </div>

        {mobileSummaryOpen && (
          <div className="mobile-summary-modal" role="dialog" aria-modal="true" aria-label="Итог конфигурации">
            <div className="mobile-summary-panel">
              <button className="mobile-summary-close" type="button" onClick={() => setMobileSummaryOpen(false)} aria-label="Закрыть итог">
                <X size={20} />
              </button>
              <span className="line-kicker">Итог конфигурации</span>
              <h3>{display.shortTitle}</h3>
              <div className="summary-price price-live">
                <span className="price-line"><span>от</span><b>{priceNumber}</b><em>₽</em></span>
                <small>предварительная стоимость</small>
              </div>
              <div className="summary-scale">
                <span>{projectScale.label}</span>
                <i><b style={{ width: `${projectScale.progress}%` }} /></i>
              </div>
              <div className="summary-spec-grid">
                {summaryFacts.map((fact) => (
                  <span key={fact}><Check size={16} />{fact}</span>
                ))}
                <span><Check size={16} />Опции: {selectedOptions.length || "не выбраны"}</span>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setStep(3);
                  setMobileSummaryOpen(false);
                }}
              >
                <Send size={18} />
                Оставить заявку
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const fromValue = displayValue;
    const toValue = value;
    const start = performance.now();
    const duration = 420;
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

  return <span className="animated-number">{displayValue.toLocaleString("ru-RU")}</span>;
}

function OptionGroup({
  title,
  hint,
  unit,
  values,
  active,
  onSelect
}: {
  title: string;
  hint: string;
  unit: string;
  values: readonly number[];
  active: number;
  onSelect: (value: number) => void;
}) {
  return (
    <div className="calc-option-group">
      <div>
        <span>{title}</span>
        <small><Info size={14} />{hint}</small>
      </div>
      <div className="calc-chip-row">
        {values.map((value) => (
          <button className={active === value ? "calc-chip is-active" : "calc-chip"} key={value} type="button" onClick={() => onSelect(value)}>
            {value.toLocaleString("ru-RU")} <em>{unit}</em>
          </button>
        ))}
      </div>
    </div>
  );
}
