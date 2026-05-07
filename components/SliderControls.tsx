"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

export function SliderControls({ targetId, label }: { targetId: string; label: string }) {
  function scroll(direction: "left" | "right") {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.scrollBy({
      left: direction === "right" ? 520 : -520,
      behavior: "smooth"
    });
  }

  return (
    <div className="slider-arrows" aria-label={label}>
      <button type="button" onClick={() => scroll("left")} aria-label="Листать назад">
        <ArrowLeft size={24} />
      </button>
      <button type="button" onClick={() => scroll("right")} aria-label="Листать вперед">
        <ArrowRight size={24} />
      </button>
    </div>
  );
}
