"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Menu, PhoneCall, Search, X } from "lucide-react";

interface MobileMenuLink {
  label: string;
  href: string;
  openInNewTab?: boolean;
}

interface MobileMenuCategory {
  id: string;
  title: string;
}

interface MobileMenuPhone {
  label: string;
  href: string;
}

interface MobileMenuProps {
  catalogLabel: string;
  catalogHref: string;
  categories: MobileMenuCategory[];
  links: MobileMenuLink[];
  phones: MobileMenuPhone[];
}

/**
 * Мобильное бургер-меню. На планшетах и телефонах десктопная навигация скрыта (CSS),
 * поэтому без этого меню разделы/каталог были недоступны с телефона.
 * Кнопка-гамбургер открывает overlay со списком категорий, разделов и телефонов.
 */
export function MobileMenu({ catalogLabel, catalogHref, categories, links, phones }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const dialogId = useId();
  const catalogId = useId();

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru");
    if (!normalizedQuery) return categories;

    return categories.filter((category) =>
      category.title.toLocaleLowerCase("ru").includes(normalizedQuery)
    );
  }, [categories, query]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("button")?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      window.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    setCatalogOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="mobile-menu-burger"
        aria-label="Открыть меню"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => setOpen(true)}
      >
        <Menu size={22} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          className="mobile-menu-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Меню сайта"
          id={dialogId}
          onClick={closeMenu}
        >
          <nav
            ref={panelRef}
            className="mobile-menu-panel"
            aria-label="Мобильная навигация"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-menu-head">
              <strong>Меню</strong>
              <button type="button" className="mobile-menu-close" aria-label="Закрыть меню" onClick={closeMenu}>
                <X size={22} />
              </button>
            </div>

            {links.length > 0 && (
              <div className="mobile-menu-links mobile-menu-primary-links">
                {links.map((link) => (
                  <a
                    key={`${link.label}-${link.href}`}
                    href={link.href}
                    onClick={closeMenu}
                    {...(link.openInNewTab ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}

            <section className="mobile-menu-catalog" aria-labelledby={`${catalogId}-title`}>
              <button
                type="button"
                className="mobile-menu-catalog-title"
                id={`${catalogId}-title`}
                aria-expanded={catalogOpen}
                aria-controls={catalogId}
                onClick={() => setCatalogOpen((current) => !current)}
              >
                <span>
                  {catalogLabel}
                  <small>{categories.length} разделов</small>
                </span>
                <ChevronDown size={19} aria-hidden="true" />
              </button>

              {catalogOpen && (
                <div className="mobile-menu-catalog-body" id={catalogId}>
                  <label className="mobile-menu-search">
                    <Search size={18} aria-hidden="true" />
                    <span className="visually-hidden">Найти раздел каталога</span>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Найти оборудование"
                      autoComplete="off"
                    />
                  </label>

                  <a className="mobile-menu-catalog-all" href={catalogHref} onClick={closeMenu}>
                    Весь каталог
                    <ChevronRight size={16} />
                  </a>

                  <div className="mobile-menu-categories">
                    {filteredCategories.map((category) => (
                      <a key={category.id} href={`/catalog/${category.id}`} onClick={closeMenu}>
                        <span>{category.title}</span>
                        <ChevronRight size={16} />
                      </a>
                    ))}
                    {filteredCategories.length === 0 && (
                      <p className="mobile-menu-empty">Ничего не найдено. Попробуйте другое слово.</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {phones.length > 0 && (
              <div className="mobile-menu-phones">
                {phones.map((phone) => (
                  <a key={phone.href} href={phone.href} data-metrika-goal="phone_click" onClick={closeMenu}>
                    <PhoneCall size={17} />
                    {phone.label}
                  </a>
                ))}
              </div>
            )}
          </nav>
        </div>,
        document.body
      )}
    </>
  );
}
