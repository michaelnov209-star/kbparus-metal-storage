"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  TriangleAlert
} from "lucide-react";

type AuditStatus = {
  assetTotal: number;
  missingAssets: string[];
  missingFields: number;
  missingRecords: number;
};

type SyncState =
  | { kind: "idle" }
  | { kind: "loading"; detail: string; progress: number }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type ApiResponse = {
  error?: string;
  ok?: boolean;
  status?: AuditStatus;
  updatedFields?: number;
  createdRecords?: number;
  updatedRecords?: number;
};

async function callSyncApi(body: Record<string, unknown>): Promise<ApiResponse> {
  const response = await fetch("/api/admin/cms/current-state", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = (await response.json()) as ApiResponse;
  if (!response.ok) {
    throw new Error(payload.error || "Не удалось синхронизировать данные CMS");
  }
  return payload;
}

export function CmsCurrentStateSyncButton() {
  const router = useRouter();
  const [state, setState] = useState<SyncState>({ kind: "idle" });

  async function syncCurrentState() {
    if (state.kind === "loading") return;

    try {
      setState({
        kind: "loading",
        detail: "Проверяю расхождения между сайтом и редактором…",
        progress: 4
      });
      const audit = await callSyncApi({ action: "audit" });
      const status = audit.status;
      if (!status) throw new Error("CMS не вернула результат проверки");

      const totalWork =
        status.missingAssets.length +
        (status.missingFields > 0 || status.missingRecords > 0 ? 1 : 0);

      if (totalWork === 0) {
        setState({
          kind: "success",
          message: "Редактор уже полностью соответствует текущему состоянию сайта."
        });
        return;
      }

      for (const [index, assetKey] of status.missingAssets.entries()) {
        const progress = Math.max(8, Math.round((index / totalWork) * 82));
        setState({
          kind: "loading",
          detail: `Добавляю действующие изображения и видео: ${index + 1} из ${status.missingAssets.length}`,
          progress
        });
        await callSyncApi({ action: "asset", assetKey });
      }

      setState({
        kind: "loading",
        detail: "Заполняю пустые поля текущими значениями без перезаписи ваших правок…",
        progress: 90
      });
      const content = await callSyncApi({ action: "content" });

      setState({
        kind: "loading",
        detail: "Проверяю итоговое состояние…",
        progress: 97
      });
      const finalAudit = await callSyncApi({ action: "audit" });
      const remaining =
        (finalAudit.status?.missingAssets.length ?? 0) +
        (finalAudit.status?.missingFields ?? 0) +
        (finalAudit.status?.missingRecords ?? 0);

      if (remaining > 0) {
        throw new Error(
          `Синхронизация завершилась не полностью: осталось расхождений ${remaining}`
        );
      }

      setState({
        kind: "success",
        message: `Готово: заполнено полей ${content.updatedFields ?? 0}, добавлено записей ${content.createdRecords ?? 0}. Существующие правки сохранены.`
      });
      router.refresh();
    } catch (error) {
      setState({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Не удалось синхронизировать данные CMS"
      });
    }
  }

  return (
    <div className="kb-current-state-sync">
      <button
        type="button"
        onClick={syncCurrentState}
        disabled={state.kind === "loading"}
      >
        {state.kind === "loading" ? (
          <LoaderCircle size={16} className="kb-spin" aria-hidden />
        ) : (
          <RefreshCw size={16} aria-hidden />
        )}
        Проверить и заполнить текущее состояние
      </button>

      {state.kind === "loading" ? (
        <div
          className="kb-current-state-sync__progress"
          role="status"
          aria-live="polite"
        >
          <span>{state.detail}</span>
          <div aria-hidden>
            <i style={{ width: `${state.progress}%` }} />
          </div>
        </div>
      ) : null}

      {state.kind === "success" ? (
        <p data-state="success">
          <CheckCircle2 size={15} aria-hidden />
          {state.message}
        </p>
      ) : null}

      {state.kind === "error" ? (
        <p data-state="error">
          <TriangleAlert size={15} aria-hidden />
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
