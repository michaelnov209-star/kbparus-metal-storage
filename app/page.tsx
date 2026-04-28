import { BrandMark } from "@/components/BrandMark";
import { Calculator } from "@/components/Calculator";
import { HeroVisual } from "@/components/HeroVisual";
import { SolutionsShowcase } from "@/components/SolutionsShowcase";
import {
  ArrowRight,
  CheckCircle2,
  Gauge,
  Mail,
  MapPin,
  Phone,
  Ruler,
  ShieldCheck,
  Truck,
  Warehouse,
  Zap
} from "lucide-react";
import {
  advantages,
  beforeAfter,
  cases,
  clientDeliverables,
  contacts,
  faq,
  problems,
  processSteps,
  solutionCards,
  whatToStore
} from "@/data/storageSystems/content";
import { visualAssets } from "@/data/storageSystems/visualAssets";

const proofMetrics = [
  { value: "2009", label: "проектируем и производим промышленное оборудование" },
  { value: "5 т", label: "ориентир нагрузки на уровень хранения" },
  { value: "1 маршрут", label: "расчёт, производство, окраска, доставка и монтаж" }
];

const icons = [Gauge, Warehouse, ShieldCheck, Zap, Truck, Ruler];

export default function Home() {
  return (
    <main id="top">
      <header className="site-header">
        <BrandMark />
        <nav>
          <a href="#solutions">Решения</a>
          <a href="#calculator">Калькулятор</a>
          <a href="#process">Проект</a>
          <a href="#contacts">Контакты</a>
        </nav>
        <div className="header-contact">
          <a href={contacts.phones[0].href}>{contacts.phones[0].label}</a>
          <a className="header-cta" href="#calculator">Рассчитать</a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy reveal">
          <span className="eyebrow">КБ Парус / системы хранения металла</span>
          <h1>Порядок на складе металла начинается с инженерного расчёта</h1>
          <p>
            Подбираем консольные, кассетные, вертикальные, выкатные и автоматизированные системы под ваш металл,
            нагрузку, помещение и способ загрузки.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#calculator">Рассчитать систему</a>
            <a className="secondary-button" href="#contacts">Связаться с инженером</a>
          </div>
        </div>
        <HeroVisual />
        <div className="hero-proof reveal">
          {proofMetrics.map((item) => (
            <article key={item.value}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="problem-strip" id="problems">
        <div className="section-heading reveal">
          <span className="eyebrow">Зачем менять хранение</span>
          <h2>Металл на полу съедает площадь, время и безопасность</h2>
        </div>
        <div className="problem-strip-grid">
          {problems.slice(0, 4).map((problem, index) => (
            <article className="reveal" key={problem.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{problem.title}</h3>
              <p>{problem.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="split-story">
        <div className="story-media reveal">
          <img src={visualAssets.tubesProfile} alt="Металл, трубы и профиль на промышленном складе" />
        </div>
        <div className="story-copy reveal">
          <span className="eyebrow">Что можно хранить</span>
          <h2>Лист, трубы, профиль, балки и смешанные партии</h2>
          <p>
            Система хранения выбирается не “по картинке”, а по номенклатуре: длина, вес, частота доступа,
            техника загрузки и ограничения цеха сразу влияют на конструкцию.
          </p>
          <div className="chip-grid">
            {whatToStore.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
      </section>

      <SolutionsShowcase />

      <section className="section solution-card-section">
        <div className="section-heading wide reveal">
          <span className="eyebrow">Типы систем</span>
          <h2>Не витрина стеллажей, а набор решений под разные сценарии склада</h2>
        </div>
        <div className="solution-card-grid">
          {solutionCards.slice(0, 6).map((card) => (
            <article className="solution-card reveal" key={card.title}>
              <img src={pickEquipmentImage(card.type)} alt={card.title} />
              <div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <span>{card.scenario}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="before-after-section">
        <div className="section-heading wide reveal">
          <span className="eyebrow">До / после</span>
          <h2>Вместо хаоса на полу — адресное хранение и быстрый доступ</h2>
        </div>
        <div className="before-after-grid">
          <article className="before-card reveal">
            <img src={visualAssets.beforeWarehouse} alt="Склад до внедрения системы хранения" />
            <div>
              <span>до</span>
              <h3>{beforeAfter.before.title}</h3>
              <p>{beforeAfter.before.subtitle}</p>
              <ul>{beforeAfter.before.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </div>
          </article>
          <article className="after-card reveal">
            <img src={visualAssets.afterWarehouse} alt="Склад после внедрения системы хранения" />
            <div>
              <span>после</span>
              <h3>{beforeAfter.after.title}</h3>
              <p>{beforeAfter.after.subtitle}</p>
              <ul>{beforeAfter.after.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </div>
          </article>
        </div>
      </section>

      <Calculator />

      <section className="section deliverables-section reveal">
        <div className="section-heading">
          <span className="eyebrow">После расчёта</span>
          <h2>Клиент получает понятную основу для инженерного разговора</h2>
        </div>
        <div className="deliverables-grid">
          {clientDeliverables.map((item) => (
            <article key={item}>
              <CheckCircle2 size={20} />
              {item}
            </article>
          ))}
        </div>
      </section>

      <section className="process-section" id="process">
        <div className="process-media reveal">
          <img src={visualAssets.engineering} alt="Инженерное проектирование промышленного оборудования" />
        </div>
        <div className="process-copy reveal">
          <span className="eyebrow">Как проходит проект</span>
          <h2>От номенклатуры металла до смонтированной системы</h2>
          <ol>
            {processSteps.map((step, index) => (
              <li key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section dark-premium">
        <div className="section-heading wide reveal">
          <span className="eyebrow">Почему КБ Парус</span>
          <h2>Инженерность, производство и ответственность за результат</h2>
        </div>
        <div className="advantage-grid">
          {advantages.map((advantage, index) => {
            const Icon = icons[index % icons.length];
            return (
              <article className="reveal" key={advantage.title}>
                <Icon size={28} />
                <h3>{advantage.title}</h3>
                <p>{advantage.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section cases-section">
        <div className="section-heading wide reveal">
          <span className="eyebrow">Где применяется</span>
          <h2>Для цехов, складов металлопроката и производственных потоков</h2>
        </div>
        <div className="case-grid">
          {cases.slice(0, 5).map((item) => (
            <article className="reveal" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section faq-section" id="faq">
        <div className="section-heading wide reveal">
          <span className="eyebrow">FAQ</span>
          <h2>Коротко о том, что важно перед расчётом</h2>
        </div>
        <div className="faq-list">
          {faq.slice(0, 9).map((item) => (
            <details className="reveal" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta" id="contacts">
        <div className="final-card reveal">
          <BrandMark compact />
          <span className="eyebrow">Связаться с инженером</span>
          <h2>Начните с расчёта склада металла под вашу задачу</h2>
          <p>
            Заявку и параметры расчёта можно передать в CRM, 1С или складскую систему, чтобы менеджер сразу видел
            исходные данные и быстрее готовил предложение.
          </p>
          <div className="contact-list">
            {contacts.phones.map((phone) => <a href={phone.href} key={phone.href}><Phone size={18} />{phone.label}</a>)}
            <a href={contacts.email.href}><Mail size={18} />{contacts.email.label}</a>
            <span><MapPin size={18} />{contacts.address}</span>
          </div>
          <a className="primary-button" href="#calculator">Перейти к калькулятору <ArrowRight size={18} /></a>
        </div>
      </section>

      <footer className="site-footer">
        <BrandMark />
        <span>КБ Парус / системы хранения металла</span>
        <a href="#calculator">Рассчитать систему</a>
      </footer>
    </main>
  );
}

function pickEquipmentImage(productType: string) {
  if (productType === "cantilever") return visualAssets.steelProfile;
  if (productType === "automated") return visualAssets.engineering;
  if (productType === "rollout" || productType === "hybrid") return visualAssets.forklift;
  if (productType === "honeycomb") return visualAssets.metalCoils;
  if (productType === "custom") return visualAssets.productionLine;
  if (productType === "vertical") return visualAssets.sheetMetal;
  return visualAssets.warehouse;
}
