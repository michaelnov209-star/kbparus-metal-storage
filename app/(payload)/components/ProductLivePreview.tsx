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
import { getProductPriceLabel } from "@/lib/catalog/product-price";
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
  if (object.value && object.value !== value) return relationId(object.value);
  return undefined;
}

function directImageUrl(value: unknown): string | undefined {
  if (typeof value === "string" && (value.startsWith("/") || value.startsWith("http"))) {
    return value;
  }
  if (!value || typeof value !== "object") return undefined;
  const object = value as {
    internalTitle?: unknown;
    url?: unknown;
    thumbnailURL?: unknown;
    value?: unknown;
    sizes?: { cardMd?: { url?: unknown }; medium?: { url?: unknown } };
  };
  const legacyPrefix = "Legacy asset:";
  if (
    typeof object.internalTitle === "string" &&
    object.internalTitle.startsWith(legacyPrefix)
  ) {
    const legacyPath = object.internalTitle.slice(legacyPrefix.length).trim();
    if (legacyPath.startsWith("/") && !legacyPath.startsWith("//")) {
      return legacyPath;
    }
    return typeof object.url === "string" &&
      (object.url.startsWith("/") || object.url.startsWith("http"))
      ? object.url
      : undefined;
  }
  const candidates = [
    object.sizes?.cardMd?.url,
    object.sizes?.medium?.url,
    object.thumbnailURL,
    object.url
  ];
  const candidate = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && (candidate.startsWith("/") || candidate.startsWith("http"))
  );
  return candidate ?? (object.value && object.value !== value
    ? directImageUrl(object.value)
    : undefined);
}

function galleryImageValues(fields: FormState) {
  return Object.entries(fields)
    .map(([path, field]) => {
      const match = /^gallery\.(\d+)\.image$/.exec(path);
      return match ? { index: Number(match[1]), value: field.value } : undefined;
    })
    .filter(
      (item): item is { index: number; value: unknown } =>
        Boolean(item) && item!.value !== undefined && item!.value !== null
    )
    .sort((a, b) => a.index - b.index)
    .map((item) => item.value);
}

function imageValueKey(value: unknown) {
  return directImageUrl(value) ?? relationId(value)?.toString() ?? "";
}

function uniqueSecondaryImageValues(values: unknown[], primary: unknown) {
  const primaryKey = imageValueKey(primary);
  const seen = new Set<string>();

  return values
    .filter((value) => {
      const key = imageValueKey(value);
      if (!key || key === primaryKey || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

async function resolveImageValue(value: unknown, signal: AbortSignal) {
  const direct = directImageUrl(value);
  if (direct) return direct;

  const id = relationId(value);
  if (id === undefined) return undefined;

  const response = await fetch(`/api/media/${encodeURIComponent(String(id))}?depth=0`, {
    credentials: "same-origin",
    signal
  });
  if (!response.ok) return undefined;
  return directImageUrl(await response.json());
}

export function ProductLivePreview() {
  const [mode, setMode] = useState<PreviewMode>("catalog");
  const [resolvedImage, setResolvedImage] = useState<string>();
  const [resolvedGallery, setResolvedGallery] = useState<string[]>([]);
  const snapshot = useFormFields(([fields]) => {
    const state = fields as FormState;
    const image = state.image?.value;
    const galleryImages = uniqueSecondaryImageValues(
      galleryImageValues(state),
      image
    );
    return {
      badge: textValue(state, "badge"),
      description: textValue(state, "description"),
      featured: Boolean(state.featured?.value),
      fields: state,
      galleryImages,
      galleryKey: galleryImages.map(imageValueKey).join("|"),
      image,
      imageKey: imageValueKey(image),
      priceFrom: numericValue(state, "priceFrom"),
      priceLabel: textValue(state, "priceLabel"),
      priceMode: textValue(state, "priceMode") || "request",
      priceTo: numericValue(state, "priceTo"),
      shortTitle: textValue(state, "shortTitle"),
      summary: textValue(state, "summary"),
      title: textValue(state, "title")
    };
  });
  const selectedImage = useMemo(
    () => snapshot.image,
    [snapshot.imageKey]
  );
  const selectedGallery = useMemo(
    () => snapshot.galleryImages,
    [snapshot.galleryKey]
  );

  useEffect(() => {
    if (!snapshot.imageKey) {
      setResolvedImage(undefined);
      return;
    }

    const controller = new AbortController();
    void resolveImageValue(selectedImage, controller.signal)
      .then(setResolvedImage)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResolvedImage(undefined);
        }
      });

    return () => controller.abort();
  }, [selectedImage, snapshot.imageKey]);

  useEffect(() => {
    if (!snapshot.galleryKey) {
      setResolvedGallery([]);
      return;
    }

    const controller = new AbortController();
    void Promise.all(
      selectedGallery.map((value) =>
        resolveImageValue(value, controller.signal)
      )
    )
      .then((images) =>
        setResolvedGallery(images.filter((image): image is string => Boolean(image)))
      )
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResolvedGallery([]);
        }
      });

    return () => controller.abort();
  }, [selectedGallery, snapshot.galleryKey]);

  const readiness = useMemo(() => {
    const checks = [
      { done: Boolean(snapshot.title), label: "Название", weight: 12 },
      { done: hasValue(snapshot.fields, "category"), label: "Категория", weight: 10 },
      { done: Boolean(snapshot.summary), label: "Краткое описание", weight: 10 },
      { done: snapshot.description.length >= 120, label: "Подробное описание", weight: 10 },
      { done: hasValue(snapshot.fields, "image"), label: "Главное фото", weight: 18 },
      { done: hasNestedValue(snapshot.fields, "gallery"), label: "Дополнительные фото", weight: 12 },
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
  const price = getProductPriceLabel({
    priceFrom: snapshot.priceFrom,
    priceLabel: snapshot.priceLabel,
    priceMode: snapshot.priceMode === "fixed" ? "fixed" : "request",
    priceTo: snapshot.priceTo
  });

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
            <div className="product-preview-card__media">
              <div className="product-preview-card__image">
                {resolvedImage ? (
                  <img src={resolvedImage} alt="" />
                ) : (
                  <span><ImageIcon size={27} /><small>Добавьте главное фото</small></span>
                )}
                {snapshot.featured ? <em>Рекомендуем</em> : null}
                {snapshot.badge ? <b>{snapshot.badge}</b> : null}
              </div>
              <div
                className="product-preview-card__thumbs"
                aria-label="Главное фото и галерея товара"
              >
                <span className={resolvedImage ? "is-filled is-primary" : "is-primary"}>
                  {resolvedImage ? <img src={resolvedImage} alt="" /> : <ImageIcon size={15} />}
                  <small>Главное</small>
                </span>
                {resolvedGallery.map((image, index) => (
                  <span className="is-filled" key={`${image}-${index}`}>
                    <img src={image} alt="" />
                    <small>Фото {index + 1}</small>
                  </span>
                ))}
                {resolvedGallery.length === 0 ? (
                  <span>
                    <ImageIcon size={15} />
                    <small>Ракурсы</small>
                  </span>
                ) : null}
              </div>
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
