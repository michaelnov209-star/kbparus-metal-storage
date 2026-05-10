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
  Warehouse
} from "lucide-react";
import { calculatorProfiles, getCalculatorProfile } from "@/data/storageSystems/excelCalculator";
import type { CalculatorProfileId } from "@/data/storageSystems/excelCalculator";
import { calculateStorageSystem, formatRoundedRub, formatRub, normalizeCalculatorInput } from "@/lib/calculator";
import type { CalculatorInput } from "@/lib/calculator";

const steps = ["Выберите оборудование", "Параметры оборудования", "Результат расчета"];

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
    optionIds: profile.options.filter((option) => option.defaultSelected).map((option) => option.id),
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
  const formStartedAt = useRef<number>(Date.now());
  const profile = useMemo(() => getCalculatorProfile(input.systemId), [input.systemId]);
  const result = useMemo(() => calculateStorageSystem(input), [input]);
  const [animatedPrice, setAnimatedPrice] = useState(result.fromPrice);
  const progress = ((step + 1) / steps.length) * 100;
  const display = profileCopy[profile.id];
  const selectedOptions = profile.options.filter((option) => input.optionIds.includes(option.id));
  const dimensionLabel = `${input.lengthMm.toLocaleString("ru-RU")}×${input.widthMm.toLocaleString("ru-RU")}×${input.heightMm.toLocaleString("ru-RU")} мм`;
  const roundedPrice = formatRoundedRub(animatedPrice);
  const storedWeightLabel = result.engineeringSummary.totalStoredWeightKg.toLocaleString("ru-RU");
  const supportLoadLabel = result.engineeringSummary.supportLoadKg.toLocaleString("ru-RU");

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
    setStep(1);
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

  async function submitLead() {
    setLeadStatus("Готовим заявку для инженера...");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: {
            name: contact.name || "Заявка с калькулятора",
            phone: contact.phone,
            email: contact.email
          },
          city: input.city,
          comment: [contact.address && `Адрес/объект: ${contact.address}`, input.comment].filter(Boolean).join("\n"),
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
    <section className="calculator-shell reveal" id="calculator">
      <div className="calculator-heading">
        <span className="line-kicker">Калькулятор стоимости</span>
        <h2>Подберите систему хранения без сложных таблиц и лишних вопросов</h2>
        <p>
          Выберите тип оборудования, размеры, нагрузку и нужные опции. Конфигуратор покажет понятный ориентир
          по стоимости, а инженер проверит запас прочности, помещение и способ загрузки.
        </p>
      </div>
      <div className="calculator-info-strip">
        <article><Ruler size={22} /><strong>Габариты</strong><span>выбор из ходовых размеров</span></article>
        <article><Gauge size={22} /><strong>Нагрузка</strong><span>ориентир по весу на уровень</span></article>
        <article><Info size={22} /><strong>Подсказки</strong><span>каждый параметр объяснен простым языком</span></article>
      </div>

      <div className="calculator-product">
        <div className="calc-workspace">
          <div className="calc-progress" aria-label="Прогресс калькулятора">
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

          {step === 0 && (
            <div className="calc-panel">
              <div className="calc-panel-title">
                <PackageSearch size={24} />
                <div>
                  <h3>Выберите оборудование</h3>
                  <p>Начните с типа системы. На следующем шаге останутся только параметры, которые действительно нужны для расчета.</p>
                </div>
              </div>

              <div className="guided-picker">
                <div>
                  <span className="guided-kicker">Не знаете, что выбрать?</span>
                  <strong>Начните с материала — мы подставим подходящий тип системы</strong>
                </div>
                <div className="guided-actions">
                  {guidedChoices.map((choice) => (
                    <button key={choice.title} type="button" onClick={() => selectGuidedChoice(choice.profileId, choice.comment)}>
                      <span>{choice.title}</span>
                      <small>{choice.text}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="profile-grid">
                {calculatorProfiles.map((item) => {
                  const card = profileCopy[item.id];
                  return (
                    <button
                      className={item.id === input.systemId ? "profile-card is-active" : "profile-card"}
                      key={item.id}
                      type="button"
                      onClick={() => selectProfile(item.id)}
                    >
                      <div className="profile-visual">
                        <img src={card.image} alt={card.title} />
                      </div>
                      <span><Layers3 size={16} /> направление подбора</span>
                      <strong>{card.title}</strong>
                      <small>{card.description}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="calc-panel">
              <div className="calc-panel-title">
                <Ruler size={24} />
                <div>
                  <h3>Параметры оборудования</h3>
                  <p>Выберите готовые варианты размеров и нагрузок. Если точного значения нет, берите ближайший вариант с запасом.</p>
                </div>
              </div>

              <div className="calc-parameter-section">
                <div className="calc-section-label">
                  <Ruler size={18} />
                  <strong>Габариты рабочей зоны</strong>
                  <span>Это полезное пространство, куда будет помещаться лист, труба, профиль или кассета.</span>
                </div>
                <div className="dimension-coach" aria-label="Как читать габариты">
                  <div className="dimension-box">
                    <span className="dimension-length">Длина {input.lengthMm.toLocaleString("ru-RU")} мм</span>
                    <span className="dimension-width">Ширина {input.widthMm.toLocaleString("ru-RU")} мм</span>
                    <span className="dimension-height">Высота {input.heightMm.toLocaleString("ru-RU")} мм</span>
                  </div>
                  <div>
                    <strong>Как выбрать размеры?</strong>
                    <p>Берите размер под самый крупный лист, трубу или пачку металла. Если сомневаетесь, выбирайте ближайшее значение с запасом.</p>
                  </div>
                </div>
                <OptionGroup
                  title="Какая высота нужна под материал?"
                  hint={dimensionHints.heightMm}
                  unit="мм"
                  values={profile.heightOptions.map((option) => option.value)}
                  active={input.heightMm}
                  onSelect={(value) => setNumberField("heightMm", value)}
                />
                <OptionGroup
                  title="Какая ширина нужна под лист или пачку?"
                  hint={dimensionHints.widthMm}
                  unit="мм"
                  values={profile.widthOptions.map((option) => option.value)}
                  active={input.widthMm}
                  onSelect={(value) => setNumberField("widthMm", value)}
                />
                <OptionGroup
                  title="Какая максимальная длина материала?"
                  hint={dimensionHints.lengthMm}
                  unit="мм"
                  values={profile.lengthOptions.map((option) => option.value)}
                  active={input.lengthMm}
                  onSelect={(value) => setNumberField("lengthMm", value)}
                />
              </div>

              <div className="calc-parameter-section">
                <div className="calc-section-label">
                  <Gauge size={18} />
                  <strong>Нагрузка и вместимость</strong>
                  <span>Здесь задается вес металла на уровень и количество мест хранения в системе.</span>
                </div>
                <OptionGroup
                  title="Сколько весит материал на одном уровне?"
                  hint={dimensionHints.loadKg}
                  unit="кг"
                  values={profile.loadOptions.map((option) => option.value)}
                  active={input.loadKg}
                  onSelect={(value) => setNumberField("loadKg", value)}
                />
                <OptionGroup
                  title={profile.pricing.kind === "hybrid" ? "Сколько полок обслуживает погрузчик?" : "Сколько уровней хранения нужно?"}
                  hint={dimensionHints.shelfCount}
                  unit="шт."
                  values={profile.shelfCountOptions}
                  active={input.shelfCount}
                  onSelect={(value) => setNumberField("shelfCount", value)}
                />
                {profile.rolloutShelfCountOptions && (
                  <OptionGroup
                    title="Сколько выкатных кассет нужно?"
                    hint={dimensionHints.rolloutShelfCount}
                    unit="шт."
                    values={profile.rolloutShelfCountOptions}
                    active={input.rolloutShelfCount}
                    onSelect={(value) => setNumberField("rolloutShelfCount", value)}
                  />
                )}
                <OptionGroup
                  title="Сколько башен или секций ставим?"
                  hint={dimensionHints.towerCount}
                  unit="шт."
                  values={profile.towerCountOptions}
                  active={input.towerCount}
                  onSelect={(value) => setNumberField("towerCount", value)}
                />
              </div>

              {profile.pricing.kind === "rollout" && profile.pricing.sides && (
                <div className="calc-option-group">
                  <div>
                    <span>Вариант выдвижения</span>
                    <small><Info size={14} />Выберите, с какой стороны оператор получает доступ к кассетам.</small>
                  </div>
                  <div className="calc-chip-row">
                    {profile.pricing.sides.map((side) => (
                      <button
                        className={input.rolloutSide === side.value ? "calc-chip is-active" : "calc-chip"}
                        key={side.value}
                        type="button"
                        onClick={() => setInput((current) => ({ ...current, rolloutSide: side.value }))}
                      >
                        {side.value === "two" ? "С двух сторон" : "С одной стороны"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="calc-options-block calc-parameter-section">
                <div className="calc-panel-title compact">
                  <ShieldCheck size={22} />
                  <div>
                    <h3>Дополнительные опции</h3>
                    <p>Отметьте оборудование, которое влияет на удобство загрузки, безопасность и учет материала.</p>
                  </div>
                </div>
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
              </div>

              <div className="calc-client-block">
                <div className="calc-section-label">
                  <MapPin size={18} />
                  <strong>Объект и условия работы</strong>
                  <span>Необязательно заполнять подробно. Достаточно города и пары важных особенностей склада.</span>
                </div>
                <label className="text-field">
                  <span><MapPin size={16} />Город или регион поставки</span>
                  <input
                    value={input.city}
                    onChange={(event) => setInput((current) => ({ ...current, city: event.target.value }))}
                    placeholder="Например: Москва, Казань, Минск"
                  />
                </label>
                <label className="text-field">
                  <span><MessageSquareText size={16} />Что важно учесть инженеру</span>
                  <textarea
                    value={input.comment ?? ""}
                    onChange={(event) => setInput((current) => ({ ...current, comment: event.target.value }))}
                    placeholder="Например: загрузка кран-балкой, узкий проезд, нужен запас по нагрузке"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="calc-panel final-panel">
              <div className="calc-panel-title">
                <ClipboardCheck size={24} />
                <div>
                  <h3>Результат расчета</h3>
                  <p>Это ориентир для первичного подбора. Финальная стоимость уточняется после инженерной проверки.</p>
                </div>
              </div>

              <div className="result-card">
                <div>
                  <span>Рекомендация</span>
                  <h3>{display.title}</h3>
                  <p>{display.description}</p>
                </div>
                <div className="result-price-box">
                  <small>предварительная стоимость</small>
                  <strong>от {roundedPrice}</strong>
                  <em>финальная цена после инженерной проверки</em>
                </div>
              </div>

              <div className="calc-result-sections">
                <section>
                  <h4>Выбранная конфигурация</h4>
                  <div className="deliverable-grid">
                    <span><small>Рабочая зона</small><strong>{dimensionLabel}</strong></span>
                    <span><small>Нагрузка на уровень</small><strong>{input.loadKg.toLocaleString("ru-RU")} кг</strong></span>
                    <span><small>Количество полок</small><strong>{input.shelfCount.toLocaleString("ru-RU")} шт.</strong></span>
                    <span><small>Башни / секции</small><strong>{input.towerCount.toLocaleString("ru-RU")} шт.</strong></span>
                  </div>
                </section>
                <section>
                  <h4>Что проверит инженер</h4>
                  <div className="deliverable-grid">
                    <span><small>Материал под нагрузкой</small><strong>{storedWeightLabel} кг</strong></span>
                    <span><small>Ориентир на одну опору</small><strong>{supportLoadLabel} кг</strong></span>
                    <span><small>Проверка склада</small><strong>загрузка и проходы</strong></span>
                    <span><small>Безопасность</small><strong>запас прочности и монтаж</strong></span>
                  </div>
                </section>
                <section>
                  <h4>Что вы получите после заявки</h4>
                  <div className="deliverable-grid">
                    <span><small>Схема под склад</small><strong>размещение и проходы</strong></span>
                    <span><small>Проверка нагрузки</small><strong>полки, опоры, запас</strong></span>
                    <span><small>Подбор исполнения</small><strong>опции, покраска, монтаж</strong></span>
                    <span><small>Следующий шаг</small><strong>предложение от инженера</strong></span>
                  </div>
                </section>
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

              {/* Honeypot — невидимое поле для ботов. Не трогать. */}
              <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}>
                <label>
                  Не заполняйте это поле
                  <input value={hpUrl} onChange={(event) => setHpUrl(event.target.value)} type="text" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <button className="primary-button" type="button" onClick={submitLead}>
                <Send size={18} />
                Получить расчет и схему под склад
              </button>
              {leadStatus && <p className="lead-status">{leadStatus}</p>}
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
          <span className="line-kicker">Живой расчет</span>
          <h3>{display.title}</h3>
          <img src={display.image} alt={display.title} />
          <div className="summary-helper">
            <strong>Вы меняете параметры слева — расчет обновляется сразу.</strong>
            <span>Это стартовая оценка для разговора с инженером, не финальное коммерческое предложение.</span>
          </div>
          <div className="summary-spec-grid" aria-label="Ключевые параметры">
            <span><Ruler size={16} />{dimensionLabel}</span>
            <span><Gauge size={16} />{input.loadKg.toLocaleString("ru-RU")} кг на уровень</span>
            <span><Warehouse size={16} />{input.shelfCount.toLocaleString("ru-RU")} полок</span>
            <span><Layers3 size={16} />{input.towerCount.toLocaleString("ru-RU")} секций</span>
          </div>
          <div className="summary-price">
            от {roundedPrice}
            <small>ориентир для первичного подбора</small>
          </div>
          <div className="summary-checks">
            <span><Check size={16} />Выбрано опций: {selectedOptions.length || "пока нет"}</span>
            <span><Check size={16} />Суммарный вес: {storedWeightLabel} кг</span>
            <span><Check size={16} />Опоры проверит инженер</span>
          </div>
          <div className="calc-note">
            <Info size={18} />
            <span>Заявку и параметры расчета можно передать в CRM, 1С или складскую систему.</span>
          </div>
        </aside>
      </div>
    </section>
  );
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
