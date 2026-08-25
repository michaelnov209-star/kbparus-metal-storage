"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_SELECTOR = ".reveal";

export function ScrollMotion() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)
    );
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    root.classList.add("motion-ready");

    elements.forEach((element) => {
      const siblings = element.parentElement
        ? Array.from(element.parentElement.children).filter((child) =>
            child.classList.contains("reveal")
          )
        : [];
      const siblingIndex = siblings.indexOf(element);
      const columns = window.matchMedia("(max-width: 760px)").matches ? 2 : 4;

      element.style.setProperty(
        "--reveal-order",
        String(siblingIndex < 0 ? 0 : siblingIndex % columns)
      );
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.1
      }
    );

    const frame = window.requestAnimationFrame(() => {
      elements.forEach((element) => observer.observe(element));
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      root.classList.remove("motion-ready");
      elements.forEach((element) => {
        element.classList.remove("is-visible");
        element.style.removeProperty("--reveal-order");
      });
    };
  }, [pathname]);

  return null;
}
