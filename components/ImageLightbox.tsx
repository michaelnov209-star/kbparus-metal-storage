"use client";

import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";

export function ImageLightbox({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

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
    <>
      <div className={className ? `image-lightbox-card ${className}` : "image-lightbox-card"}>
        <img src={src} alt={alt} />
        <button className="image-lightbox-open" type="button" onClick={() => setIsOpen(true)} aria-label={`Увеличить изображение: ${alt}`}>
          <Maximize2 size={16} />
          Увеличить
        </button>
      </div>

      {isOpen ? (
        <div className="catalog-lightbox image-lightbox-dialog" role="dialog" aria-modal="true" aria-label={alt} onClick={() => setIsOpen(false)}>
          <div className="catalog-lightbox-panel image-lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <button className="catalog-lightbox-close" type="button" onClick={() => setIsOpen(false)} aria-label="Закрыть просмотр">
              <X size={22} />
            </button>
            <div className="catalog-lightbox-visual">
              <img src={src} alt={alt} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
