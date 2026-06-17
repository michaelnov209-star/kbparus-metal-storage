"use client";

import { useEffect } from "react";

/**
 * Добавляет класс `is-scrolled` на `.line-header` после прокрутки страницы,
 * чтобы шапка получала более плотный фон с blur (premium-эффект).
 * Рендерит null — только навешивает scroll-слушатель.
 */
export function HeaderScroll() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".line-header");
    if (!header) return;

    const onScroll = () => {
      if (window.scrollY > 80) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
