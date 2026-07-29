"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, RefreshCw, TriangleAlert } from "lucide-react";

export type ProbeKind = "email" | "telegram";
type ProbeState = "idle" | "loading" | "success" | "error";

const endpoints: Record<ProbeKind, string> = {
  email: "/api/admin/email/verify",
  telegram: "/api/admin/telegram/verify"
};

const successMessages: Record<ProbeKind, string> = {
  email: "Яндекс SMTP ответил — подключение работает.",
  telegram: "Telegram-бот и чат ответили — подключение работает."
};

const errorMessages: Record<string, string> = {
  "smtp-auth-failed": "Яндекс отклонил логин или пароль приложения.",
  "smtp-timeout": "Почтовый сервер не ответил вовремя.",
  "smtp-not-configured": "Параметры Яндекс Почты заполнены не полностью.",
  "telegram-not-configured": "Токен бота или ID чата не настроены.",
  "telegram-bot-unavailable": "Telegram не подтвердил токен бота.",
  "telegram-chat-unavailable": "Бот не получил доступ к указанному чату.",
  "telegram-timeout": "Telegram не ответил вовремя.",
  "authentication-required": "Сессия истекла — войдите в админку снова.",
  "admin-required": "Проверка доступна только администратору."
};

export function IntegrationProbeButton({ kind }: { kind: ProbeKind }) {
  const [state, setState] = useState<ProbeState>("idle");
  const [message, setMessage] = useState("");

  async function runProbe() {
    if (state === "loading") return;
    setState("loading");
    setMessage("");

    try {
      const response = await fetch(endpoints[kind], { method: "POST" });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(errorMessages[result.error || ""] || "Сервис не подтвердил подключение.");
      }
      setState("success");
      setMessage(successMessages[kind]);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Проверка не завершена.");
    }
  }

  return (
    <div className="kb-integration-probe">
      <button type="button" onClick={runProbe} disabled={state === "loading"}>
        {state === "loading" ? <LoaderCircle className="kb-spin" size={14} aria-hidden /> : <RefreshCw size={14} aria-hidden />}
        {state === "loading" ? "Проверяем…" : "Проверить подключение"}
      </button>
      {message ? (
        <p data-state={state} role="status">
          {state === "success" ? <CheckCircle2 size={14} aria-hidden /> : <TriangleAlert size={14} aria-hidden />}
          {message}
        </p>
      ) : null}
    </div>
  );
}
