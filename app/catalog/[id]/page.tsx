import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardCheck, Ruler, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { LeadForm } from "@/components/LeadForm";
import { LinePageStyles } from "@/components/LinePageStyles";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";

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

      <section className="catalog-detail-hero">
        <div>
          <span className="line-kicker">Раздел каталога</span>
          <h1>{item.title}</h1>
          <p>{item.summary}</p>
          <p>{item.scenario}</p>
          <div className="catalog-detail-actions">
            <a className="line-primary" href="/#calculator">Рассчитать стоимость <ArrowRight size={18} /></a>
            <a className="line-secondary" href="/#contacts">Связаться с инженером</a>
          </div>
        </div>
        <img src={item.image} alt={item.title} />
      </section>

      <section className="catalog-detail-content">
        <div className="catalog-detail-card">
          <h2>Что уточним для подбора</h2>
          <ul>
            <li>Материал, который нужно хранить: лист, труба, профиль, сортовой прокат или смешанные позиции.</li>
            <li>Максимальные габариты, вес пачки и желаемую вместимость системы.</li>
            <li>Способ загрузки: погрузчик, кран-балка или ручная работа.</li>
            <li>Ограничения помещения: высота, проходы, ворота, колонны и зона обслуживания.</li>
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
    </main>
  );
}
