"use client";

import { useRef, useState } from "react";

export function LeadForm({ title = "Получить консультацию" }: { title?: string }) {
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formStartedAt = useRef<number>(Date.now());

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    setStatus("Отправляем заявку...");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: {
            name: String(form.get("name") ?? ""),
            phone: String(form.get("phone") ?? ""),
            email: String(form.get("email") ?? "")
          },
          city: String(form.get("city") ?? ""),
          comment: String(form.get("comment") ?? ""),
          hp_url: String(form.get("hp_url") ?? ""),
          formStartedAt: formStartedAt.current,
          calculatorInput: {},
          utm: {}
        })
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setStatus("Заявка отправлена. Инженер свяжется с вами и уточнит параметры.");
        event.currentTarget.reset();
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
      <button className="line-primary" type="submit" disabled={submitting}>
        {submitting ? "Отправляем..." : "Отправить заявку"}
      </button>
      {status && <p className="line-form-status">{status}</p>}
    </form>
  );
}
