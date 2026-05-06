"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Info, PackageSearch, Ruler, Send, Settings2 } from "lucide-react";
import { calculatorProfiles, getCalculatorProfile } from "@/data/storageSystems/excelCalculator";
import type { CalculatorProfileId } from "@/data/storageSystems/excelCalculator";
import { visualAssets } from "@/data/storageSystems/visualAssets";
import { calculateStorageSystem, formatRub, normalizeCalculatorInput } from "@/lib/calculator";
import type { CalculatorInput } from "@/lib/calculator";

const steps = ["Система", "Размеры", "Опции", "Результат"];

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
  const [leadStatus, setLeadStatus] = useState("");
  const profile = useMemo(() => getCalculatorProfile(input.systemId), [input.systemId]);
  const result = useMemo(() => calculateStorageSystem(input), [input]);
  const [animatedPrice, setAnimatedPrice] = useState(result.fromPrice);
  const progress = ((step + 1) / steps.length) * 100;

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
        contact: { name: "Заявка с калькулятора", phone: "", email: "" },
        city: input.city,
        comment: input.comment,
        calculatorInput: input,
        recommendedConfig: result.recommendation,
        preliminaryPriceFrom: result.fromPrice,
        utm: {}
      })
    });

    setLeadStatus(
      response.ok
        ? "Заявка сформирована. Инженер увидит выбранные размеры, нагрузку, опции и стартовую сумму «от»."
        : "Не удалось сформировать заявку. Попробуйте ещё раз или отправьте параметры менеджеру."
    );
  }

  return (
    <section className="calculator-shell reveal" id="calculator">
      <div className="calculator-header">
        <div>
          <span className="line-kicker">Калькулятор стоимости</span>
          <h2>Конфигуратор по Excel: выбирайте только заложенные ходовые значения</h2>
          <p>
            Размеры, нагрузки, количество полок, башен и опции взяты из обновлённого файла. Цена показывается как стартовая сумма
            «от» и не заменяет инженерную проверку.
          </p>
        </div>
        <img src={visualAssets.calculator} alt="Конфигуратор системы хранения металла" />
      </div>

      <div className="calculator-product">
        <div className="calc-workspace">
          <div className="calc-progress" aria-label="Прогресс калькулятора">
            <div className="calc-progress-line"><span style={{ width: `${progress}%` }} /></div>
            <div className="calc-steps">
              {steps.map((item, index) => (
                <button className={index === step ? "is-active" : ""} key={item} type="button" onClick={() => setStep(index)}>
                  <span>{index + 1}</span>
                  {item}
                </button>
              ))}
            </div>
          </div>

          {step === 0 && (
            <div className="calc-panel">
              <h3><PackageSearch size={24} />Выберите тип системы</h3>
              <p>Это не расширенный каталог. Здесь только те формульные сценарии, которые уже заложены в Excel-калькулятор.</p>
              <div className="profile-grid">
                {calculatorProfiles.map((item) => (
                  <button
                    className={item.id === input.systemId ? "profile-card is-active" : "profile-card"}
                    key={item.id}
                    type="button"
                    onClick={() => selectProfile(item.id)}
                  >
                    <span>{item.sourceSheet}</span>
                    <strong>{item.shortTitle}</strong>
                    <small>{item.description}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="calc-panel">
              <h3><Ruler size={24} />Д×Ш×В, нагрузка и количество</h3>
              <p>Выбор ограничен значениями из Excel. Так клиенту проще, а расчёт остаётся управляемым из “Админки”.</p>
              <OptionGroup title="Высота, мм" values={profile.heightOptions.map((option) => option.value)} active={input.heightMm} onSelect={(value) => setNumberField("heightMm", value)} />
              <OptionGroup title="Ширина, мм" values={profile.widthOptions.map((option) => option.value)} active={input.widthMm} onSelect={(value) => setNumberField("widthMm", value)} />
              <OptionGroup title="Длина, мм" values={profile.lengthOptions.map((option) => option.value)} active={input.lengthMm} onSelect={(value) => setNumberField("lengthMm", value)} />
              <OptionGroup title="Нагрузка на полку, кг" values={profile.loadOptions.map((option) => option.value)} active={input.loadKg} onSelect={(value) => setNumberField("loadKg", value)} />
              <OptionGroup title={profile.pricing.kind === "hybrid" ? "Полки под погрузчик" : "Количество полок"} values={profile.shelfCountOptions} active={input.shelfCount} onSelect={(value) => setNumberField("shelfCount", value)} />
              {profile.rolloutShelfCountOptions && (
                <OptionGroup title="Выкатные кассеты" values={profile.rolloutShelfCountOptions} active={input.rolloutShelfCount} onSelect={(value) => setNumberField("rolloutShelfCount", value)} />
              )}
              <OptionGroup title="Количество башен" values={profile.towerCountOptions} active={input.towerCount} onSelect={(value) => setNumberField("towerCount", value)} />
              {profile.pricing.kind === "rollout" && profile.pricing.sides && (
                <div className="calc-option-group">
                  <span>Вариант выката</span>
                  <div className="calc-chip-row">
                    {profile.pricing.sides.map((side) => (
                      <button
                        className={input.rolloutSide === side.value ? "calc-chip is-active" : "calc-chip"}
                        key={side.value}
                        type="button"
                        onClick={() => setInput((current) => ({ ...current, rolloutSide: side.value }))}
                      >
                        {side.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="calc-panel">
              <h3><Settings2 size={24} />Опции и город</h3>
              <p>Опции тоже берутся из Excel. Старые технические следы от линий окраски в интерфейс не выводим.</p>
              <div className="option-list">
                {profile.options.map((option) => (
                  <button
                    className={input.optionIds.includes(option.id) ? "option-card is-active" : "option-card"}
                    key={option.id}
                    type="button"
                    onClick={() => toggleOption(option.id)}
                  >
                    <Check size={18} />
                    <span>{option.title}</span>
                    <strong>+ {formatRub(option.price)}</strong>
                  </button>
                ))}
              </div>
              <label className="text-field">
                Город клиента
                <input value={input.city} onChange={(event) => setInput((current) => ({ ...current, city: event.target.value }))} />
              </label>
              <label className="text-field">
                Комментарий
                <textarea value={input.comment ?? ""} onChange={(event) => setInput((current) => ({ ...current, comment: event.target.value }))} />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="calc-panel final-panel">
              <h3>Предварительная конфигурация готова</h3>
              <p>Инженер проверит нагрузку, помещение, способ загрузки и подготовит точное предложение.</p>
              <div className="deliverable-grid">
                {result.recommendation.keyParameters.map((item) => <span key={item}>{item}</span>)}
                <span>Источник: {result.sourceSheet}</span>
                <span>Нагрузка на опору: {result.engineeringSummary.supportLoadKg.toLocaleString("ru-RU")} кг</span>
              </div>
              <button className="primary-button" type="button" onClick={submitLead}><Send size={18} />Получить инженерный расчёт</button>
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
          <span className="line-kicker">Живой расчёт</span>
          <h3>{profile.shortTitle}</h3>
          <div className="config-preview" aria-label="Визуальное превью конфигурации">
            {Array.from({ length: Math.min(Math.max(input.shelfCount, input.rolloutShelfCount, 4), 10) }).map((_, index) => <i key={index} />)}
          </div>
          <div className="summary-price">
            от {formatRub(animatedPrice)}
            <small>ориентир для первичного подбора</small>
          </div>
          <ul>
            <li>Д×Ш×В: {result.engineeringSummary.dimensionsLabel}</li>
            <li>Материал под нагрузкой: {result.engineeringSummary.totalStoredWeightKg.toLocaleString("ru-RU")} кг</li>
            <li>Система под нагрузкой: {result.engineeringSummary.rackWeightWithLoadKg.toLocaleString("ru-RU")} кг</li>
            <li>Опции: {result.selectedOptions.length || "не выбраны"}</li>
          </ul>
          <div className="calc-note">
            <Info size={18} />
            <span>Финальная стоимость уточняется после инженерной проверки.</span>
          </div>
        </aside>
      </div>
    </section>
  );
}

function OptionGroup({ title, values, active, onSelect }: { title: string; values: readonly number[]; active: number; onSelect: (value: number) => void }) {
  return (
    <div className="calc-option-group">
      <span>{title}</span>
      <div className="calc-chip-row">
        {values.map((value) => (
          <button className={active === value ? "calc-chip is-active" : "calc-chip"} key={value} type="button" onClick={() => onSelect(value)}>
            {value.toLocaleString("ru-RU")}
          </button>
        ))}
      </div>
    </div>
  );
}
