import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, PackageCheck, Ruler, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { LeadForm } from "@/components/LeadForm";
import { LinePageStyles } from "@/components/LinePageStyles";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import { catalogProducts, getCatalogProduct } from "@/data/storageSystems/catalogDepth";
import { formatRoundedRub } from "@/lib/calculator/format";

export function generateStaticParams() {
  return catalogProducts.map((item) => ({ id: item.categoryId, productId: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; productId: string }> }) {
  const { id, productId } = await params;
  const product = getCatalogProduct(id, productId);

  return {
    title: product ? `${product.title} | КБ Парус` : "Товар | КБ Парус",
    description: product?.summary
  };
}

export default async function CatalogProductPage({ params }: { params: Promise<{ id: string; productId: string }> }) {
  const { id, productId } = await params;
  const category = excelHomeCatalog.find((item) => item.id === id);
  const product = getCatalogProduct(id, productId);
  if (!category || !product) notFound();

  return (
    <main className="line-page catalog-detail-page product-detail-page" id="top">
      <LinePageStyles />
      <header className="catalog-detail-header">
        <BrandMark />
        <nav aria-label="Навигация по товару">
          <a href={`/catalog/${category.id}`}><ArrowLeft size={16} /> Назад в раздел</a>
          <a href="/#catalog">Каталог</a>
          <a href="/#calculator">Калькулятор</a>
          <a href="/#contacts">Контакты</a>
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

      <section className="product-hero">
        <div className="product-hero-visual">
          <span>{product.badge}</span>
          <img src={product.image} alt={product.title} />
        </div>
        <div className="product-hero-copy">
          <span className="line-kicker">Карточка оборудования</span>
          <h1>{product.title}</h1>
          <p>{product.summary}</p>
          <div className="product-price-row">
            {product.pageMode === "configurator" ? (
              <strong>Стоимость рассчитывается ниже</strong>
            ) : (
              <strong>от {formatRoundedRub(product.priceFrom ?? 0)}</strong>
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
          <ProductConfigurator profileId={product.calculatorProfileId} />
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

      <LeadForm title="Получить предложение по товару" />
    </main>
  );
}
