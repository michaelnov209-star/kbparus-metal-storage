"use client";

import { useEffect, useRef, useState } from "react";
import { trackYandexGoal } from "@/lib/analytics/metrika";
import { captureLeadUtm, getLastCalculatorLead, getStoredLeadUtm } from "@/lib/leads/client-state";

interface LeadFormProps {
  title?: string;
  /** Текстовое описание источника (fallback когда нет sourceUrl). */
  source?: string;
  /** Название товара/категории (отображается как ссылка в Telegram). */
  sourceTitle?: string;
  /** Полный или относительный URL источника (для гиперссылки в Telegram). */
  sourceUrl?: string;
  /** Путь к картинке (превью в Telegram). */
  sourceImage?: string;
  /** Прикрепляет последнюю конфигурацию калькулятора к обычной форме контактов. */
  attachLastCalculatorState?: boolean;
}

export function LeadForm({
  title = "Получить консультацию",
  source,
  sourceTitle,
  sourceUrl,
  sourceImage,
  attachLastCalculatorState = false
}: LeadFormProps) {
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const formStartedAt = useRef<number>(Date.now());

  useEffect(() => {
    captureLeadUtm();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!consentAccepted) {
      setStatus("Подтвердите согласие на обработку персональных данных.");
      return;
    }
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    setStatus("Отправляем заявку...");
    trackYandexGoal("form_submit", { title });

    const resolvedSource =
      source ??
      sourceTitle ??
      (typeof window !== "undefined" ? `${title} — ${window.location.pathname}` : title);
    const resolvedSourceUrl =
      sourceUrl ?? (typeof window !== "undefined" ? window.location.href : undefined);
    captureLeadUtm();
    const lastCalculator = attachLastCalculatorState ? getLastCalculatorLead() : undefined;

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadType: lastCalculator ? "configurator" : "contact",
          contact: {
            name: String(form.get("name") ?? ""),
            phone: String(form.get("phone") ?? ""),
            email: String(form.get("email") ?? "")
          },
          city: String(form.get("city") ?? ""),
          comment: String(form.get("comment") ?? ""),
          hp_url: String(form.get("hp_url") ?? ""),
          formStartedAt: formStartedAt.current,
          source: resolvedSource,
          sourceTitle: sourceTitle ?? lastCalculator?.sourceTitle,
          sourceUrl: resolvedSourceUrl ?? lastCalculator?.sourceUrl,
          sourceImage: sourceImage ?? lastCalculator?.sourceImage,
          calculatorInput: lastCalculator?.calculatorInput,
          recommendedConfig: lastCalculator?.recommendedConfig,
          preliminaryPriceFrom: lastCalculator?.preliminaryPriceFrom,
          utm: getStoredLeadUtm()
        })
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        trackYandexGoal("lead_submit_success", { title, leadType: lastCalculator ? "configurator" : "contact" });
        setStatus("Заявка отправлена. Инженер свяжется с вами и уточнит параметры.");
        event.currentTarget.reset();
        setConsentAccepted(false);
        formStartedAt.current = Date.now();
      } else {
        setStatus(data?.error ?? "Не удалось отправить заявку. Попробуйте еще раз или позвоните нам.");
      }
    } catch {
      setStatus("Сеть недоступна. Попробуйте через минуту или позвоните нам.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="line-form" onSubmit={submit}>
      <h3>{title}</h3>
      <label>
        Имя
        <input name="name" placeholder="Как к вам обращаться" autoComplete="name" maxLength={120} />
      </label>
      <label>
        Телефон
        <input name="phone" placeholder="+7" required autoComplete="tel" maxLength={30} inputMode="tel" />
      </label>
      <label>
        Email
        <input name="email" type="email" placeholder="name@company.ru" autoComplete="email" maxLength={120} />
      </label>
      <label>
        Город
        <input name="city" placeholder="Город поставки" autoComplete="address-level2" maxLength={80} />
      </label>
      <label className="line-form-wide">
        Комментарий
        <textarea name="comment" placeholder="Что храните, примерные габариты, вес и условия склада" maxLength={1000} />
      </label>
      {/* Honeypot — невидимое поле для ботов. Не трогать. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}>
        <label>
          Не заполняйте это поле
          <input name="hp_url" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="line-form-wide consent-field">
        <input
          checked={consentAccepted}
          onChange={(event) => setConsentAccepted(event.target.checked)}
          required
          type="checkbox"
        />
        <span>
          Согласен на обработку персональных данных и ознакомлен с{" "}
          <a href="/privacy-policy" target="_blank" rel="noreferrer">политикой конфиденциальности</a>.
        </span>
      </label>
      <button className="line-primary" type="submit" disabled={submitting || !consentAccepted}>
        {submitting ? "Отправляем..." : "Отправить заявку"}
      </button>
      {status && <p className="line-form-status">{status}</p>}
    </form>
  );
}
