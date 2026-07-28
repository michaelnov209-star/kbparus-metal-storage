"use client";

import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  className?: string;
  srcSet?: string;
  sizes?: string;
  largeSrc?: string;
}

export function ImageLightbox({
  src,
  alt,
  className,
  srcSet,
  sizes,
  largeSrc
}: ImageLightboxProps) {
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
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width={960}
          height={720}
        />
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
              <img
                src={largeSrc ?? src}
                alt={alt}
                decoding="async"
                width={1440}
                height={1080}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
