"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, ClipboardCheck, Info, Ruler, Send, ShieldCheck } from "lucide-react";
import { getCalculatorProfile, type CalculatorProfileId } from "@/data/storageSystems/excelCalculator";
import { calculateStorageSystem } from "@/lib/calculator/pricing";
import { formatRoundedRub } from "@/lib/calculator/format";
import type { CalculatorInput } from "@/lib/calculator/types";

function buildInput(profileId: CalculatorProfileId): CalculatorInput {
  const profile = getCalculatorProfile(profileId);
  const defaults = profile.defaultValues;

  return {
    systemId: profileId,
    material: profile.productType === "automated" ? "sheet" : "mixed",
    materialLengthMm: defaults.lengthMm,
    sheetWidthMm: defaults.widthMm,
    unitWeightKg: defaults.loadKg,
    totalStorageWeightKg: defaults.loadKg * defaults.shelfCount * defaults.towerCount,
    loadingMethod: "crane",
    facility: "workshop",
    desiredCapacity: defaults.shelfCount,
    needsRolloutCassettes: profile.pricing.kind === "rollout" || profile.pricing.kind === "hybrid",
    needsPainting: true,
    needsMounting: true,
    needsDelivery: true,
    city: "",
    heightMm: defaults.heightMm,
    widthMm: defaults.widthMm,
    depthMm: 0,
    lengthMm: defaults.lengthMm,
    loadKg: defaults.loadKg,
    towerCount: defaults.towerCount,
    shelfCount: defaults.shelfCount,
    rolloutShelfCount: defaults.rolloutShelfCount ?? 0,
    rolloutSide: defaults.rolloutSide ?? "one",
    cassetteCount: defaults.rolloutShelfCount ?? defaults.shelfCount,
    execution: profile.productType === "automated" ? "automatic" : "manual",
    optionIds: profile.options.filter((option) => option.defaultSelected).map((option) => option.id),
    comment: ""
  };
}

export function ProductConfigurator({ profileId }: { profileId: CalculatorProfileId }) {
  const profile = getCalculatorProfile(profileId);
  const [input, setInput] = useState<CalculatorInput>(() => buildInput(profileId));
  const [contact, setContact] = useState({ name: "", phone: "" });
  const [status, setStatus] = useState("");
  const [hpUrl, setHpUrl] = useState("");
  const formStartedAt = useRef<number>(Date.now());
  const result = useMemo(() => calculateStorageSystem(input), [input]);

  function setNumberField(field: keyof CalculatorInput, value: number) {
    setInput((current) => ({ ...current, [field]: value }));
    setStatus("");
  }

  function toggleOption(id: string) {
    setInput((current) => ({
      ...current,
      optionIds: current.optionIds.includes(id)
        ? current.optionIds.filter((optionId) => optionId !== id)
        : [...current.optionIds, id]
    }));
    setStatus("");
  }

  async function submitLead() {
    setStatus("Отправляем параметры инженеру...");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact,
          city: input.city,
          comment: input.comment,
          calculatorInput: input,
          recommendedConfig: result.recommendation,
          preliminaryPriceRange: {
            from: result.fromPrice,
            label: `от ${formatRoundedRub(result.fromPrice)}`
          },
          source: `Конфигуратор товара — ${profile.title}`,
          hp_url: hpUrl,
          formStartedAt: formStartedAt.current
        })
      });

      const data = await response.json().catch(() => ({}));
      setStatus(
        response.ok
          ? "Заявка принята. Инженер получит параметры и свяжется с вами."
          : (data?.error ?? "Не получилось отправить заявку. Попробуйте еще раз.")
      );
    } catch {
      setStatus("Сеть недоступна. Попробуйте через минуту или позвоните нам.");
    }
  }

  return (
    <section className="product-configurator">
      <div className="product-configurator-main">
        <div className="product-configurator-title">
          <span>Конфигуратор товара</span>
          <h2>{profile.title}</h2>
          <p>Выберите ходовые параметры из калькулятора. Финальную стоимость инженер уточнит после проверки помещения, нагрузки и способа загрузки.</p>
        </div>

        <ConfiguratorGroup
          icon={<Ruler size={20} />}
          title="Габариты рабочей зоны"
          hint="Длина, ширина и высота полезного пространства под листовой металл."
        >
          <ChipRow title="Длина материала" unit="мм" values={profile.lengthOptions.map((item) => item.value)} active={input.lengthMm} onSelect={(value) => setNumberField("lengthMm", value)} />
          <ChipRow title="Ширина листа / пачки" unit="мм" values={profile.widthOptions.map((item) => item.value)} active={input.widthMm} onSelect={(value) => setNumberField("widthMm", value)} />
          <ChipRow title="Высота ячейки" unit="мм" values={profile.heightOptions.map((item) => item.value)} active={input.heightMm} onSelect={(value) => setNumberField("heightMm", value)} />
        </ConfiguratorGroup>

        <ConfiguratorGroup
          icon={<ShieldCheck size={20} />}
          title="Нагрузка и вместимость"
          hint="Параметры влияют на металлоемкость, количество уровней и итоговую стоимость."
        >
          <ChipRow title="Нагрузка на уровень" unit="кг" values={profile.loadOptions.map((item) => item.value)} active={input.loadKg} onSelect={(value) => setNumberField("loadKg", value)} />
          <ChipRow title="Количество полок" unit="шт." values={profile.shelfCountOptions} active={input.shelfCount} onSelect={(value) => setNumberField("shelfCount", value)} />
          <ChipRow title="Количество башен" unit="шт." values={profile.towerCountOptions} active={input.towerCount} onSelect={(value) => setNumberField("towerCount", value)} />
        </ConfiguratorGroup>

        <ConfiguratorGroup
          icon={<ClipboardCheck size={20} />}
          title="Опции"
          hint="Дополнительные элементы можно включить сразу, чтобы инженер видел полный запрос."
        >
          <div className="product-option-grid">
            {profile.options.map((option) => (
              <button className={input.optionIds.includes(option.id) ? "product-option is-active" : "product-option"} key={option.id} type="button" onClick={() => toggleOption(option.id)}>
                <CheckCircle2 size={18} />
                <span>{option.title}</span>
              </button>
            ))}
          </div>
        </ConfiguratorGroup>
      </div>

      <aside className="product-configurator-summary">
        <span className="summary-label">Предварительно</span>
        <strong>от {formatRoundedRub(result.fromPrice)}</strong>
        <p>Ориентир для первичного подбора. Финальная стоимость уточняется после инженерной проверки.</p>
        <div className="product-spec-list">
          <span>ДхШхВ: <b>{result.engineeringSummary.dimensionsLabel}</b></span>
          <span>Нагрузка: <b>{input.loadKg.toLocaleString("ru-RU")} кг</b></span>
          <span>Полки: <b>{input.shelfCount}</b></span>
          <span>Башни: <b>{input.towerCount}</b></span>
        </div>
        <div className="product-lead-mini">
          <input value={contact.name} onChange={(event) => setContact((current) => ({ ...current, name: event.target.value }))} placeholder="Ваше имя" />
          <input value={contact.phone} onChange={(event) => setContact((current) => ({ ...current, phone: event.target.value }))} placeholder="+7 (999) 999-99-99" />
          <input value={input.city} onChange={(event) => setInput((current) => ({ ...current, city: event.target.value }))} placeholder="Город поставки" />
          <textarea value={input.comment} onChange={(event) => setInput((current) => ({ ...current, comment: event.target.value }))} placeholder="Комментарий для инженера" />
          {/* Honeypot — невидимое поле для ботов. Не трогать. */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}>
            <input value={hpUrl} onChange={(event) => setHpUrl(event.target.value)} type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <button className="primary-button" type="button" onClick={submitLead}>
            <Send size={18} />
            Получить расчет
          </button>
          {status && <small>{status}</small>}
        </div>
      </aside>
    </section>
  );
}

function ConfiguratorGroup({ icon, title, hint, children }: { icon: ReactNode; title: string; hint: string; children: ReactNode }) {
  return (
    <section className="product-configurator-group">
      <div>
        {icon}
        <div>
          <h3>{title}</h3>
          <p><Info size={14} /> {hint}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ChipRow({ title, unit, values, active, onSelect }: { title: string; unit: string; values: readonly number[]; active: number; onSelect: (value: number) => void }) {
  return (
    <div className="product-chip-row">
      <span>{title}</span>
      <div>
        {values.map((value) => (
          <button className={active === value ? "is-active" : ""} key={value} type="button" onClick={() => onSelect(value)}>
            {value.toLocaleString("ru-RU")} <em>{unit}</em>
          </button>
        ))}
      </div>
    </div>
  );
}
