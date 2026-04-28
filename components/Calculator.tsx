"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, PackageSearch, Ruler, Settings2 } from "lucide-react";
import { calculateStorageSystem, formatRub, normalizeCalculatorInput } from "@/lib/calculator";
import type { CalculatorInput } from "@/lib/calculator";
import { visualAssets } from "@/data/storageSystems/visualAssets";

const materialCards = [
  { value: "sheet", title: "Лист", hint: "Пачки листа, форматные заготовки, раскрой" },
  { value: "pipe", title: "Труба", hint: "Круглая и профильная труба, длинномер" },
  { value: "profile", title: "Профиль", hint: "Профиль, уголок, швеллер, балка" },
  { value: "longProduct", title: "Сортовой прокат", hint: "Пруток, полоса, заготовки" },
  { value: "mixed", title: "Смешанный металл", hint: "Несколько групп материала на одном складе" }
] as const;

const loadingCards = [
  { value: "crane", title: "Кран-балка", hint: "Для тяжёлых пачек и подачи сверху" },
  { value: "forklift", title: "Погрузчик", hint: "Для кассет, пачек и фронтальной загрузки" },
  { value: "manual", title: "Вручную", hint: "Для лёгких позиций и сервисных зон" }
] as const;

const facilityCards = [
  { value: "workshop", title: "Цех", hint: "Рядом с оборудованием и рабочими постами" },
  { value: "warehouse", title: "Склад", hint: "Адресное хранение и отгрузка" },
  { value: "outdoor", title: "Улица", hint: "Защитное исполнение и окраска" }
] as const;

const steps = ["Материал", "Габариты", "Исполнение", "Итог"];

const initialInput = normalizeCalculatorInput({
  material: "sheet",
  materialLengthMm: 3100,
  sheetWidthMm: 1600,
  unitWeightKg: 120,
  totalStorageWeightKg: 8000,
  loadingMethod: "crane",
  facility: "workshop",
  desiredCapacity: 10,
  needsRolloutCassettes: true,
  needsPainting: true,
  needsMounting: true,
  needsDelivery: false,
  city: "Москва",
  heightMm: 150,
  widthMm: 1600,
  depthMm: 150,
  lengthMm: 3100,
  loadKg: 2500,
  towerCount: 1,
  shelfCount: 7,
  cassetteCount: 7,
  execution: "manual"
});

type FieldName = keyof CalculatorInput;

export function Calculator() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<CalculatorInput>(initialInput);
  const [leadStatus, setLeadStatus] = useState("");
  const result = useMemo(() => calculateStorageSystem(input), [input]);
  const [animatedMin, setAnimatedMin] = useState(result.priceRange.min);
  const [animatedMax, setAnimatedMax] = useState(result.priceRange.max);
  const progress = ((step + 1) / steps.length) * 100;

  useEffect(() => {
    const fromMin = animatedMin;
    const fromMax = animatedMax;
    const toMin = result.priceRange.min;
    const toMax = result.priceRange.max;
    const start = performance.now();
    const duration = 420;
    let frame = 0;

    function tick(now: number) {
      const ratio = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setAnimatedMin(Math.round(fromMin + (toMin - fromMin) * eased));
      setAnimatedMax(Math.round(fromMax + (toMax - fromMax) * eased));
      if (ratio < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.priceRange.min, result.priceRange.max]);

  function setField<T extends FieldName>(field: T, value: CalculatorInput[T]) {
    setInput((current) => ({ ...current, [field]: value }));
  }

  async function submitLead() {
    setLeadStatus("Готовим заявку для инженера...");
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact: { name: "Заявка с калькулятора", phone: "", email: "" },
        city: input.city,
        comment: input.comment,
        calculatorInput: input,
        utm: {}
      })
    });
    setLeadStatus(
      response.ok
        ? "Заявка сформирована. Инженер увидит параметры подбора и быстрее подготовит предложение."
        : "Не удалось сформировать заявку. Попробуйте ещё раз или отправьте параметры менеджеру."
    );
  }

  return (
    <section className="calculator-shell reveal" id="calculator">
      <div className="calculator-header">
        <div>
          <span className="eyebrow">Инженерный калькулятор</span>
          <h2>Подберите систему хранения и получите предварительный диапазон</h2>
          <p>
            Это ориентир для первичного подбора. Финальная стоимость уточняется после инженерной проверки нагрузки,
            помещения и состава системы.
          </p>
        </div>
        <img src={visualAssets.calculator} alt="Визуал конфигуратора системы хранения" />
      </div>

      <div className="calculator-product">
        <div className="calc-workspace">
          <div className="calc-progress" aria-label="Прогресс калькулятора">
            <div className="calc-progress-line"><span style={{ width: `${progress}%` }} /></div>
            <div className="calc-steps">
              {steps.map((item, index) => (
                <button
                  className={index === step ? "is-active" : ""}
                  key={item}
                  type="button"
                  onClick={() => setStep(index)}
                >
                  <span>{index + 1}</span>
                  {item}
                </button>
              ))}
            </div>
          </div>

          {step === 0 && (
            <div className="calc-panel">
              <h3><PackageSearch size={24} />Что нужно хранить?</h3>
              <p>От материала зависит тип конструкции, доступ к ячейкам и способ безопасной загрузки.</p>
              <div className="choice-grid">
                {materialCards.map((card) => (
                  <ChoiceCard
                    active={input.material === card.value}
                    key={card.value}
                    title={card.title}
                    hint={card.hint}
                    onClick={() => setField("material", card.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="calc-panel">
              <h3><Ruler size={24} />Какие габариты и нагрузка?</h3>
              <p>Чем точнее исходные данные, тем быстрее инженер проверит конструкцию и запас прочности.</p>
              <div className="metric-grid">
                <NumberInput label="Длина материала, мм" value={input.materialLengthMm} onChange={(value) => setField("materialLengthMm", value)} />
                <NumberInput label="Ширина листа, мм" value={input.sheetWidthMm} onChange={(value) => setField("sheetWidthMm", value)} />
                <NumberInput label="Вес единицы, кг" value={input.unitWeightKg} onChange={(value) => setField("unitWeightKg", value)} />
                <NumberInput label="Общий объём, кг" value={input.totalStorageWeightKg} onChange={(value) => setField("totalStorageWeightKg", value)} />
                <NumberInput label="Рабочая высота, мм" value={input.heightMm} onChange={(value) => setField("heightMm", value)} />
                <NumberInput label="Ширина системы, мм" value={input.widthMm} onChange={(value) => setField("widthMm", value)} />
                <NumberInput label="Глубина, мм" value={input.depthMm} onChange={(value) => setField("depthMm", value)} />
                <NumberInput label="Длина системы, мм" value={input.lengthMm} onChange={(value) => setField("lengthMm", value)} />
                <NumberInput label="Нагрузка на уровень, кг" value={input.loadKg} onChange={(value) => setField("loadKg", value)} />
                <NumberInput label="Башни" value={input.towerCount} onChange={(value) => setField("towerCount", value)} />
                <NumberInput label="Полки" value={input.shelfCount} onChange={(value) => setField("shelfCount", value)} />
                <NumberInput label="Выкатные кассеты" value={input.cassetteCount} onChange={(value) => setField("cassetteCount", value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="calc-panel">
              <h3><Settings2 size={24} />Как система будет работать на объекте?</h3>
              <p>Способ загрузки, помещение и опции влияют на конструкцию, покрытие, монтаж и логистику.</p>
              <div className="choice-grid three">
                {loadingCards.map((card) => (
                  <ChoiceCard
                    active={input.loadingMethod === card.value}
                    key={card.value}
                    title={card.title}
                    hint={card.hint}
                    onClick={() => setField("loadingMethod", card.value)}
                  />
                ))}
              </div>
              <div className="choice-grid three">
                {facilityCards.map((card) => (
                  <ChoiceCard
                    active={input.facility === card.value}
                    key={card.value}
                    title={card.title}
                    hint={card.hint}
                    onClick={() => setField("facility", card.value)}
                  />
                ))}
              </div>
              <div className="toggle-grid">
                <Toggle label="Выкатные кассеты" checked={input.needsRolloutCassettes} onChange={(value) => setField("needsRolloutCassettes", value)} />
                <Toggle label="Промышленная окраска" checked={input.needsPainting} onChange={(value) => setField("needsPainting", value)} />
                <Toggle label="Монтаж на объекте" checked={input.needsMounting} onChange={(value) => setField("needsMounting", value)} />
                <Toggle label="Доставка" checked={input.needsDelivery} onChange={(value) => setField("needsDelivery", value)} />
                <Toggle label="Автоматическая система" checked={input.execution === "automatic"} onChange={(value) => setField("execution", value ? "automatic" : "manual")} />
              </div>
              <label className="text-field">
                Город клиента
                <input value={input.city} onChange={(event) => setField("city", event.target.value)} />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="calc-panel final-panel">
              <h3>Предварительная конфигурация готова</h3>
              <p>Теперь можно отправить параметры инженеру. Он проверит нагрузки, ограничения помещения и подготовит точное предложение.</p>
              <div className="deliverable-grid">
                {result.recommendation.keyParameters.map((item) => <span key={item}>{item}</span>)}
              </div>
              <button className="primary-button" type="button" onClick={submitLead}>Получить инженерный расчёт</button>
              {leadStatus && <p className="lead-status">{leadStatus}</p>}
            </div>
          )}

          <div className="calc-controls">
            <button className="ghost-button" type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(current - 1, 0))}>
              Назад
            </button>
            <button className="secondary-button" type="button" disabled={step === steps.length - 1} onClick={() => setStep((current) => Math.min(current + 1, steps.length - 1))}>
              Далее
            </button>
          </div>
        </div>

        <aside className="calc-summary">
          <span className="eyebrow">Живой расчёт</span>
          <h3>{result.recommendation.title}</h3>
          <div className="summary-price">
            {formatRub(animatedMin)} - {formatRub(animatedMax)}
            <small>предварительный диапазон</small>
          </div>
          <div className="summary-note">
            Финальная стоимость уточняется после инженерной проверки. Калькулятор не является коммерческим предложением.
          </div>
          <div className="summary-list">
            <strong>Почему такая рекомендация</strong>
            {result.recommendation.rationale.map((item) => <span key={item}>{item}</span>)}
          </div>
          <div className="summary-list">
            <strong>Что уточнит инженер</strong>
            {result.recommendation.engineerQuestions.map((item) => <span key={item}>{item}</span>)}
          </div>
        </aside>
      </div>
    </section>
  );
}

function ChoiceCard({ active, title, hint, onClick }: { active: boolean; title: string; hint: string; onClick: () => void }) {
  return (
    <button className={active ? "choice-card is-active" : "choice-card"} type="button" onClick={onClick}>
      <span className="choice-icon" />
      <strong>{title}</strong>
      <small>{hint}</small>
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span />
      {label}
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="number-field">
      <span>{label}<Info size={14} aria-hidden="true" /></span>
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
