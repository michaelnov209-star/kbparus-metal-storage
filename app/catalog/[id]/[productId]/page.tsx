import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, PackageCheck, Ruler, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { LeadForm } from "@/components/LeadForm";
import { LinePageStyles } from "@/components/LinePageStyles";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import { ProductGallery } from "@/components/ProductGallery";
import { getSeoForItem } from "@/data/storageSystems/catalogDepth";
import { formatRoundedRub } from "@/lib/calculator/format";
import { getCatalogCategory } from "@/lib/cms/catalog";
import { getCatalogProducts, getCatalogProductView } from "@/lib/cms/products";
import { getSiteNavigation, type SiteLink } from "@/lib/cms/site-navigation";
import { JsonLd, breadcrumbSchema, productSchema, SITE_URL } from "@/lib/seo/schema";

export const revalidate = 60;

function toAbsoluteUrl(value: string) {
  return value.startsWith("http") ? value : `${SITE_URL}${value}`;
}

function linkTargetProps(link: SiteLink) {
  return link.openInNewTab ? { target: "_blank", rel: "noreferrer" } : {};
}

export async function generateStaticParams() {
  const products = await getCatalogProducts();
  return products.map((item) => ({ id: item.categoryId, productId: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; productId: string }> }) {
  const { id, productId } = await params;
  const product = await getCatalogProductView(id, productId);
  if (!product) return { title: "Товар" };

  const seo = getSeoForItem(product);
  const url = seo.canonicalUrl ?? `${SITE_URL}/catalog/${id}/${productId}`;
  const ogImage = toAbsoluteUrl(seo.ogImage);

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords.length > 0 ? seo.keywords : undefined,
    alternates: { canonical: url },
    robots: seo.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: `${seo.title} | КБ Парус`,
      description: seo.description,
      url,
      type: "website",
      images: [{ url: ogImage, alt: product.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${seo.title} | КБ Парус`,
      description: seo.description,
      images: [ogImage]
    }
  };
}

export default async function CatalogProductPage({ params }: { params: Promise<{ id: string; productId: string }> }) {
  const { id, productId } = await params;
  const category = await getCatalogCategory(id);
  const product = await getCatalogProductView(id, productId);
  if (!category || !product) notFound();
  const navigation = await getSiteNavigation();

  const productUrl = `${SITE_URL}/catalog/${id}/${productId}`;
  const breadcrumb = breadcrumbSchema([
    { name: "Главная", url: SITE_URL },
    { name: "Каталог", url: `${SITE_URL}/#catalog` },
    { name: category.title, url: `${SITE_URL}/catalog/${id}` },
    { name: product.title, url: productUrl }
  ]);
  const productLd = productSchema({
    name: product.title,
    description: product.description,
    image: toAbsoluteUrl(product.image),
    sku: product.sku,
    url: productUrl,
    priceFrom: product.priceMode === "fixed" ? product.priceFrom : undefined
  });

  return (
    <main className="line-page catalog-detail-page product-detail-page" id="top">
      <LinePageStyles />
      <JsonLd data={breadcrumb} />
      <JsonLd data={productLd} />
      <header className="catalog-detail-header">
        <BrandMark />
        <nav aria-label="Навигация по товару">
          <a href={`/catalog/${category.id}`}><ArrowLeft size={16} /> Назад в раздел</a>
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
        <a href={`/catalog/${category.id}`}>{category.title}</a>
        <ArrowRight size={14} />
        <span>{product.title}</span>
      </div>

      <section className="product-title-strip">
        <span className="line-kicker">Карточка оборудования</span>
        <h1>{product.title}</h1>
        <p>{product.summary}</p>
      </section>

      <section className="product-hero">
        <ProductGallery images={product.gallery.length > 0 ? product.gallery : [product.image]} title={product.title} />
        <div className="product-hero-copy">
          <span className="line-kicker">Подбор исполнения</span>
          <h2>Подберём систему под ваш склад</h2>
          <p>Уточним формат листа, нагрузку, количество уровней, способ загрузки и ограничения помещения, чтобы инженер сразу подготовил предметное предложение.</p>
          <div className="product-price-row">
            {product.pageMode === "configurator" ? (
              <strong>Стоимость рассчитывается ниже</strong>
            ) : product.priceMode === "fixed" && product.priceFrom ? (
              <strong>от {formatRoundedRub(product.priceFrom)}</strong>
            ) : (
              <strong>Цена по запросу</strong>
            )}
            <a className="line-primary" href={product.pageMode === "configurator" ? "#product-configurator" : "#product-request"}>
              {product.pageMode === "configurator" ? "Настроить параметры" : "Оставить заявку"}
            </a>
          </div>
        </div>
      </section>

      <section className="product-info-grid">
        <article>
          <h2>Назначение</h2>
          <p>{product.description}</p>
        </article>
        <article>
          <h2>Где применяется</h2>
          <ul>
            {product.applications.map((item) => <li key={item}><CheckCircle2 size={18} /> {item}</li>)}
          </ul>
        </article>
        <article>
          <h2>Характеристики</h2>
          <div className="product-spec-table">
            {product.specs.map((item) => (
              <span key={item.label}>
                <small>{item.label}</small>
                <b>{item.value}</b>
              </span>
            ))}
          </div>
        </article>
        <article>
          <h2>Что входит в подбор</h2>
          <ul>
            {product.includes.map((item) => <li key={item}><PackageCheck size={18} /> {item}</li>)}
          </ul>
        </article>
      </section>

      {product.pageMode === "configurator" && product.calculatorProfileId ? (
        <div id="product-configurator">
          <ProductConfigurator
            profileId={product.calculatorProfileId}
            productTitle={product.title}
            productUrl={productUrl}
            productImage={product.image}
          />
        </div>
      ) : (
        <section className="standard-product-cta" id="product-request">
          <div>
            <Ruler size={26} />
            <h2>Подберем исполнение под ваш склад</h2>
            <p>Инженер уточнит габариты, нагрузку, способ загрузки, покрытие и монтаж, чтобы подготовить предложение без лишней переписки.</p>
          </div>
          <div>
            <ShieldCheck size={26} />
            <h3>Нужны исходные данные</h3>
            <p>Размер помещения, что храните, вес пачки, способ загрузки и город поставки.</p>
          </div>
        </section>
      )}

      <LeadForm
        title="Получить предложение по товару"
        sourceTitle={product.title}
        sourceUrl={productUrl}
        sourceImage={product.image}
      />
    </main>
  );
}
