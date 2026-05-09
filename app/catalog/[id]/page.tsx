import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardCheck, PackageCheck, Ruler, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { ImageLightbox } from "@/components/ImageLightbox";
import { LeadForm } from "@/components/LeadForm";
import { LinePageStyles } from "@/components/LinePageStyles";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import { getProductsByCategory } from "@/data/storageSystems/catalogDepth";
import { formatRoundedRub } from "@/lib/calculator/format";

export function generateStaticParams() {
  return excelHomeCatalog.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = excelHomeCatalog.find((catalogItem) => catalogItem.id === id);

  return {
    title: item ? `${item.title} | КБ Парус` : "Каталог | КБ Парус",
    description: item?.summary
  };
}

export default async function CatalogCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = excelHomeCatalog.find((catalogItem) => catalogItem.id === id);
  if (!item) notFound();

  const products = getProductsByCategory(item.id);
  const isPilotCategory = products.length > 0;
  const related = excelHomeCatalog.filter((catalogItem) => catalogItem.id !== item.id).slice(0, 4);

  return (
    <main className="line-page catalog-detail-page" id="top">
      <LinePageStyles />
      <header className="catalog-detail-header">
        <BrandMark />
        <nav aria-label="Навигация по разделу">
          <a href="/"><ArrowLeft size={16} /> На главную</a>
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
              <h2>Автоматизированные системы хранения листового металла</h2>
              <p>Для пилота выводим товары напрямую, без подкатегорий и фильтров. Так клиент сразу видит варианты и переходит в нужную карточку.</p>
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

          <LeadForm title="Получить расчет по разделу" />
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
          <LeadForm title="Не нашли нужную систему в разделе?" />
        </section>
      )}
    </main>
  );
}
