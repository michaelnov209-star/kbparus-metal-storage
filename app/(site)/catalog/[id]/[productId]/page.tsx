import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileText,
  PackageCheck,
  Ruler,
  ShieldCheck
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Calculator } from "@/components/Calculator";
import { LeadForm } from "@/components/LeadForm";
import { ProductGallery, type ProductGalleryImage } from "@/components/ProductGallery";
import { getSeoForItem, type CatalogProduct } from "@/data/storageSystems/catalogDepth";
import { getProductGallerySlots } from "@/lib/catalog/product-gallery";
import { getProductPriceLabel } from "@/lib/catalog/product-price";
import { getCalculatorProfiles } from "@/lib/cms/calculator-profiles";
import { getCatalogCategory } from "@/lib/cms/catalog";
import { getLocalProductImageVariants } from "@/lib/cms/product-image-variants";
import { getCatalogProducts, getCatalogProductView } from "@/lib/cms/products";
import { getSiteNavigation, type SiteLink } from "@/lib/cms/site-navigation";
import { buildImageSrcSet } from "@/lib/media/srcset";
import { JsonLd, breadcrumbSchema, productSchema, SITE_URL } from "@/lib/seo/schema";

export const revalidate = 60;

function toAbsoluteUrl(value: string) {
  return value.startsWith("http") ? value : `${SITE_URL}${value}`;
}

function linkTargetProps(link: SiteLink) {
  return link.openInNewTab ? { target: "_blank", rel: "noreferrer" } : {};
}

function toProductGalleryImage(
  source: string,
  product: CatalogProduct,
  index: number,
  isMain: boolean
): ProductGalleryImage {
  const alt = isMain
    ? product.imageAlt ?? product.title
    : product.galleryAlts?.[index] ?? `${product.title} — фото ${index + 1}`;
  const thumbSrc = isMain ? product.imageThumb : product.galleryThumbs?.[index];
  const mediumSrc = isMain ? product.imageMedium : product.galleryMediums?.[index];
  const largeSrc = isMain ? product.imageLarge : product.galleryLarges?.[index];
  if (thumbSrc || mediumSrc || largeSrc) {
    return {
      alt,
      src: mediumSrc ?? largeSrc ?? thumbSrc ?? source,
      srcSet: buildImageSrcSet([
        { src: thumbSrc, width: 320 },
        { src: mediumSrc, width: 800 },
        { src: largeSrc, width: 1600 }
      ]),
      sizes: "(max-width: 1180px) calc(100vw - 40px), 540px",
      thumbSrc: thumbSrc ?? mediumSrc ?? source,
      largeSrc: largeSrc ?? mediumSrc ?? source
    };
  }
  const localVariants = getLocalProductImageVariants(source);
  if (localVariants) {
    return {
      alt,
      src: localVariants.medium.src,
      srcSet: buildImageSrcSet(Object.values(localVariants)),
      sizes: "(max-width: 1180px) calc(100vw - 40px), 540px",
      thumbSrc: localVariants.thumb.src,
      largeSrc: localVariants.large.src
    };
  }

  if (isMain) {
    return {
      alt,
      src: product.imageMedium ?? source,
      srcSet: buildImageSrcSet([
        { src: product.imageThumb, width: 320 },
        { src: product.imageMedium, width: 800 },
        { src: product.imageLarge, width: 1600 }
      ]),
      sizes: "(max-width: 1180px) calc(100vw - 40px), 540px",
      thumbSrc: product.imageThumb ?? product.imageMedium ?? source,
      largeSrc: product.imageLarge ?? source
    };
  }

  return { alt, src: source, thumbSrc: source, largeSrc: source };
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
  const [category, product, navigation, calculatorProfiles] = await Promise.all([
    getCatalogCategory(id),
    getCatalogProductView(id, productId),
    getSiteNavigation(),
    getCalculatorProfiles()
  ]);
  if (!category || !product) notFound();
  const calculatorProfile = product.calculatorProfileId
    ? calculatorProfiles.find(
        (profile) => profile.id === product.calculatorProfileId
      )
    : undefined;
  const productGallery = getProductGallerySlots(product).map((slot) =>
    toProductGalleryImage(slot.source, product, slot.index, slot.isMain)
  );
  const productCalculatorProfile =
    product.pageMode === "configurator" &&
      product.calculatorProfileId &&
      calculatorProfile
      ? calculatorProfile
      : undefined;
  const hasProductCalculator = Boolean(productCalculatorProfile);

  const productUrl = `${SITE_URL}/catalog/${id}/${productId}`;
  const breadcrumb = breadcrumbSchema([
    { name: "Главная", url: SITE_URL },
    { name: "Каталог", url: `${SITE_URL}/catalog` },
    { name: category.title, url: `${SITE_URL}/catalog/${id}` },
    { name: product.title, url: productUrl }
  ]);
  const productLd = productSchema({
    name: product.title,
    description: product.description,
    image: toAbsoluteUrl(product.image),
    priceFrom: product.priceMode === "fixed" ? product.priceFrom : undefined,
    priceTo: product.priceMode === "fixed" ? product.priceTo : undefined,
    sku: product.sku,
    url: productUrl
  });

  return (
    <main className="line-page catalog-detail-page product-detail-page product-detail-v2" id="top">
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
        <a href="/catalog">Каталог</a>
        <ArrowRight size={14} />
        <a href={`/catalog/${category.id}`}>{category.title}</a>
        <ArrowRight size={14} />
        <span>{product.title}</span>
      </div>

      <section
        className={`product-hero product-first-fold${hasProductCalculator ? " is-configurator" : ""}`}
      >
        <ProductGallery
          badge={product.badge}
          images={productGallery}
          title={product.title}
        />
        <div className="product-hero-copy product-title-strip">
          <span className="line-kicker">
            {hasProductCalculator ? "Система хранения" : "Оборудование"}
          </span>
          <h1>{product.title}</h1>
          <p>{product.summary}</p>
          {hasProductCalculator ? (
            <div className="product-price-row">
              <strong>Рассчитайте свою комплектацию</strong>
              <a className="line-primary" href="#product-configurator">
                К параметрам
              </a>
            </div>
          ) : (
            <div className="product-price-row">
              <strong>{getProductPriceLabel(product)}</strong>
              <a className="line-primary" href="#product-request">
                Оставить заявку
              </a>
            </div>
          )}

          <div className="product-hero-details" data-testid="product-details">
            <section
              className="product-hero-detail-column"
              aria-labelledby="product-specifications-title"
            >
              <div className="product-hero-detail-heading">
                <Ruler size={18} aria-hidden />
                <h2 id="product-specifications-title">Характеристики</h2>
              </div>
              <dl className="product-hero-specs">
                {product.specs.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section
              className="product-hero-detail-column product-hero-includes"
              aria-labelledby="product-selection-title"
            >
              <div className="product-hero-detail-heading">
                <PackageCheck size={18} aria-hidden />
                <h2 id="product-selection-title">Что входит в подбор</h2>
              </div>
              <ul>
                {product.includes.map((item) => (
                  <li key={item}>
                    <ShieldCheck size={16} aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </section>

      {productCalculatorProfile ? (
        <div id="product-configurator" data-testid="product-configurator">
          <Calculator
            profiles={[productCalculatorProfile]}
            productContext={{
              title: product.title,
              url: productUrl,
              image: product.image,
              imageAlt: product.imageAlt,
              towerCountOptions: product.calculatorTowerCountOptions,
              defaultTowerCount: product.calculatorDefaultTowerCount
            }}
          />
        </div>
      ) : (
        <>
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

          <LeadForm
            title="Получить предложение по товару"
            sourceTitle={product.title}
            sourceUrl={productUrl}
            sourceImage={product.image}
          />
        </>
      )}

      {product.documents?.length ? (
        <section
          className="product-downloads"
          aria-labelledby="product-downloads-title"
        >
          <div className="product-downloads__intro">
            <FileText size={24} aria-hidden />
            <div>
              <span className="line-kicker">Документы</span>
              <h2 id="product-downloads-title">Материалы по оборудованию</h2>
              <p>Паспорта, инструкции и каталоги, которые добавлены к этой карточке.</p>
            </div>
          </div>
          <div className="product-downloads__list">
            {product.documents.map((document) => (
              <a
                href={document.href}
                key={`${document.title}-${document.href}`}
                rel="noreferrer"
                target="_blank"
              >
                <span>
                  <FileText size={18} aria-hidden />
                  <strong>{document.title}</strong>
                </span>
                <Download size={18} aria-hidden />
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
