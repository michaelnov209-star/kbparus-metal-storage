"use client";

import { useState } from "react";

export function LeadForm({ title = "Получить консультацию" }: { title?: string }) {
  const [status, setStatus] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("Отправляем заявку...");

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
        calculatorInput: {},
        utm: {}
      })
    });

    setStatus(
      response.ok
        ? "Заявка отправлена. Инженер свяжется с вами и уточнит параметры."
        : "Не удалось отправить заявку. Попробуйте еще раз или позвоните нам."
    );
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <form className="line-form" onSubmit={submit}>
      <h3>{title}</h3>
      <label>
        Имя
        <input name="name" placeholder="Как к вам обращаться" />
      </label>
      <label>
        Телефон
        <input name="phone" placeholder="+7" required />
      </label>
      <label>
        Email
        <input name="email" type="email" placeholder="name@company.ru" />
      </label>
      <label>
        Город
        <input name="city" placeholder="Город поставки" />
      </label>
      <label className="line-form-wide">
        Комментарий
        <textarea name="comment" placeholder="Что храните, примерные габариты, вес и условия склада" />
      </label>
      <button className="line-primary" type="submit">Отправить заявку</button>
      {status && <p className="line-form-status">{status}</p>}
    </form>
  );
}
