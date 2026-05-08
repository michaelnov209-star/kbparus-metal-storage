"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function ProductGallery({ images, title, badge }: { images: string[]; title: string; badge?: string }) {
  const gallery = images.length > 0 ? images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = gallery[activeIndex] ?? "";

  const goPrev = () => setActiveIndex((current) => (current === 0 ? gallery.length - 1 : current - 1));
  const goNext = () => setActiveIndex((current) => (current === gallery.length - 1 ? 0 : current + 1));

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        {badge ? <span className="product-gallery-badge">{badge}</span> : null}
        {gallery.length > 1 && (
          <span className="product-gallery-count">
            {activeIndex + 1} / {gallery.length}
          </span>
        )}
        {activeImage ? <img src={activeImage} alt={`${title} - фото ${activeIndex + 1}`} /> : null}
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
    </div>
  );
}
