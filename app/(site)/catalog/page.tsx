import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Factory,
  Ruler,
  ShieldCheck
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { CatalogGrid } from "@/components/CatalogGrid";
import { getCatalogCategories } from "@/lib/cms/catalog";
import {
  JsonLd,
  breadcrumbSchema,
  itemListSchema,
  SITE_URL
} from "@/lib/seo/schema";
import {
  SOCIAL_PREVIEW_ALT,
  SOCIAL_PREVIEW_PATH,
  SOCIAL_PREVIEW_SIZE
} from "@/lib/seo/social-preview";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Каталог систем хранения металла для производства и склада",
  description:
    "Системы хранения листового металла, труб, профиля, рулонов и складской логистики. Подбор оборудования КБ Парус под нагрузку, габариты и способ загрузки.",
  alternates: {
    canonical: `${SITE_URL}/catalog`
  },
  openGraph: {
    title: "Каталог систем хранения металла | КБ Парус",
    description:
      "Промышленные системы хранения металла: от ручных стеллажей до автоматизированных складов.",
    url: `${SITE_URL}/catalog`,
    type: "website",
    images: [
      {
        url: new URL(SOCIAL_PREVIEW_PATH, SITE_URL).toString(),
        width: SOCIAL_PREVIEW_SIZE.width,
        height: SOCIAL_PREVIEW_SIZE.height,
        alt: SOCIAL_PREVIEW_ALT
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Каталог систем хранения металла | КБ Парус",
    description:
      "Подбор промышленных систем хранения листа, труб, профиля и складских грузов.",
    images: [new URL(SOCIAL_PREVIEW_PATH, SITE_URL).toString()]
  }
};

export default async function CatalogPage() {
  const categories = await getCatalogCategories();
  const catalogUrl = `${SITE_URL}/catalog`;

  return (
    <main className="line-page catalog-detail-page catalog-index-page" id="top">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Главная", url: SITE_URL },
          { name: "Каталог", url: catalogUrl }
        ])}
      />
      <JsonLd
        data={itemListSchema(
          categories.map((category) => ({
            name: category.title,
            url: `${catalogUrl}/${category.id}`,
            image: category.image.startsWith("http")
              ? category.image
              : `${SITE_URL}${category.image}`
          }))
        )}
      />

      <header className="catalog-detail-header">
        <BrandMark />
        <nav aria-label="Навигация по каталогу">
          <a href="/">
            <ArrowLeft size={16} /> На главную
          </a>
          <a href="/#calculator">Калькулятор</a>
          <a href="/#contacts">Связаться с инженером</a>
        </nav>
      </header>

      <div className="product-breadcrumbs">
        <a href="/">Главная</a>
        <ArrowRight size={14} />
        <span>Каталог систем хранения</span>
      </div>

      <section className="catalog-index-hero">
        <div>
          <span className="line-kicker">Каталог оборудования</span>
          <h1>Системы хранения металла для производства и склада</h1>
          <p>
            Подберите решение под материал, вес, размеры помещения и способ загрузки.
            Если готовой конфигурации недостаточно, инженер рассчитает систему под ваш объект.
          </p>
          <div className="catalog-detail-actions">
            <a className="line-primary" href="#catalog-sections">
              Смотреть разделы <ArrowRight size={18} />
            </a>
            <a className="line-secondary" href="/#calculator">
              Рассчитать стоимость
            </a>
          </div>
        </div>

        <aside className="catalog-index-proof" aria-label="Что входит в подбор">
          <span>
            <Ruler size={19} />
            Габариты и вместимость
          </span>
          <span>
            <ShieldCheck size={19} />
            Нагрузка и запас прочности
          </span>
          <span>
            <Factory size={19} />
            Способ загрузки и логистика
          </span>
          <strong>
            <BadgeCheck size={20} />
            Инженерная проверка конфигурации
          </strong>
        </aside>
      </section>

      <section className="catalog-index-content" id="catalog-sections">
        <div className="section-title-row is-single">
          <div>
            <span className="line-kicker">Все направления</span>
            <h2>Выберите, что нужно хранить</h2>
            <p>
              Категории собраны по реальным задачам: листовой металл, трубы и профиль,
              рулоны, длинномерные материалы, паллеты, кабель и управление складом.
            </p>
          </div>
        </div>

        <div className="catalog-summary">
          <article>
            <strong>{categories.length} разделов</strong>
            <span>от ручных систем до автоматизированного склада</span>
          </article>
          <article>
            <strong>Под задачу</strong>
            <span>материал, нагрузка, габариты и способ перемещения</span>
          </article>
          <article>
            <strong>С расчётом</strong>
            <span>инженер проверяет конфигурацию перед предложением</span>
          </article>
        </div>

        <CatalogGrid items={categories} />
      </section>

      <section className="catalog-index-expertise">
        <article>
          <Boxes size={24} />
          <h2>Подбор системы</h2>
          <p>
            Сопоставляем номенклатуру, оборачиваемость и доступное место, чтобы склад
            не терял площадь и время на перемещение.
          </p>
        </article>
        <article>
          <Ruler size={24} />
          <h2>Инженерный расчёт</h2>
          <p>
            Учитываем массу пачки, высоту помещения, проходы, технику и требования
            к загрузке каждой ячейки.
          </p>
        </article>
        <article>
          <Factory size={24} />
          <h2>Внедрение</h2>
          <p>
            Готовим конфигурацию, производство, поставку и интеграцию оборудования
            в действующую складскую логистику.
          </p>
        </article>
      </section>

      <section className="catalog-index-cta">
        <div>
          <span className="line-kicker">Не уверены в категории?</span>
          <h2>Опишите материал и склад — инженер предложит вариант</h2>
        </div>
        <a className="line-primary" href="/#contacts">
          Получить консультацию <ArrowRight size={18} />
        </a>
      </section>
    </main>
  );
}
