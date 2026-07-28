"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Maximize2, X } from "lucide-react";
import type { ExcelHomeCatalogItem } from "@/data/storageSystems/excelCatalog";

const CATALOG_CARD_SIZES =
  "(max-width: 640px) 38vw, (max-width: 900px) calc(50vw - 28px), (max-width: 1180px) calc(33.333vw - 32px), calc(25vw - 32px)";

function hasResponsiveCatalogImageVariants(
  item: ExcelHomeCatalogItem
): item is ExcelHomeCatalogItem & {
  imageThumb: string;
  imageMedium: string;
  imageLarge: string;
} {
  return Boolean(
    item.imageThumb &&
      item.imageMedium &&
      item.imageLarge &&
      new Set([item.imageThumb, item.imageMedium, item.imageLarge]).size === 3
  );
}

function getCatalogBadge(id: string) {
  if (id.includes("auto") || id.includes("automated")) return "Автоматизация";
  if (id.includes("manual")) return "Ручная система";
  if (id.includes("pipe") || id.includes("cantilever")) return "Трубы и профиль";
  if (id.includes("warehouse") || id.includes("erp")) return "Склад и учет";
  if (id.includes("lifting")) return "Подача и подъем";
  return "Категория";
}

export function CatalogGrid({ items }: { items: ExcelHomeCatalogItem[] }) {
  const [activeItem, setActiveItem] = useState<ExcelHomeCatalogItem | null>(null);

  useEffect(() => {
    if (!activeItem) return;

    function closeByEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveItem(null);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeByEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeByEscape);
    };
  }, [activeItem]);

  return (
    <>
      <div className="catalog-grid">
        {items.map((item, index) => (
          <article className="catalog-card reveal" key={item.id}>
            <div className="catalog-card-visual has-image">
              <a className="catalog-image-link" href={`/catalog/${item.id}`} aria-label={`Перейти в категорию: ${item.title}`}>
                {hasResponsiveCatalogImageVariants(item) ? (
                  <img
                    className="catalog-image-main"
                    src={item.imageMedium}
                    srcSet={`${item.imageThumb} 320w, ${item.imageMedium} 640w, ${item.imageLarge} 960w`}
                    sizes={CATALOG_CARD_SIZES}
                    width={960}
                    height={720}
                    alt={item.imageAlt ?? item.title}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                  />
                ) : (
                  <Image
                    className="catalog-image-main"
                    src={item.imageMedium ?? item.image}
                    alt={item.imageAlt ?? item.title}
                    fill
                    sizes={CATALOG_CARD_SIZES}
                    style={{ objectFit: "contain" }}
                    loading="lazy"
                    quality={75}
                  />
                )}
              </a>
              <button
                className="catalog-zoom-pill catalog-zoom-trigger"
                type="button"
                onClick={() => setActiveItem(item)}
                aria-label={`Увеличить изображение: ${item.title}`}
              >
                <Maximize2 size={16} />
                Увеличить
              </button>
            </div>
            <a className="catalog-card-body" href={`/catalog/${item.id}`}>
              <div className="catalog-card-meta">
                <small>{getCatalogBadge(item.id)}</small>
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>{item.title}</h3>
              <b>
                Перейти в категорию <ArrowRight size={16} />
              </b>
            </a>
          </article>
        ))}
      </div>

      {activeItem ? (
        <div className="catalog-lightbox" role="dialog" aria-modal="true" aria-label={activeItem.title} onClick={() => setActiveItem(null)}>
          <div className="catalog-lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <button className="catalog-lightbox-close" type="button" onClick={() => setActiveItem(null)} aria-label="Закрыть просмотр">
              <X size={22} />
            </button>
            <div className="catalog-lightbox-visual">
              <img
                src={activeItem.imageLarge ?? activeItem.image}
                alt={activeItem.imageAlt ?? activeItem.title}
                loading="eager"
                decoding="async"
                width={960}
                height={720}
              />
            </div>
            <div className="catalog-lightbox-copy">
              <span>{getCatalogBadge(activeItem.id)}</span>
              <h3>{activeItem.title}</h3>
              <p>{activeItem.scenario}</p>
              <a className="line-primary" href={`/catalog/${activeItem.id}`}>
                Перейти в категорию <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
