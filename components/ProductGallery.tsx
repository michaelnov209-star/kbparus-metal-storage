"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

export function ProductGallery({ images, title, badge }: { images: string[]; title: string; badge?: string }) {
  const gallery = images.length > 0 ? images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const activeImage = gallery[activeIndex] ?? "";

  const goPrev = () => setActiveIndex((current) => (current === 0 ? gallery.length - 1 : current - 1));
  const goNext = () => setActiveIndex((current) => (current === gallery.length - 1 ? 0 : current + 1));

  useEffect(() => {
    if (!isOpen) return;

    function closeByEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeByEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeByEscape);
    };
  }, [isOpen]);

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        {badge ? <span className="product-gallery-badge">{badge}</span> : null}
        {gallery.length > 1 && (
          <span className="product-gallery-count">
            {activeIndex + 1} / {gallery.length}
          </span>
        )}
        {activeImage ? (
          <button className="product-gallery-open" type="button" onClick={() => setIsOpen(true)} aria-label={`Рассмотреть фото: ${title}`}>
            <img className="product-gallery-backdrop" src={activeImage} alt="" aria-hidden="true" />
            <img className="product-gallery-image" src={activeImage} alt={`${title} - фото ${activeIndex + 1}`} />
            <span className="product-gallery-zoom">
              <Maximize2 size={16} />
              Увеличить
            </span>
          </button>
        ) : null}
        {gallery.length > 1 && (
          <div className="product-gallery-arrows" aria-label="Листать фотографии товара">
            <button type="button" onClick={goPrev} aria-label="Предыдущее фото">
              <ChevronLeft size={22} />
            </button>
            <button type="button" onClick={goNext} aria-label="Следующее фото">
              <ChevronRight size={22} />
            </button>
          </div>
        )}
      </div>
      {gallery.length > 1 && (
        <div className="product-gallery-thumbs" aria-label="Миниатюры фотографий товара">
          {gallery.map((image, index) => (
            <button
              className={index === activeIndex ? "is-active" : ""}
              type="button"
              key={image}
              onClick={() => setActiveIndex(index)}
              aria-label={`Открыть фото ${index + 1}`}
            >
              <img src={image} alt="" />
            </button>
          ))}
        </div>
      )}
      {isOpen && activeImage ? (
        <div className="product-gallery-lightbox" role="dialog" aria-modal="true" aria-label={title} onClick={() => setIsOpen(false)}>
          <div className="product-gallery-lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <button className="product-gallery-lightbox-close" type="button" onClick={() => setIsOpen(false)} aria-label="Закрыть просмотр">
              <X size={22} />
            </button>
            <img src={activeImage} alt={`${title} - крупное фото ${activeIndex + 1}`} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
