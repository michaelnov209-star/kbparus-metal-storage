import { BrandMark } from "@/components/BrandMark";
import { Calculator } from "@/components/Calculator";
import { LeadForm } from "@/components/LeadForm";
import { LinePageStyles } from "@/components/LinePageStyles";
import {
  ArrowRight,
  CheckCircle2,
  Factory,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  Warehouse,
  Wrench
} from "lucide-react";
import { advantages, cases, contacts, faq, processSteps, solutionCards } from "@/data/storageSystems/content";
import { visualAssets } from "@/data/storageSystems/visualAssets";

const metrics = [
  { value: "16+", label: "лет инженерного опыта" },
  { value: "1000+", label: "проектов промышленного оборудования" },
  { value: "500+", label: "городов поставок" },
  { value: "1", label: "команда: расчёт, производство, монтаж" }
];

const reviews = [
  {
    name: "Производство металлоконструкций",
    text: "После внедрения системы металл перестал занимать проходы. Погрузчик быстрее подаёт профиль в работу, меньше перекладок и повреждений."
  },
  {
    name: "Склад металлопроката",
    text: "Кассеты помогли разделить партии листа и сделать отбор понятным. Менеджеры быстрее отвечают клиентам по наличию и размерам."
  },
  {
    name: "Машиностроительный цех",
    text: "Важно было вписать хранение в существующий маршрут к станкам. Система получилась компактной и удобной для кран-балки."
  }
];

const partners = ["Металлообработка", "Машиностроение", "Склады металла", "Порошковая окраска", "Сервисные цеха", "Производства МК"];
const nav = [
  ["Каталог", "#catalog"],
  ["Калькулятор", "#calculator"],
  ["Кейсы", "#cases"],
  ["География", "#geography"],
  ["Отзывы", "#reviews"],
  ["FAQ", "#faq"],
  ["Контакты", "#contacts"]
] as const;

export default function Home() {
  return (
    <main className="line-page" id="top">
      <LinePageStyles />
      <header className="line-header">
        <BrandMark />
        <nav>
          {nav.slice(0, 5).map(([label, href]) => <a href={href} key={href}>{label}</a>)}
        </nav>
        <div className="line-header-contact">
          <a href={contacts.phones[0].href}>{contacts.phones[0].label}</a>
          <a className="line-header-btn" href="#contacts">Заявка</a>
        </div>
      </header>

      <section className="line-hero">
        <div className="line-hero-bg" />
        <div className="line-hero-content">
          <span className="line-kicker">КБ Парус / системы хранения металла</span>
          <h1>Оборудование для хранения металла под ваш склад и производство</h1>
          <p>Консольные, кассетные, вертикальные, выкатные и автоматизированные системы. Подбираем решение по металлу, нагрузке, помещению и способу загрузки.</p>
          <div className="line-actions">
            <a className="line-primary" href="#calculator">Рассчитать стоимость</a>
            <a className="line-secondary" href="#contacts">Получить консультацию</a>
          </div>
        </div>
        <div className="line-hero-panel">
          <img src={visualAssets.hero} alt="Промышленный склад металла" />
          <div>
            <strong>подбор под лист / трубу / профиль</strong>
            <span>финальная стоимость уточняется после инженерной проверки</span>
          </div>
        </div>
      </section>

      <section className="line-section" id="catalog">
        <div className="line-section-head">
          <span className="line-kicker">Каталог оборудования</span>
          <h2>Системы хранения металла</h2>
          <p>Структура как у каталога оборудования: быстро понять тип решения, сценарий применения и перейти к расчёту.</p>
        </div>
        <div className="line-catalog">
          {solutionCards.slice(0, 8).map((item) => (
            <article key={item.title}>
              <img src={pickImage(item.type)} alt={item.title} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span>{item.scenario}</span>
                <a href="#calculator">Рассчитать <ArrowRight size={16} /></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Calculator />

      <Banner
        title="Получите бесплатный расчёт стоимости оборудования"
        text="Инженер проверит нагрузку, габариты, способ загрузки и подготовит стартовую конфигурацию под ваш склад."
        href="#contacts"
        action="Оставить заявку"
      />

      <section className="line-section" id="cases">
        <div className="line-section-head">
          <span className="line-kicker">Кейсы</span>
          <h2>Типовые сценарии внедрения</h2>
        </div>
        <div className="line-cases">
          {cases.slice(0, 6).map((item, index) => (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <Banner
        title="Поможем подобрать подходящее оборудование"
        text="Если вы не уверены, что выбрать: консоли, кассеты, вертикальное хранение или гибридную систему, начните с заявки. Мы подскажем маршрут."
        href="#contacts"
        action="Подобрать решение"
      />

      <section className="line-section line-map-section" id="geography">
        <div className="line-section-head">
          <span className="line-kicker">География поставок</span>
          <h2>Поставляем оборудование по России</h2>
        </div>
        <div className="line-geo">
          <div className="line-geo-card">
            {metrics.slice(0, 3).map((item) => (
              <div key={item.value}><strong>{item.value}</strong><span>{item.label}</span></div>
            ))}
          </div>
          <div className="line-russia-map" aria-label="Карта географии поставок">
            {["Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Новосибирск", "Краснодар"].map((city) => <span key={city}>{city}</span>)}
          </div>
        </div>
      </section>

      <section className="line-section" id="reviews">
        <div className="line-section-head">
          <span className="line-kicker">Отзывы</span>
          <h2>Покупатели хвалят качество нашего оборудования</h2>
        </div>
        <div className="line-slider">
          {reviews.map((review) => (
            <article key={review.name}>
              <p>“{review.text}”</p>
              <strong>{review.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="line-about">
        <div>
          <span className="line-kicker">О нас</span>
          <h2>КБ Парус проектирует и производит промышленное оборудование с 2009 года</h2>
          <p>Работаем с металлообработкой, автоматизацией, оборудованием с ЧПУ и инженерными решениями под задачи заказчиков. Системы хранения металла развиваем как отдельное промышленное направление.</p>
        </div>
        <div className="line-metrics">
          {metrics.map((item) => <article key={item.value}><strong>{item.value}</strong><span>{item.label}</span></article>)}
        </div>
      </section>

      <section className="line-main-site-banner">
        <div>
          <span className="line-kicker">Основной сайт</span>
          <h2>Станки ЧПУ и промышленная автоматизация КБ Парус</h2>
          <p>Перейдите на основной сайт компании, чтобы посмотреть другие направления производства.</p>
        </div>
        <a className="line-primary" href="https://www.kbparus.ru/" target="_blank" rel="noreferrer">Перейти на kbparus.ru</a>
      </section>

      <section className="line-section">
        <div className="line-section-head">
          <span className="line-kicker">Преимущества</span>
          <h2>Почему с нами удобно работать</h2>
        </div>
        <div className="line-advantages">
          {advantages.map((item, index) => {
            const Icon = [Factory, Warehouse, ShieldCheck, Wrench, Truck, CheckCircle2][index % 6];
            return <article key={item.title}><Icon size={28} /><h3>{item.title}</h3><p>{item.text}</p></article>;
          })}
        </div>
      </section>

      <section className="line-section">
        <div className="line-section-head">
          <span className="line-kicker">3 шага</span>
          <h2>От заявки до отгрузки оборудования на объект</h2>
        </div>
        <div className="line-steps">
          {processSteps.slice(0, 3).map((step, index) => (
            <article key={step.title}>
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="line-section">
        <div className="line-section-head">
          <span className="line-kicker">Партнёры</span>
          <h2>Нам доверяют производственные компании</h2>
        </div>
        <div className="line-partners">
          {partners.map((partner) => <article key={partner}>{partner}</article>)}
        </div>
      </section>

      <section className="line-section" id="faq">
        <div className="line-section-head">
          <span className="line-kicker">FAQ</span>
          <h2>Ответы на частые вопросы</h2>
        </div>
        <div className="line-faq">
          {faq.slice(0, 10).map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="line-contact-form">
        <div>
          <span className="line-kicker">Не нашли, что искали?</span>
          <h2>Опишите задачу, и мы подскажем подходящий вариант хранения</h2>
          <p>Можно написать своими словами: что храните, какие размеры, какой вес и чем загружаете металл.</p>
        </div>
        <LeadForm title="Форма связи" />
      </section>

      <section className="line-contacts" id="contacts">
        <div>
          <span className="line-kicker">Свяжитесь с нами</span>
          <h2>Любым удобным способом</h2>
          <div className="line-contact-list">
            <a href={contacts.phones[0].href}><Phone size={20} />{contacts.phones[0].label}</a>
            <a href={contacts.phones[1].href}><Phone size={20} />{contacts.phones[1].label}</a>
            <a href={contacts.email.href}><Mail size={20} />{contacts.email.label}</a>
            <span><MapPin size={20} />МО, г. Ногинск, 1-й Кардолентный проезд, д. 5</span>
            <span>Пн–Пт 9:00–18:00</span>
          </div>
        </div>
        <iframe
          title="Карта: КБ Парус, Ногинск"
          src="https://yandex.ru/map-widget/v1/?text=%D0%9C%D0%9E%2C%20%D0%B3.%20%D0%9D%D0%BE%D0%B3%D0%B8%D0%BD%D1%81%D0%BA%2C%201-%D0%B9%20%D0%9A%D0%B0%D1%80%D0%B4%D0%BE%D0%BB%D0%B5%D0%BD%D1%82%D0%BD%D1%8B%D0%B9%20%D0%BF%D1%80%D0%BE%D0%B5%D0%B7%D0%B4%2C%205&z=15"
          loading="lazy"
        />
      </section>

      <footer className="line-footer">
        <BrandMark />
        <nav>{nav.map(([label, href]) => <a href={href} key={href}>{label}</a>)}</nav>
        <div>
          <a href={contacts.phones[0].href}>{contacts.phones[0].label}</a>
          <a href={contacts.email.href}>{contacts.email.label}</a>
          <span>МО, г. Ногинск, 1-й Кардолентный проезд, д. 5</span>
        </div>
      </footer>
    </main>
  );
}

function Banner({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
  return (
    <section className="line-banner">
      <div><h2>{title}</h2><p>{text}</p></div>
      <a className="line-primary" href={href}>{action}</a>
    </section>
  );
}

function pickImage(type: string) {
  if (type === "cantilever") return visualAssets.steelProfile;
  if (type === "vertical") return visualAssets.sheetMetal;
  if (type === "rollout" || type === "hybrid") return visualAssets.forklift;
  if (type === "automated") return visualAssets.engineering;
  if (type === "honeycomb") return visualAssets.tubesProfile;
  if (type === "custom") return visualAssets.productionLine;
  return visualAssets.warehouse;
}
