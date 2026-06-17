"use client";

import { useEffect, useState } from "react";
import { Menu, X, ChevronRight, PhoneCall } from "lucide-react";

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
 * Мобильное бургер-меню. На ≤760px десктопная навигация скрыта (CSS),
 * поэтому без этого меню разделы/каталог были недоступны с телефона.
 * Кнопка-гамбургер открывает overlay со списком категорий, разделов и телефонов.
 */
export function MobileMenu({ catalogLabel, catalogHref, categories, links, phones }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="mobile-menu-burger"
        aria-label="Открыть меню"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="mobile-menu-overlay" role="dialog" aria-modal="true" aria-label="Меню сайта" onClick={() => setOpen(false)}>
          <nav className="mobile-menu-panel" aria-label="Мобильная навигация" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-menu-head">
              <strong>Меню</strong>
              <button type="button" className="mobile-menu-close" aria-label="Закрыть меню" onClick={() => setOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <a className="mobile-menu-catalog-title" href={catalogHref} onClick={() => setOpen(false)}>
              {catalogLabel}
            </a>
            <div className="mobile-menu-categories">
              {categories.map((category) => (
                <a key={category.id} href={`/catalog/${category.id}`} onClick={() => setOpen(false)}>
                  <span>{category.title}</span>
                  <ChevronRight size={16} />
                </a>
              ))}
            </div>

            {links.length > 0 && (
              <div className="mobile-menu-links">
                {links.map((link) => (
                  <a
                    key={`${link.label}-${link.href}`}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    {...(link.openInNewTab ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}

            {phones.length > 0 && (
              <div className="mobile-menu-phones">
                {phones.map((phone) => (
                  <a key={phone.href} href={phone.href} data-metrika-goal="phone_click">
                    <PhoneCall size={17} />
                    {phone.label}
                  </a>
                ))}
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
