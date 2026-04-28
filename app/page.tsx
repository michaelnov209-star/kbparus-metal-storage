import { BrandMark } from "@/components/BrandMark";
import { Calculator } from "@/components/Calculator";
import { HeroVisual } from "@/components/HeroVisual";
import { SolutionsShowcase } from "@/components/SolutionsShowcase";
import {
  Box,
  Building2,
  CheckCircle2,
  Gauge,
  HardHat,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Ruler,
  ShieldCheck,
  Truck,
  Warehouse,
  Zap
} from "lucide-react";
import {
  advantages,
  aboutCompany,
  beforeAfter,
  cases,
  clientDeliverables,
  contacts,
  engineerData,
  faq,
  problems,
  processSteps,
  solutionCards,
  whatToStore,
  workflowSteps
} from "@/data/storageSystems/content";
import { visualAssets } from "@/data/storageSystems/visualAssets";

export default function Home() {
  return (
    <main id="top">
      <header className="site-header">
        <BrandMark />
        <nav>
          <a href="#problems">Задачи</a>
          <a href="#solutions">Решения</a>
          <a href="#calculator">Калькулятор</a>
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
          <h1>Инженерный порядок на складе металла</h1>
          <p>
            Проектируем консольные, кассетные, вертикальные, выкатные и автоматизированные системы хранения
            под ваш металл, нагрузку, помещение и способ загрузки.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#calculator">Рассчитать систему хранения</a>
            <a className="secondary-button" href="#contacts">Связаться с инженером</a>
          </div>
          <div className="hero-contact-line">
            <a href={contacts.phones[0].href}><Phone size={16} />{contacts.phones[0].label}</a>
            <a href={contacts.email.href}><Mail size={16} />{contacts.email.label}</a>
          </div>
          <div className="hero-stats">
            <span><strong>лист</strong> вертикально, в кассетах или автоматизированном складе</span>
            <span><strong>труба / профиль</strong> консоли, ячейки и хранение длинномера</span>
            <span><strong>цех / склад</strong> под погрузчик, кран-балку и монтаж на объекте</span>
          </div>
        </div>
        <HeroVisual />
      </section>

      <section className="section about-section reveal">
        <div className="about-card">
          <div>
            <span className="eyebrow">О компании</span>
            <h2>{aboutCompany.title}</h2>
            <p>{aboutCompany.text}</p>
          </div>
          <div className="about-facts">
            {aboutCompany.facts.map((fact) => (
              <span key={fact}><CheckCircle2 size={18} />{fact}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section problem-section" id="problems">
        <div className="section-heading wide reveal">
          <span className="eyebrow">Что ломает склад</span>
          <h2>Хранение металла на полу стоит дороже, чем кажется</h2>
          <p>Площадь занята, материал ищут вручную, техника простаивает, а повреждения появляются ещё до запуска металла в производство.</p>
        </div>
        <div className="problem-grid">
          {problems.map((problem, index) => (
            <article className="problem-card reveal" key={problem.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{problem.title}</h3>
              <p>{problem.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section dark-band storage-band reveal">
        <div className="section-heading wide">
          <span className="eyebrow">Что можно хранить</span>
          <h2>От листа до тяжёлого длинномера</h2>
        </div>
        <div className="storage-grid">
          <div className="storage-photo">
            <img src={visualAssets.tubesProfile} alt="Металл, профиль и балки на складе" />
          </div>
          <div className="storage-list">
            {whatToStore.map((item, index) => {
              const icons = [Box, Ruler, Warehouse, PackageCheck, Truck, HardHat];
              const Icon = icons[index % icons.length];
              return <article key={item}><Icon size={24} />{item}</article>;
            })}
          </div>
        </div>
      </section>

      <SolutionsShowcase />

      <section className="section solution-card-section">
        <div className="section-heading wide reveal">
          <span className="eyebrow">Ассортимент</span>
          <h2>8 типов систем хранения для разных задач металла</h2>
          <p>Наполнение можно уточнять и расширять: структура уже рассчитана на реальные фото, характеристики и будущий каталог.</p>
        </div>
        <div className="solution-card-grid">
          {solutionCards.slice(0, 6).map((card) => (
            <article className="solution-card reveal" key={card.title}>
              <div className="solution-card-media">
                <img src={pickEquipmentImage(card.type)} alt={card.title} />
              </div>
              <div className="solution-card-body">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <span>{card.scenario}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section before-after-section">
        <div className="section-heading wide reveal">
          <span className="eyebrow">До / после</span>
          <h2>Из склада с металлом на полу в управляемую систему хранения</h2>
          <p>Клиенту важно увидеть не просто стеллаж, а разницу в процессе: меньше поиска, меньше перекладок, больше порядка и безопасности.</p>
        </div>
        <div className="before-after-grid">
          <article className="before-card reveal">
            <div className="ba-media ba-before">
              <img src={visualAssets.beforeWarehouse} alt="Склад до внедрения: металл на полу и хаос" />
              <div className="floor-chaos">
                {Array.from({ length: 10 }).map((_, index) => <span key={index} />)}
              </div>
            </div>
            <div className="ba-copy">
              <span>до</span>
              <h3>{beforeAfter.before.title}</h3>
              <p>{beforeAfter.before.subtitle}</p>
              <ul>{beforeAfter.before.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </div>
          </article>
          <article className="after-card reveal">
            <div className="ba-media ba-after">
              <img src={visualAssets.afterWarehouse} alt="Склад после внедрения: система хранения и порядок" />
              <div className="ordered-rack">
                {Array.from({ length: 6 }).map((_, index) => <span key={index} />)}
              </div>
            </div>
            <div className="ba-copy">
              <span>после</span>
              <h3>{beforeAfter.after.title}</h3>
              <p>{beforeAfter.after.subtitle}</p>
              <ul>{beforeAfter.after.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </div>
          </article>
        </div>
      </section>

      <section className="section workflow-section">
        <div className="section-heading wide reveal">
          <span className="eyebrow">Как это работает</span>
          <h2>Хранение → доступ → перемещение → загрузка</h2>
          <p>Материал не просто лежит на складе, а быстро и безопасно попадает в работу.</p>
        </div>
        <div className="workflow-rail reveal">
          {workflowSteps.map((step, index) => (
            <article key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div className="workflow-icon">
                <i />
                <i />
                <i />
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <Calculator />

      <section className="section deliverables-section reveal">
        <div className="section-heading">
          <span className="eyebrow">После расчёта</span>
          <h2>Что получает клиент</h2>
          <p>Не абстрактную форму обратной связи, а набор данных для инженерного разговора.</p>
        </div>
        <div className="deliverables-grid">
          {clientDeliverables.map((item) => <article key={item}>{item}</article>)}
        </div>
      </section>

      <section className="section process-section" id="process">
        <div className="section-heading wide reveal">
          <span className="eyebrow">Проектирование</span>
          <h2>Производство, покраска, доставка и монтаж в одном маршруте</h2>
        </div>
        <div className="process-layout">
          <div className="process-photo reveal">
            <img src={visualAssets.engineering} alt="Инженерное проектирование промышленного оборудования" />
          </div>
          <ol className="process-list">
            {processSteps.map((step, index) => (
              <li className="reveal" key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section dark-band">
        <div className="section-heading wide reveal">
          <span className="eyebrow">Промышленные преимущества</span>
          <h2>Больше порядка, меньше ручной борьбы со складом</h2>
        </div>
        <div className="advantage-grid">
          {advantages.map((advantage, index) => {
            const icons = [Gauge, Warehouse, Zap, ShieldCheck, Truck, Building2];
            const Icon = icons[index % icons.length];
            return (
              <article className="reveal" key={advantage.title}>
                <Icon className="card-icon" size={30} />
                <h3>{advantage.title}</h3>
                <p>{advantage.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section cases-section">
        <div className="section-heading wide reveal">
          <span className="eyebrow">Сценарии применения</span>
          <h2>Для цеха, склада, металлообработки и тяжёлого производства</h2>
        </div>
        <div className="case-grid">
          {cases.map((item) => (
            <article className="reveal" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section engineer-section reveal">
        <div className="engineer-card">
          <div>
            <span className="eyebrow">Данные для инженера</span>
            <h2>Что лучше подготовить перед расчётом</h2>
            <p>Если части данных пока нет, калькулятор всё равно даст ориентир. Точный расчёт инженер сделает после уточнения.</p>
          </div>
          <div className="engineer-list">
            {engineerData.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
      </section>

      <section className="section faq-section" id="faq">
        <div className="section-heading wide reveal">
          <span className="eyebrow">FAQ</span>
          <h2>Вопросы, которые обычно задают перед проектированием</h2>
        </div>
        <div className="faq-list">
          {faq.map((item) => (
            <details className="reveal" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta" id="final">
        <div>
          <BrandMark compact />
          <span className="eyebrow">Следующий шаг</span>
          <h2>Получите предварительный подбор системы хранения под ваш металл</h2>
          <p>Заполните калькулятор, а инженер проверит нагрузку, габариты, способ загрузки и составит предложение.</p>
          <a className="primary-button" href="#calculator">Перейти к калькулятору</a>
        </div>
      </section>

      <section className="section contacts-section" id="contacts">
        <div className="contact-panel reveal">
          <div>
            <span className="eyebrow">Связаться с инженером</span>
            <h2>Обсудим металл, нагрузку, помещение и способ загрузки</h2>
            <p>Заявку и параметры расчёта можно передать в вашу CRM, 1С или складскую систему, чтобы менеджер сразу видел исходные данные и быстрее готовил предложение.</p>
          </div>
          <div className="contact-list">
            {contacts.phones.map((phone) => <a href={phone.href} key={phone.href}><Phone size={18} />{phone.label}</a>)}
            <a href={contacts.email.href}><Mail size={18} />{contacts.email.label}</a>
            <span><MapPin size={18} />{contacts.address}</span>
          </div>
          <a className="primary-button" href="#calculator">Рассчитать систему хранения</a>
        </div>
      </section>

      <footer className="site-footer">
        <BrandMark />
        <div className="footer-contacts">
          {contacts.phones.map((phone) => <a href={phone.href} key={phone.href}>{phone.label}</a>)}
          <a href={contacts.email.href}>{contacts.email.label}</a>
          <span>{contacts.address}</span>
        </div>
        <a href="#calculator">Рассчитать систему хранения</a>
      </footer>

      <a className="sticky-cta" href="#calculator">Расчёт</a>
    </main>
  );
}

function pickEquipmentImage(productType: string) {
  if (productType === "cantilever") return visualAssets.steelProfile;
  if (productType === "automated") return visualAssets.engineering;
  if (productType === "rollout" || productType === "hybrid") return visualAssets.forklift;
  if (productType === "honeycomb") return visualAssets.metalCoils;
  if (productType === "custom") return visualAssets.productionLine;
  return visualAssets.warehouse;
}
