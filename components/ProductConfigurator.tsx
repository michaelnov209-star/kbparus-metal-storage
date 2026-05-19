"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, ClipboardCheck, Info, Ruler, Send, ShieldCheck } from "lucide-react";
import { getCalculatorProfile, type CalculatorProfileId } from "@/data/storageSystems/excelCalculator";
import { calculateStorageSystem } from "@/lib/calculator/pricing";
import { formatRoundedRub } from "@/lib/calculator/format";
import type { CalculatorInput } from "@/lib/calculator/types";
import { trackYandexGoal } from "@/lib/analytics/metrika";
import { captureLeadUtm, getStoredLeadUtm, saveLastCalculatorLead } from "@/lib/leads/client-state";

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

interface ProductConfiguratorProps {
  profileId: CalculatorProfileId;
  productTitle?: string;
  productUrl?: string;
  productImage?: string;
}

export function ProductConfigurator({ profileId, productTitle, productUrl, productImage }: ProductConfiguratorProps) {
  const profile = getCalculatorProfile(profileId);
  const [input, setInput] = useState<CalculatorInput>(() => buildInput(profileId));
  const [contact, setContact] = useState({ name: "", phone: "" });
  const [status, setStatus] = useState("");
  const [hpUrl, setHpUrl] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const formStartedAt = useRef<number>(Date.now());
  const calculatorStarted = useRef(false);
  const result = useMemo(() => calculateStorageSystem(input), [input]);
  const [animatedPrice, setAnimatedPrice] = useState(result.fromPrice);

  useEffect(() => {
    const fromValue = animatedPrice;
    const toValue = result.fromPrice;
    if (fromValue === toValue) return;
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

  useEffect(() => {
    captureLeadUtm();
  }, []);

  useEffect(() => {
    saveLastCalculatorLead({
      calculatorInput: input,
      recommendedConfig: {
        title: productTitle ?? profile.title,
        dimensions: result.engineeringSummary.dimensionsLabel,
        loadKg: input.loadKg,
        shelfCount: input.shelfCount,
        towerCount: input.towerCount,
        options: profile.options.filter((option) => input.optionIds.includes(option.id)).map((option) => option.title)
      },
      preliminaryPriceFrom: result.fromPrice,
      sourceTitle: productTitle ?? profile.title,
      sourceUrl: productUrl ?? (typeof window !== "undefined" ? window.location.href : undefined),
      sourceImage: productImage
    });
  }, [input, productImage, productTitle, productUrl, profile.options, profile.title, result.engineeringSummary.dimensionsLabel, result.fromPrice]);

  function markCalculatorStarted(action: string) {
    if (!calculatorStarted.current) {
      calculatorStarted.current = true;
      trackYandexGoal("calculator_start", { action, source: "product_configurator" });
    }
  }

  function setNumberField(field: keyof CalculatorInput, value: number) {
    markCalculatorStarted("set_number_field");
    trackYandexGoal("calculator_parameter_change", { field: String(field), value, source: "product_configurator" });
    setInput((current) => ({ ...current, [field]: value }));
    setStatus("");
  }

  function toggleOption(id: string) {
    markCalculatorStarted("toggle_option");
    trackYandexGoal("calculator_parameter_change", { field: "optionIds", value: id, source: "product_configurator" });
    setInput((current) => ({
      ...current,
      optionIds: current.optionIds.includes(id)
        ? current.optionIds.filter((optionId) => optionId !== id)
        : [...current.optionIds, id]
    }));
    setStatus("");
  }

  async function submitLead() {
    if (submittingLead) return;
    if (!consentAccepted) {
      setStatus("Подтвердите согласие на обработку персональных данных.");
      return;
    }
    setSubmittingLead(true);
    setStatus("Отправляем параметры инженеру...");
    trackYandexGoal("form_submit", { title: productTitle ?? profile.title, leadType: "configurator" });
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadType: "configurator",
          contact,
          city: input.city,
          comment: input.comment,
          calculatorInput: input,
          recommendedConfig: result.recommendation,
          preliminaryPriceRange: {
            from: result.fromPrice,
            label: `от ${formatRoundedRub(result.fromPrice)}`
          },
          preliminaryPriceFrom: result.fromPrice,
          source: `Конфигуратор товара — ${productTitle ?? profile.title}`,
          sourceTitle: productTitle ?? profile.title,
          sourceUrl: productUrl,
          sourceImage: productImage,
          hp_url: hpUrl,
          formStartedAt: formStartedAt.current,
          utm: getStoredLeadUtm()
        })
      });

      const data = await response.json().catch(() => ({}));
      setStatus(
        response.ok
          ? "Заявка принята. Инженер получит параметры и свяжется с вами."
          : (data?.error ?? "Не получилось отправить заявку. Попробуйте еще раз.")
      );
      if (response.ok) {
        trackYandexGoal("lead_submit_success", { title: productTitle ?? profile.title, leadType: "configurator" });
        setConsentAccepted(false);
        formStartedAt.current = Date.now();
      }
    } catch {
      setStatus("Сеть недоступна. Попробуйте через минуту или позвоните нам.");
    } finally {
      setSubmittingLead(false);
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
        <strong>от {formatRoundedRub(animatedPrice)}</strong>
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
          <label className="product-consent consent-field">
            <input
              checked={consentAccepted}
              onChange={(event) => setConsentAccepted(event.target.checked)}
              type="checkbox"
            />
            <span>
              Согласен на обработку персональных данных и ознакомлен с{" "}
              <a href="/privacy-policy" target="_blank" rel="noreferrer">политикой конфиденциальности</a>.
            </span>
          </label>
          <button className="primary-button" type="button" onClick={submitLead} disabled={submittingLead || !consentAccepted}>
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
