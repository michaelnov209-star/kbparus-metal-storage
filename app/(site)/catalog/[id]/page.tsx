import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardCheck, PackageCheck, Ruler, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { ImageLightbox } from "@/components/ImageLightbox";
import { LeadForm } from "@/components/LeadForm";
import type { CatalogProduct } from "@/data/storageSystems/catalogDepth";
import { categorySeoGuides } from "@/data/storageSystems/categorySeoGuides";
import { getProductPriceLabel } from "@/lib/catalog/product-price";
import { getCatalogCategories, getCatalogCategory, getRelatedCatalogCategories } from "@/lib/cms/catalog";
import { getSiteNavigation, type SiteLink } from "@/lib/cms/site-navigation";
import { getLocalProductImageVariants } from "@/lib/cms/product-image-variants";
import { getCatalogProductsByCategory } from "@/lib/cms/products";
import { buildImageSrcSet } from "@/lib/media/srcset";
import { JsonLd, breadcrumbSchema, itemListSchema, SITE_URL } from "@/lib/seo/schema";
import { pluralRu } from "@/lib/text/russian-plural";

export const revalidate = 60;

function toAbsoluteUrl(value: string) {
  return value.startsWith("http") ? value : `${SITE_URL}${value}`;
}

function linkTargetProps(link: SiteLink) {
  return link.openInNewTab ? { target: "_blank", rel: "noreferrer" } : {};
}

function getAssortmentImage(product: CatalogProduct) {
  const localVariants = getLocalProductImageVariants(product.image);
  return {
    src: product.imageMedium ?? localVariants?.medium.src ?? product.image,
    srcSet: localVariants
      ? buildImageSrcSet(Object.values(localVariants))
      : buildImageSrcSet([
          { src: product.imageThumb, width: 320 },
          { src: product.imageMedium, width: 800 },
          { src: product.imageLarge, width: 1600 }
        ])
  };
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
  const guide =
    categorySeoGuides[item.id as keyof typeof categorySeoGuides] ?? null;
  const isPilotCategory = products.length > 0;
  const related = await getRelatedCatalogCategories(item.id, 4);
  const navigation = await getSiteNavigation();
  const categoryImageSrcSet = buildImageSrcSet([
    { src: item.imageThumb, width: 320 },
    { src: item.imageMedium, width: 640 },
    { src: item.imageLarge, width: 960 }
  ]);

  const categoryUrl = `${SITE_URL}/catalog/${item.id}`;
  const breadcrumb = breadcrumbSchema([
    { name: "Главная", url: SITE_URL },
    { name: "Каталог", url: `${SITE_URL}/catalog` },
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
    <main className="line-page catalog-detail-page category-detail-v2" id="top">
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
        <a href="/catalog">Каталог</a>
        <ArrowRight size={14} />
        <span>{item.title}</span>
      </div>

      {!isPilotCategory ? (
        <section className="catalog-detail-hero">
          <div>
            <span className="line-kicker">Раздел каталога</span>
            <h1>{item.title}</h1>
            <p>{item.summary}</p>
            <p>{item.scenario}</p>
            <div className="catalog-detail-actions">
              <a className="line-primary" href="/#calculator">
                Рассчитать стоимость <ArrowRight size={18} />
              </a>
              <a className="line-secondary" href="#category-request">Связаться с инженером</a>
            </div>
          </div>
          <ImageLightbox
            src={item.imageMedium ?? item.image}
            srcSet={categoryImageSrcSet}
            sizes="(max-width: 760px) calc(100vw - 24px), (max-width: 1180px) calc(100vw - 40px), 480px"
            largeSrc={item.imageLarge ?? item.image}
            alt={item.title}
            className="catalog-detail-image"
          />
        </section>
      ) : null}

      {!isPilotCategory && guide ? (
        <section
          className="category-expertise"
          aria-labelledby="category-expertise-title"
        >
          <div className="category-expertise__heading">
            <span className="line-kicker">Инженерный гид</span>
            <h2 id="category-expertise-title">Подбор решения: {item.title}</h2>
            <div className="category-expertise__intro">
              {guide.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="category-expertise__grid">
            <article className="category-expertise__card">
              <h3>Критерии подбора</h3>
              <ul>
                {guide.selectionCriteria.map((criterion) => (
                  <li key={criterion}>{criterion}</li>
                ))}
              </ul>
            </article>

            <article className="category-expertise__card">
              <h3>Где применяется</h3>
              <ul>
                {guide.suitableFor.map((scenario) => (
                  <li key={scenario}>{scenario}</li>
                ))}
              </ul>
            </article>

            <article className="category-expertise__card">
              <h3>Что учесть при внедрении</h3>
              <ul>
                {guide.integrationNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      ) : null}

      {isPilotCategory ? (
        <>
          <section className="assortment-section assortment-section-first" id="assortment">
            <div className="assortment-headline category-fast-headline">
              <div>
                <span className="line-kicker">Каталог раздела</span>
                <h1>{item.title}</h1>
                <p>{item.summary}</p>
              </div>
              <div className="category-fast-stat" aria-label="Количество товаров в разделе">
                <strong>{products.length}</strong>
                <span>
                  {pluralRu(
                    products.length,
                    "товар в разделе",
                    "товара в разделе",
                    "товаров в разделе"
                  )}
                </span>
                <a href="#category-request">Не нашли нужную модель?</a>
              </div>
            </div>
            <div className="assortment-grid">
              {products.map((product) => {
                const assortmentImage = getAssortmentImage(product);
                return (
                <a className="assortment-card" href={`/catalog/${item.id}/${product.id}`} key={product.id}>
                  <div className="assortment-visual">
                    <img
                      src={assortmentImage.src}
                      srcSet={assortmentImage.srcSet}
                      sizes="(max-width: 760px) calc(100vw - 24px), (max-width: 1180px) calc(50vw - 32px), 275px"
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
                      width={960}
                      height={720}
                    />
                  </div>
                  <div className="assortment-copy">
                    <h4>{product.title}</h4>
                    <p>{product.summary}</p>
                    <strong>
                      {product.pageMode === "configurator"
                        ? "Рассчитать в конфигураторе"
                        : getProductPriceLabel(product)}
                    </strong>
                    <b>Перейти в товар <ArrowRight size={16} /></b>
                  </div>
                </a>
                );
              })}
            </div>
          </section>

          {guide ? (
            <section
              className="category-expertise category-expertise-after"
              aria-labelledby="category-expertise-after-title"
            >
              <div className="category-expertise__heading">
                <span className="line-kicker">Как выбрать</span>
                <h2 id="category-expertise-after-title">На что смотрит инженер при подборе</h2>
                <div className="category-expertise__intro">
                  {guide.intro.slice(0, 1).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <div className="category-expertise__grid">
                <article className="category-expertise__card">
                  <h3>Критерии подбора</h3>
                  <ul>
                    {guide.selectionCriteria.slice(0, 4).map((criterion) => (
                      <li key={criterion}>{criterion}</li>
                    ))}
                  </ul>
                </article>

                <article className="category-expertise__card">
                  <h3>Где применяется</h3>
                  <ul>
                    {guide.suitableFor.slice(0, 4).map((scenario) => (
                      <li key={scenario}>{scenario}</li>
                    ))}
                  </ul>
                </article>

                <article className="category-expertise__card">
                  <h3>Что уточнить</h3>
                  <ul>
                    {guide.integrationNotes.slice(0, 4).map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>
          ) : null}
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
                  <img src={relatedItem.imageThumb ?? relatedItem.image} alt={relatedItem.title} loading="lazy" decoding="async" width={320} height={240} />
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
        <section className="category-help-strip" id="category-request">
          <aside className="category-help-card">
            <span className="line-kicker">Инженерный подбор</span>
            <h2>Не нашли точную модель?</h2>
            <p>Оставьте задачу по разделу. Инженер увидит источник заявки и быстрее поймет, что нужно подобрать.</p>
            <div className="category-help-grid">
              <span><PackageCheck size={18} /> что храните</span>
              <span><Ruler size={18} /> размеры и вес</span>
              <span><ShieldCheck size={18} /> город и условия склада</span>
            </div>
          </aside>
          <LeadForm
            title="Получить подбор по разделу"
            sourceTitle={item.title}
            sourceUrl={categoryUrl}
            sourceImage={item.image}
          />
        </section>
      )}
    </main>
  );
}
