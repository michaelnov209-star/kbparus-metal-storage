"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Maximize2, X } from "lucide-react";
import type { ExcelHomeCatalogItem } from "@/data/storageSystems/excelCatalog";

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
            <button
              className="catalog-card-visual has-image catalog-zoom-trigger"
              type="button"
              onClick={() => setActiveItem(item)}
              aria-label={`Рассмотреть изображение: ${item.title}`}
            >
              <img className="catalog-image-backdrop" src={item.image} alt="" aria-hidden="true" />
              <img className="catalog-image-main" src={item.image} alt={item.title} />
              <span className="catalog-zoom-pill">
                <Maximize2 size={16} />
                Рассмотреть
              </span>
            </button>
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
            <img src={activeItem.image} alt={activeItem.title} />
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
