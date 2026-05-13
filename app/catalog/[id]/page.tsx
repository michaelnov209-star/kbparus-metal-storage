import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardCheck, PackageCheck, Ruler, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { ImageLightbox } from "@/components/ImageLightbox";
import { LeadForm } from "@/components/LeadForm";
import { LinePageStyles } from "@/components/LinePageStyles";
import { formatRoundedRub } from "@/lib/calculator/format";
import { getCatalogCategories, getCatalogCategory, getRelatedCatalogCategories } from "@/lib/cms/catalog";
import { getSiteNavigation, type SiteLink } from "@/lib/cms/site-navigation";
import { getCatalogProductsByCategory } from "@/lib/cms/products";
import { JsonLd, breadcrumbSchema, itemListSchema, SITE_URL } from "@/lib/seo/schema";

export const revalidate = 60;

function toAbsoluteUrl(value: string) {
  return value.startsWith("http") ? value : `${SITE_URL}${value}`;
}

function linkTargetProps(link: SiteLink) {
  return link.openInNewTab ? { target: "_blank", rel: "noreferrer" } : {};
}

export async function generateStaticParams() {
  const categories = await getCatalogCategories();
  return categories.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getCatalogCategory(id);
  if (!item) return { title: "Каталог" };

  const url = `${SITE_URL}/catalog/${item.id}`;
  const ogImage = item.ogImage ?? item.image;
  const absoluteOgImage = toAbsoluteUrl(ogImage);

  return {
    title: item.seoTitle ?? item.title,
    description: item.seoDescription ?? item.summary,
    keywords: item.keywords && item.keywords.length > 0 ? item.keywords : undefined,
    alternates: { canonical: url },
    robots: item.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: `${item.seoTitle ?? item.title} | КБ Парус`,
      description: item.seoDescription ?? item.summary,
      url,
      type: "website",
      images: [{ url: absoluteOgImage, alt: item.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${item.seoTitle ?? item.title} | КБ Парус`,
      description: item.seoDescription ?? item.summary,
      images: [absoluteOgImage]
    }
  };
}

export default async function CatalogCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getCatalogCategory(id);
  if (!item) notFound();

  const products = await getCatalogProductsByCategory(item.id);
  const isPilotCategory = products.length > 0;
  const related = await getRelatedCatalogCategories(item.id, 4);
  const navigation = await getSiteNavigation();

  const categoryUrl = `${SITE_URL}/catalog/${item.id}`;
  const breadcrumb = breadcrumbSchema([
    { name: "Главная", url: SITE_URL },
    { name: "Каталог", url: `${SITE_URL}/#catalog` },
    { name: item.title, url: categoryUrl }
  ]);
  const productList =
    products.length > 0
      ? itemListSchema(
          products.map((product) => ({
            name: product.title,
            url: `${SITE_URL}/catalog/${item.id}/${product.id}`,
            image: toAbsoluteUrl(product.image)
          }))
        )
      : null;

  return (
    <main className="line-page catalog-detail-page" id="top">
      <LinePageStyles />
      <JsonLd data={breadcrumb} />
      {productList && <JsonLd data={productList} />}
      <header className="catalog-detail-header">
        <BrandMark />
        <nav aria-label="Навигация по разделу">
          <a href="/"><ArrowLeft size={16} /> На главную</a>
          {navigation.header.detailLinks.map((link) => (
            <a href={link.href} key={`${link.label}-${link.href}`} {...linkTargetProps(link)}>{link.label}</a>
          ))}
        </nav>
      </header>

      <div className="product-breadcrumbs">
        <a href="/">Главная</a>
        <ArrowRight size={14} />
        <a href="/#catalog">Каталог</a>
        <ArrowRight size={14} />
        <span>{item.title}</span>
      </div>

      <section className={isPilotCategory ? "catalog-detail-hero is-assortment" : "catalog-detail-hero"}>
        <div>
          <span className="line-kicker">Раздел каталога</span>
          <h1>{item.title}</h1>
          <p>{item.summary}</p>
          <p>{item.scenario}</p>
          <div className="catalog-detail-actions">
            <a className="line-primary" href={isPilotCategory ? "#assortment" : "/#calculator"}>
              {isPilotCategory ? "Смотреть ассортимент" : "Рассчитать стоимость"} <ArrowRight size={18} />
            </a>
            <a className="line-secondary" href="#category-request">Связаться с инженером</a>
          </div>
        </div>
        <ImageLightbox src={item.image} alt={item.title} className="catalog-detail-image" />
      </section>

      {isPilotCategory ? (
        <>
          <section className="assortment-section" id="assortment">
            <div className="assortment-headline">
              <span className="line-kicker">Ассортимент</span>
              <h2>{item.title}</h2>
              <p>Выберите готовое решение или оставьте заявку — инженер подберёт конфигурацию под ваши размеры, нагрузку и способ загрузки.</p>
            </div>
            <div className="assortment-grid">
              {products.map((product) => (
                <a className="assortment-card" href={`/catalog/${item.id}/${product.id}`} key={product.id}>
                  <div className="assortment-visual">
                    <img src={product.image} alt={product.title} />
                  </div>
                  <div className="assortment-copy">
                    <h4>{product.title}</h4>
                    <p>{product.summary}</p>
                    <strong>
                      {product.pageMode === "configurator"
                        ? "Рассчитать в конфигураторе"
                        : product.priceMode === "fixed" && product.priceFrom
                          ? `от ${formatRoundedRub(product.priceFrom)}`
                          : "Цена по запросу"}
                    </strong>
                    <b>Перейти в товар <ArrowRight size={16} /></b>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="catalog-detail-content" id="category-request">
          <div className="catalog-detail-card">
            <h2>Что уточним для подбора</h2>
            <ul>
              <li>Материал, который нужно хранить: лист, труба, профиль, сортовой прокат или смешанные позиции.</li>
              <li>Максимальные габариты, вес пачки и желаемую вместимость системы.</li>
              <li>Способ загрузки: погрузчик, кран-балка или ручная работа.</li>
              <li>Ограничения помещения: высоту, проходы, ворота, колонны и зону обслуживания.</li>
            </ul>
          </div>

          <aside className="catalog-detail-card">
            <h2>Что получите</h2>
            <ul>
              <li><Ruler size={18} /> Рекомендованные габариты и конфигурацию.</li>
              <li><ShieldCheck size={18} /> Проверку нагрузки и запаса прочности.</li>
              <li><ClipboardCheck size={18} /> Стартовую стоимость в формате «от».</li>
            </ul>
          </aside>

          <div className="catalog-detail-card">
            <h2>Похожие разделы</h2>
            <div className="related-grid">
              {related.map((relatedItem) => (
                <a href={`/catalog/${relatedItem.id}`} key={relatedItem.id}>
                  <img src={relatedItem.image} alt={relatedItem.title} />
                  {relatedItem.title}
                </a>
              ))}
            </div>
          </div>

          <LeadForm
            title="Получить расчет по разделу"
            sourceTitle={item.title}
            sourceUrl={categoryUrl}
            sourceImage={item.image}
          />
        </section>
      )}

      {isPilotCategory && (
        <section className="catalog-detail-content" id="category-request">
          <aside className="catalog-detail-card">
            <h2>Что получает инженер</h2>
            <ul>
              <li><PackageCheck size={18} /> выбранную товарную позицию или конфигурацию;</li>
              <li><Ruler size={18} /> габариты, нагрузку, количество полок и башен;</li>
              <li><ShieldCheck size={18} /> опции, город поставки и комментарий клиента.</li>
            </ul>
          </aside>
          <LeadForm
            title="Не нашли нужную систему в разделе?"
            sourceTitle={item.title}
            sourceUrl={categoryUrl}
            sourceImage={item.image}
          />
        </section>
      )}
    </main>
  );
}
