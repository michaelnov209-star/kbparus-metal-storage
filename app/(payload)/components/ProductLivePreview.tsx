"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormFields } from "@payloadcms/ui";
import {
  Check,
  ImageIcon,
  Monitor,
  Smartphone,
  Sparkles
} from "lucide-react";
import "./product-editor.scss";

type PreviewMode = "catalog" | "mobile";

type FormState = Record<
  string,
  {
    value?: unknown;
    rows?: unknown[];
  }
>;

function textValue(fields: FormState, path: string) {
  const value = fields[path]?.value;
  return typeof value === "string" ? value.trim() : "";
}

function numericValue(fields: FormState, path: string) {
  const value = fields[path]?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function hasValue(fields: FormState, path: string) {
  const field = fields[path];
  if (!field) return false;
  if (Array.isArray(field.rows)) return field.rows.length > 0;
  if (Array.isArray(field.value)) return field.value.length > 0;
  return field.value !== undefined && field.value !== null && field.value !== "";
}

function hasNestedValue(fields: FormState, prefix: string) {
  return Object.entries(fields).some(([path, field]) => {
    if (!path.startsWith(`${prefix}.`) && path !== prefix) return false;
    if (Array.isArray(field.rows)) return field.rows.length > 0;
    if (Array.isArray(field.value)) return field.value.length > 0;
    return field.value !== undefined && field.value !== null && field.value !== "";
  });
}

function relationId(value: unknown): string | number | undefined {
  if (typeof value === "string" || typeof value === "number") return value;
  if (!value || typeof value !== "object") return undefined;
  const object = value as { id?: unknown; value?: unknown };
  if (typeof object.id === "string" || typeof object.id === "number") return object.id;
  if (typeof object.value === "string" || typeof object.value === "number") return object.value;
  return undefined;
}

function directImageUrl(value: unknown): string | undefined {
  if (typeof value === "string" && (value.startsWith("/") || value.startsWith("http"))) {
    return value;
  }
  if (!value || typeof value !== "object") return undefined;
  const object = value as {
    url?: unknown;
    thumbnailURL?: unknown;
    sizes?: { cardMd?: { url?: unknown }; medium?: { url?: unknown } };
  };
  const candidates = [
    object.sizes?.cardMd?.url,
    object.sizes?.medium?.url,
    object.thumbnailURL,
    object.url
  ];
  return candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && (candidate.startsWith("/") || candidate.startsWith("http"))
  );
}

function formatPrice(value?: number) {
  return value ? `${new Intl.NumberFormat("ru-RU").format(value)} ₽` : "";
}

export function ProductLivePreview() {
  const [mode, setMode] = useState<PreviewMode>("catalog");
  const [resolvedImage, setResolvedImage] = useState<string>();
  const snapshot = useFormFields(([fields]) => {
    const state = fields as FormState;
    return {
      badge: textValue(state, "badge"),
      description: textValue(state, "description"),
      featured: Boolean(state.featured?.value),
      fields: state,
      image: state.image?.value,
      priceFrom: numericValue(state, "priceFrom"),
      priceLabel: textValue(state, "priceLabel"),
      priceMode: textValue(state, "priceMode") || "request",
      shortTitle: textValue(state, "shortTitle"),
      summary: textValue(state, "summary"),
      title: textValue(state, "title")
    };
  });

  useEffect(() => {
    const direct = directImageUrl(snapshot.image);
    if (direct) {
      setResolvedImage(direct);
      return;
    }

    const id = relationId(snapshot.image);
    if (id === undefined) {
      setResolvedImage(undefined);
      return;
    }

    const controller = new AbortController();
    void fetch(`/api/media/${encodeURIComponent(String(id))}?depth=0`, {
      credentials: "same-origin",
      signal: controller.signal
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((media) => setResolvedImage(directImageUrl(media)))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResolvedImage(undefined);
        }
      });

    return () => controller.abort();
  }, [snapshot.image]);

  const readiness = useMemo(() => {
    const checks = [
      { done: Boolean(snapshot.title), label: "Название", weight: 12 },
      { done: hasValue(snapshot.fields, "category"), label: "Категория", weight: 10 },
      { done: Boolean(snapshot.summary), label: "Краткое описание", weight: 10 },
      { done: snapshot.description.length >= 120, label: "Подробное описание", weight: 10 },
      { done: hasValue(snapshot.fields, "image"), label: "Главное фото", weight: 18 },
      { done: hasNestedValue(snapshot.fields, "gallery"), label: "Галерея", weight: 12 },
      { done: hasNestedValue(snapshot.fields, "specs"), label: "Характеристики", weight: 10 },
      { done: hasNestedValue(snapshot.fields, "applications"), label: "Применение", weight: 6 },
      { done: hasValue(snapshot.fields, "operationMode"), label: "Тип работы", weight: 6 },
      {
        done:
          hasValue(snapshot.fields, "seoTitle") ||
          (snapshot.title.length >= 20 && snapshot.title.length <= 68),
        label: "Поиск",
        weight: 6
      }
    ];
    const score = checks.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
    return { checks, score };
  }, [snapshot]);

  const title = snapshot.shortTitle || snapshot.title || "Название товара";
  const summary =
    snapshot.summary ||
    "Краткое описание появится здесь и поможет проверить, как карточка будет выглядеть для клиента.";
  const price =
    snapshot.priceLabel ||
    (snapshot.priceMode === "fixed" && snapshot.priceFrom
      ? `от ${formatPrice(snapshot.priceFrom)}`
      : "Цена по запросу");

  return (
    <section className="product-live-preview" aria-label="Предпросмотр карточки товара">
      <div className="product-live-preview__toolbar">
        <div>
          <span><Sparkles size={16} /> Предпросмотр для клиента</span>
          <strong>Карточка обновляется по мере заполнения</strong>
        </div>
        <div className="product-live-preview__switch" role="group" aria-label="Вид предпросмотра">
          <button
            className={mode === "catalog" ? "is-active" : ""}
            type="button"
            onClick={() => setMode("catalog")}
          >
            <Monitor size={15} /> Каталог
          </button>
          <button
            className={mode === "mobile" ? "is-active" : ""}
            type="button"
            onClick={() => setMode("mobile")}
          >
            <Smartphone size={15} /> Телефон
          </button>
        </div>
      </div>

      <div className="product-live-preview__content">
        <div className={mode === "mobile" ? "product-preview-device is-mobile" : "product-preview-device"}>
          <article className="product-preview-card">
            <div className="product-preview-card__image">
              {resolvedImage ? (
                <img src={resolvedImage} alt="" />
              ) : (
                <span><ImageIcon size={27} /><small>Добавьте главное фото</small></span>
              )}
              {snapshot.featured ? <em>Рекомендуем</em> : null}
              {snapshot.badge ? <b>{snapshot.badge}</b> : null}
            </div>
            <div className="product-preview-card__copy">
              <small>КБ Парус · система хранения</small>
              <h3>{title}</h3>
              <p>{summary}</p>
              <strong>{price}</strong>
              <span>Подробнее о системе →</span>
            </div>
          </article>
        </div>

        <aside className="product-readiness">
          <div className="product-readiness__score">
            <div style={{ "--score": `${readiness.score}%` } as React.CSSProperties}>
              <strong>{readiness.score}</strong><small>/ 100</small>
            </div>
            <span>
              <b>Готовность карточки</b>
              <small>
                {readiness.score >= 85
                  ? "Можно публиковать"
                  : readiness.score >= 60
                    ? "Уже хорошо, остались детали"
                    : "Заполните ключевые блоки"}
              </small>
            </span>
          </div>
          <ul>
            {readiness.checks.map((check) => (
              <li className={check.done ? "is-done" : ""} key={check.label}>
                <Check size={13} /> {check.label}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
