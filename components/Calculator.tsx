"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Gauge,
  Info,
  Layers3,
  PackageSearch,
  Ruler,
  Send,
  ShieldCheck
} from "lucide-react";
import { calculatorProfiles, getCalculatorProfile } from "@/data/storageSystems/excelCalculator";
import type { CalculatorProfileId } from "@/data/storageSystems/excelCalculator";
import { visualAssets } from "@/data/storageSystems/visualAssets";
import { calculateStorageSystem, formatRub, normalizeCalculatorInput } from "@/lib/calculator";
import type { CalculatorInput } from "@/lib/calculator";

const steps = ["Выберите оборудование", "Параметры оборудования", "Результат расчета"];

const profileCopy: Record<CalculatorProfileId, { title: string; shortTitle: string; description: string; image: string }> = {
  "auto-sheet-metal": {
    title: "Автоматизированная система хранения листового металла",
    shortTitle: "Автоматический склад листа",
    description: "Для листового металла с подъемным модулем, выдачей паллет и опциями безопасности.",
    image: visualAssets.engineering
  },
  "auto-sort-metal": {
    title: "Автоматизированная система для сортового и трубного проката",
    shortTitle: "Автоматический склад труб и профиля",
    description: "Для труб, профиля, балок и сортового проката с механизированной выдачей.",
    image: visualAssets.tubesProfile
  },
  "rollout-cassette-rack": {
    title: "Стеллаж с выкатными кассетами",
    shortTitle: "Выкатные кассеты",
    description: "Для листа и пачек, когда нужен прямой доступ к каждой кассете.",
    image: visualAssets.forklift
  },
  "forklift-cassette-rack": {
    title: "Кассетный стеллаж под погрузчик",
    shortTitle: "Кассеты под погрузчик",
    description: "Для кассетного хранения листа с обслуживанием погрузчиком.",
    image: visualAssets.sheetMetal
  },
  "two-side-rollout-rack": {
    title: "Двухсторонний стеллаж с выкатными кассетами",
    shortTitle: "Двухсторонние кассеты",
    description: "Для складов, где нужен доступ к кассетам с одной или двух сторон.",
    image: visualAssets.steelProfile
  },
  "hybrid-rollout-rack": {
    title: "Гибридный стеллаж с выкатными кассетами",
    shortTitle: "Гибридная система",
    description: "Комбинация полок под погрузчик и выкатных кассет в одной системе.",
    image: visualAssets.warehouse
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
  const profile = useMemo(() => getCalculatorProfile(input.systemId), [input.systemId]);
  const result = useMemo(() => calculateStorageSystem(input), [input]);
  const [animatedPrice, setAnimatedPrice] = useState(result.fromPrice);
  const progress = ((step + 1) / steps.length) * 100;
  const display = profileCopy[profile.id];
  const selectedOptions = profile.options.filter((option) => input.optionIds.includes(option.id));
  const dimensionLabel = `${input.lengthMm.toLocaleString("ru-RU")}×${input.widthMm.toLocaleString("ru-RU")}×${input.heightMm.toLocaleString("ru-RU")} мм`;

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
        utm: {}
      })
    });

    setLeadStatus(
      response.ok
        ? "Заявка сформирована. Инженер увидит выбранные параметры и свяжется с вами."
        : "Не удалось сформировать заявку. Попробуйте еще раз или позвоните нам."
    );
  }

  return (
    <section className="calculator-shell reveal" id="calculator">
      <div className="calculator-heading">
        <span className="line-kicker">Калькулятор стоимости</span>
        <h2>Подберите систему хранения за несколько шагов</h2>
        <p>
          Выберите тип оборудования, ходовые размеры, нагрузку, количество полок и опции. Сайт покажет стартовую
          сумму от рассчитанного значения, а финальную стоимость уточнит инженер после проверки условий объекта.
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
                  <p>Начните с наиболее близкого типа системы. На следующем шаге появятся только нужные параметры.</p>
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
                      <img src={card.image} alt={card.title} />
                      <span><Layers3 size={16} /> система</span>
                      <strong>{card.shortTitle}</strong>
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
                  <p>Цифры ниже — готовые варианты размеров и нагрузок. Выберите ближайший вариант, чтобы быстро получить ориентир.</p>
                </div>
              </div>

              <OptionGroup
                title="Высота ячейки / полки"
                hint={dimensionHints.heightMm}
                unit="мм"
                values={profile.heightOptions.map((option) => option.value)}
                active={input.heightMm}
                onSelect={(value) => setNumberField("heightMm", value)}
              />
              <OptionGroup
                title="Ширина рабочей зоны"
                hint={dimensionHints.widthMm}
                unit="мм"
                values={profile.widthOptions.map((option) => option.value)}
                active={input.widthMm}
                onSelect={(value) => setNumberField("widthMm", value)}
              />
              <OptionGroup
                title="Длина рабочей зоны"
                hint={dimensionHints.lengthMm}
                unit="мм"
                values={profile.lengthOptions.map((option) => option.value)}
                active={input.lengthMm}
                onSelect={(value) => setNumberField("lengthMm", value)}
              />
              <OptionGroup
                title="Нагрузка на полку / кассету"
                hint={dimensionHints.loadKg}
                unit="кг"
                values={profile.loadOptions.map((option) => option.value)}
                active={input.loadKg}
                onSelect={(value) => setNumberField("loadKg", value)}
              />
              <OptionGroup
                title={profile.pricing.kind === "hybrid" ? "Полки под погрузчик" : "Количество полок"}
                hint={dimensionHints.shelfCount}
                unit="шт."
                values={profile.shelfCountOptions}
                active={input.shelfCount}
                onSelect={(value) => setNumberField("shelfCount", value)}
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
              <OptionGroup
                title="Количество башен / секций"
                hint={dimensionHints.towerCount}
                unit="шт."
                values={profile.towerCountOptions}
                active={input.towerCount}
                onSelect={(value) => setNumberField("towerCount", value)}
              />

              {profile.pricing.kind === "rollout" && profile.pricing.sides && (
                <div className="calc-option-group">
                  <div>
                    <span>Вариант выдвижения</span>
                    <small>Выберите, с какой стороны оператор получает доступ к кассетам.</small>
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

              <div className="calc-options-block">
                <div className="calc-panel-title compact">
                  <ShieldCheck size={22} />
                  <div>
                    <h3>Дополнительные опции</h3>
                    <p>Отметьте то, что нужно для безопасной загрузки, учета и работы с листом.</p>
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

              <div className="calc-fields-grid">
                <label className="text-field">
                  Город клиента
                  <input value={input.city} onChange={(event) => setInput((current) => ({ ...current, city: event.target.value }))} />
                </label>
                <label className="text-field">
                  Комментарий
                  <textarea value={input.comment ?? ""} onChange={(event) => setInput((current) => ({ ...current, comment: event.target.value }))} />
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
                <strong>от {formatRub(animatedPrice)}</strong>
              </div>

              <div className="deliverable-grid">
                <span>Габариты рабочей зоны: {dimensionLabel}</span>
                <span>Нагрузка на полку: {input.loadKg.toLocaleString("ru-RU")} кг</span>
                <span>Полки: {input.shelfCount.toLocaleString("ru-RU")} шт.</span>
                <span>Башни / секции: {input.towerCount.toLocaleString("ru-RU")} шт.</span>
                <span>Материал под нагрузкой: {result.engineeringSummary.totalStoredWeightKg.toLocaleString("ru-RU")} кг</span>
                <span>Нагрузка на одну опору: {result.engineeringSummary.supportLoadKg.toLocaleString("ru-RU")} кг</span>
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

              <button className="primary-button" type="button" onClick={submitLead}>
                <Send size={18} />
                Получить инженерный расчет
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
          <h3>{display.shortTitle}</h3>
          <img src={display.image} alt={display.title} />
          <div className="config-preview" aria-label="Визуальное превью конфигурации">
            {Array.from({ length: Math.min(Math.max(input.shelfCount, input.rolloutShelfCount, 4), 10) }).map((_, index) => <i key={index} />)}
          </div>
          <div className="summary-price">
            от {formatRub(animatedPrice)}
            <small>ориентир для первичного подбора</small>
          </div>
          <ul>
            <li>Рабочая зона: {dimensionLabel}</li>
            <li>Нагрузка: {input.loadKg.toLocaleString("ru-RU")} кг на уровень</li>
            <li>Полки: {input.shelfCount.toLocaleString("ru-RU")}</li>
            <li>Башни / секции: {input.towerCount.toLocaleString("ru-RU")}</li>
            <li>Опции: {selectedOptions.length || "не выбраны"}</li>
          </ul>
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
