"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, DatabaseZap, LoaderCircle, TriangleAlert } from "lucide-react";

type SyncState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function CalculatorProfileSyncButton({ existingCount }: { existingCount: number }) {
  const router = useRouter();
  const [state, setState] = useState<SyncState>({ kind: "idle" });

  async function syncProfiles() {
    if (state.kind === "loading") return;
    setState({ kind: "loading" });

    try {
      const response = await fetch("/api/admin/calculator-profiles/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "missing-only" })
      });
      const payload = (await response.json()) as {
        created?: number;
        existing?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Не удалось синхронизировать профили");
      }

      setState({
        kind: "success",
        message:
          payload.created && payload.created > 0
            ? `Добавлено профилей: ${payload.created}. Существующие настройки не перезаписывались.`
            : "Все 6 базовых профилей уже установлены."
      });
      router.refresh();
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Не удалось синхронизировать профили"
      });
    }
  }

  return (
    <div className="kb-profile-sync">
      <button type="button" onClick={syncProfiles} disabled={state.kind === "loading"}>
        {state.kind === "loading" ? (
          <LoaderCircle size={16} className="kb-spin" aria-hidden />
        ) : (
          <DatabaseZap size={16} aria-hidden />
        )}
        {existingCount >= 6 ? "Проверить базовые профили" : "Установить 6 базовых профилей"}
      </button>
      {state.kind === "success" ? (
        <p data-state="success"><CheckCircle2 size={15} aria-hidden />{state.message}</p>
      ) : null}
      {state.kind === "error" ? (
        <p data-state="error"><TriangleAlert size={15} aria-hidden />{state.message}</p>
      ) : null}
    </div>
  );
}