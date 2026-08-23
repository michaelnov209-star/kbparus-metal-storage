"use client";

import { useEffect, useMemo, useState } from "react";
import { useDocumentInfo, useForm } from "@payloadcms/ui";
import {
  CheckCircle2,
  CopyPlus,
  Database,
  LoaderCircle,
  ShieldCheck
} from "lucide-react";

import "./calculator-profile-editor.scss";

type TemplateProfile = {
  id: number | string;
  kind?: string | null;
  shortTitle?: string | null;
  title?: string | null;
  [key: string]: unknown;
};

type TemplateState =
  | { kind: "loading" }
  | { kind: "ready"; profiles: TemplateProfile[] }
  | { kind: "error"; message: string };

const COPY_FIELDS = [
  "kind",
  "heightOptions",
  "widthOptions",
  "lengthOptions",
  "loadOptions",
  "shelfCountOptions",
  "rolloutShelfCountOptions",
  "towerCountOptions",
  "rolloutLoadOptions",
  "towerByShelfCount",
  "towerBasePrice",
  "baseShelfCount",
  "extraShelfFactor",
  "maxCombinedShelfCount",
  "consoleBasePrice",
  "consoleLongFactor",
  "consoleLongFromMm",
  "gateBasePrice",
  "supportsTwoSided",
  "options",
  "defaultValues"
] as const;

function copyCalculationValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => copyCalculationValue(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== "id" && key !== "_uuid")
        .map(([key, item]) => [key, copyCalculationValue(item)])
    ) as T;
  }

  return value;
}

function kindLabel(kind: string | null | undefined) {
  if (kind === "automatic") return "Автоматическая система";
  if (kind === "forkliftCassette") return "Кассеты под погрузчик";
  if (kind === "rollout") return "Выкатная система";
  if (kind === "hybrid") return "Комбинированная система";
  return "Модель расчёта не указана";
}

export function CalculatorProfileBuilder() {
  const { id, isEditing } = useDocumentInfo();
  const { getData, reset } = useForm();
  const [templates, setTemplates] = useState<TemplateState>({
    kind: "loading"
  });
  const [selectedId, setSelectedId] = useState("");
  const [copying, setCopying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const search = new URLSearchParams({
      depth: "0",
      draft: "false",
      limit: "100",
      sort: "sortOrder"
    });

    void fetch(`/api/calculator-profiles?${search.toString()}`, {
      credentials: "same-origin",
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Не удалось загрузить существующие системы");
        }
        const data = (await response.json()) as {
          docs?: TemplateProfile[];
        };
        const profiles = Array.isArray(data.docs)
          ? data.docs.filter((profile) => String(profile.id) !== String(id ?? ""))
          : [];
        setTemplates({ kind: "ready", profiles });
        setSelectedId((current) => current || String(profiles[0]?.id ?? ""));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setTemplates({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "Не удалось загрузить существующие системы"
        });
      });

    return () => controller.abort();
  }, [id]);

  const selectedProfile = useMemo(
    () =>
      templates.kind === "ready"
        ? templates.profiles.find(
            (profile) => String(profile.id) === selectedId
          )
        : undefined,
    [selectedId, templates]
  );

  async function copyTemplate() {
    if (!selectedProfile || copying) return;
    setCopying(true);
    setMessage("");

    try {
      const current = getData();
      const next = { ...current };

      for (const field of COPY_FIELDS) {
        if (selectedProfile[field] !== undefined) {
          // Payload array-row IDs belong to the source document. New IDs must
          // be generated for the copy to avoid cross-document collisions.
          next[field] = copyCalculationValue(selectedProfile[field]);
        }
      }

      // The new system keeps its own identity. Only calculation data is copied.
      for (const identityField of [
        "title",
        "shortTitle",
        "slug",
        "description",
        "image",
        "bestFor",
        "iconKey",
        "sortOrder",
        "_status"
      ]) {
        next[identityField] = current[identityField];
      }

      await reset(next);
      setMessage(
        `Параметры «${selectedProfile.title || selectedProfile.shortTitle || "системы"}» скопированы. Исходная система не изменена.`
      );
    } catch {
      setMessage(
        "Не удалось скопировать параметры. Обновите страницу и повторите действие."
      );
    } finally {
      setCopying(false);
    }
  }

  if (isEditing) {
    return (
      <section
        className="kb-calc-builder kb-calc-builder--editing"
        aria-label="Редактирование системы"
      >
        <span className="kb-calc-builder__status-icon">
          <ShieldCheck size={18} aria-hidden />
        </span>
        <div>
          <strong>Изменения применятся только после публикации</strong>
          <p>
            Сохраните черновик, проверьте предварительную цену и только затем
            публикуйте. Текущая версия сайта продолжит работать до публикации.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="kb-calc-builder" aria-label="Быстрый старт новой системы">
      <div className="kb-calc-builder__heading">
        <span>
          <CopyPlus size={18} aria-hidden />
        </span>
        <div>
          <strong>Быстрый старт</strong>
          <p>
            Возьмите проверенные параметры существующей системы или заполните
            поля ниже с нуля.
          </p>
        </div>
      </div>

      {templates.kind === "loading" ? (
        <div className="kb-calc-builder__loading" role="status">
          <LoaderCircle className="kb-calc-builder__spin" size={18} />
          Загружаем существующие системы…
        </div>
      ) : templates.kind === "error" ? (
        <p className="kb-calc-builder__message" data-tone="error" role="alert">
          {templates.message}. Создать систему с нуля можно в полях ниже.
        </p>
      ) : templates.profiles.length === 0 ? (
        <div className="kb-calc-builder__empty">
          <Database size={18} aria-hidden />
          <span>
            Опубликованных систем пока нет. Заполните первую систему с нуля.
          </span>
        </div>
      ) : (
        <div className="kb-calc-builder__controls">
          <label>
            <span>Скопировать расчётные настройки из</span>
            <select
              value={selectedId}
              onChange={(event) => {
                setSelectedId(event.target.value);
                setMessage("");
              }}
            >
              {templates.profiles.map((profile) => (
                <option key={profile.id} value={String(profile.id)}>
                  {profile.title || profile.shortTitle || `Система ${profile.id}`}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={!selectedProfile || copying}
            type="button"
            onClick={copyTemplate}
          >
            {copying ? (
              <LoaderCircle className="kb-calc-builder__spin" size={17} />
            ) : (
              <CopyPlus size={17} />
            )}
            Скопировать параметры
          </button>
        </div>
      )}

      {selectedProfile ? (
        <div className="kb-calc-builder__selection">
          <CheckCircle2 size={16} aria-hidden />
          <span>
            Будут скопированы размеры, нагрузки, цены, количества уровней,
            секций и опции. <b>{kindLabel(selectedProfile.kind)}</b>.
          </span>
        </div>
      ) : null}

      {message ? (
        <p
          className="kb-calc-builder__message"
          data-tone={message.startsWith("Не удалось") ? "error" : "success"}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
