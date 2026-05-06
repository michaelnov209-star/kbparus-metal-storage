import { BrandMark } from "@/components/BrandMark";
import { Calculator } from "@/components/Calculator";
import { LeadForm } from "@/components/LeadForm";
import { LinePageStyles } from "@/components/LinePageStyles";
import { advantages, cases, contacts, faq, processSteps } from "@/data/storageSystems/content";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import { visualAssets } from "@/data/storageSystems/visualAssets";
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

const metrics = [
  { value: "1,5 млн м²", label: "выполненных работ" },
  { value: "3000+", label: "довольных покупателей" },
  { value: "700+", label: "городов обслуживания" },
  { value: "15+ лет", label: "производим оборудование" }
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

const partners = ["Металлообработка", "Машиностроение", "Склады металла", "Производство МК", "Сервисные цеха", "Строительные компании"];

const nav = [
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
        <nav aria-label="Навигация по сайту">
          <div className="catalog-menu">
            <a href="#catalog" className="catalog-trigger">Каталог</a>
            <div className="catalog-dropdown" aria-label="Разделы каталога из Excel">
              {excelHomeCatalog.map((item) => (
                <a href="#catalog" key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.excelCell}</span>
                </a>
              ))}
            </div>
          </div>
          {nav.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
        </nav>
        <div className="line-header-contact">
          {contacts.phones.map((phone) => <a href={phone.href} key={phone.href}>{phone.label}</a>)}
        </div>
      </header>

      <section className="line-hero">
        <div className="line-hero-bg" />
        <div className="line-hero-content reveal">
          <span className="line-kicker">КБ Парус / системы хранения металла</span>
          <h1>Оборудование для хранения металла под ваш склад и производство</h1>
          <p>
            Подбор систем хранения с расчётом по ходовым размерам из Excel: Д×Ш×В, нагрузка, полки, башни и опции. Без лишних
            параметров, с понятной стартовой суммой «от».
          </p>
          <div className="line-actions">
            <a className="line-primary" href="#calculator">Рассчитать стоимость</a>
            <a className="line-secondary" href="#contacts">Связаться с инженером</a>
          </div>
          <div className="hero-metrics" aria-label="Ключевые показатели КБ Парус">
            {metrics.map((item) => (
              <article key={item.value}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>
        <div className="hero-video-card reveal">
          <img src={visualAssets.hero} alt="Промышленный склад с системами хранения" />
          <div className="video-badge">
            <span />
            <strong>Видео-фон можно заменить реальной съёмкой оборудования</strong>
          </div>
        </div>
      </section>

      <section className="line-section" id="catalog">
        <div className="line-section-head reveal">
          <span className="line-kicker">Каталог оборудования</span>
          <h2>Разделы строго из листа «Главная»</h2>
          <p>Публичный каталог не расширяем вручную. Карточки ниже повторяют видимые пункты обновлённого Excel-файла.</p>
        </div>
        <div className="line-catalog">
          {excelHomeCatalog.map((item) => (
            <article className="reveal" key={item.id}>
              <img src={item.image} alt={item.title} />
              <div>
                <small>{item.excelCell}</small>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <span>{item.scenario}</span>
                <a href="#calculator">К расчёту <ArrowRight size={16} /></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Calculator />

      <Banner
        title="Получите бесплатный расчёт стоимости оборудования"
        text="Инженер проверит выбранные размеры, нагрузку, количество полок, башен и опции, а затем подготовит коммерческое предложение."
        href="#contacts"
        action="Оставить заявку"
      />

      <section className="line-section" id="cases">
        <div className="line-section-head reveal">
          <span className="line-kicker">Кейсы</span>
          <h2>Типовые сценарии внедрения</h2>
        </div>
        <div className="line-cases">
          {cases.slice(0, 6).map((item, index) => (
            <article className="reveal" key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <Banner
        title="Поможем подобрать подходящее оборудование"
        text="Если вы не уверены, какую систему выбрать, начните с заявки. Мы уточним материал, помещение, способ загрузки и предложим рабочую схему."
        href="#contacts"
        action="Подобрать решение"
      />

      <section className="line-section line-map-section" id="geography">
        <div className="line-section-head reveal">
          <span className="line-kicker">География поставок</span>
          <h2>Поставляем оборудование по России</h2>
        </div>
        <div className="line-geo">
          <div className="line-geo-card reveal">
            {metrics.slice(0, 3).map((item) => (
              <div key={item.value}><strong>{item.value}</strong><span>{item.label}</span></div>
            ))}
          </div>
          <div className="line-russia-map reveal" aria-label="Карта географии поставок">
            {["Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Новосибирск", "Краснодар"].map((city) => <span key={city}>{city}</span>)}
          </div>
        </div>
      </section>

      <section className="line-section" id="reviews">
        <div className="line-section-head reveal">
          <span className="line-kicker">Отзывы</span>
          <h2>Покупатели хвалят качество нашего оборудования</h2>
        </div>
        <div className="line-slider">
          {reviews.map((review) => (
            <article className="reveal" key={review.name}>
              <p>“{review.text}”</p>
              <strong>{review.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="line-about reveal">
        <div>
          <span className="line-kicker">О нас</span>
          <h2>КБ Парус проектирует и производит промышленное оборудование с 2009 года</h2>
          <p>
            Мы помогаем производствам навести порядок в металле: изучаем номенклатуру, рассчитываем нагрузку, проектируем
            конструкцию и изготавливаем систему под реальные условия склада или цеха.
          </p>
        </div>
        <div className="line-metrics">
          {metrics.map((item) => <article key={item.value}><strong>{item.value}</strong><span>{item.label}</span></article>)}
        </div>
      </section>

      <section className="line-main-site-banner reveal">
        <div>
          <span className="line-kicker">Основной сайт</span>
          <h2>Станки ЧПУ и промышленная автоматизация КБ Парус</h2>
          <p>Перейдите на основной сайт компании, чтобы посмотреть другие направления производства.</p>
        </div>
        <a className="line-primary" href="https://www.kbparus.ru/" target="_blank" rel="noreferrer">Перейти на kbparus.ru</a>
      </section>

      <section className="line-section">
        <div className="line-section-head reveal">
          <span className="line-kicker">Преимущества</span>
          <h2>Почему с нами удобно работать</h2>
        </div>
        <div className="line-advantages">
          {advantages.map((item, index) => {
            const Icon = [Factory, Warehouse, ShieldCheck, Wrench, Truck, CheckCircle2][index % 6];
            return <article className="reveal" key={item.title}><Icon size={28} /><h3>{item.title}</h3><p>{item.text}</p></article>;
          })}
        </div>
      </section>

      <section className="line-section">
        <div className="line-section-head reveal">
          <span className="line-kicker">3 шага</span>
          <h2>От заявки до отгрузки оборудования на объект</h2>
        </div>
        <div className="line-steps">
          {processSteps.slice(0, 3).map((step, index) => (
            <article className="reveal" key={step.title}>
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="line-section">
        <div className="line-section-head reveal">
          <span className="line-kicker">Партнёры</span>
          <h2>Нам доверяют производственные компании</h2>
        </div>
        <div className="line-partners">
          {partners.map((partner) => <article className="reveal" key={partner}>{partner}</article>)}
        </div>
      </section>

      <section className="line-section" id="faq">
        <div className="line-section-head reveal">
          <span className="line-kicker">FAQ</span>
          <h2>Ответы на частые вопросы</h2>
        </div>
        <div className="line-faq">
          {faq.slice(0, 10).map((item) => (
            <details className="reveal" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="line-contact-form" id="request">
        <div className="reveal">
          <span className="line-kicker">Не нашли, что искали?</span>
          <h2>Оставьте заявку, и мы поможем подобрать систему хранения</h2>
          <p>Заявку и параметры расчёта можно передать в CRM, 1С или складскую систему, чтобы менеджер сразу видел исходные данные.</p>
        </div>
        <LeadForm />
      </section>

      <section className="line-contacts" id="contacts">
        <div className="reveal">
          <span className="line-kicker">Свяжитесь с нами</span>
          <h2>Любым удобным способом</h2>
          <div className="line-contact-list">
            {contacts.phones.map((phone) => <a href={phone.href} key={phone.href}><Phone size={20} />{phone.label}</a>)}
            <a href={contacts.email.href}><Mail size={20} />{contacts.email.label}</a>
            <span><MapPin size={20} />{contacts.address}</span>
            <span>Пн–Пт 9:00–18:00</span>
          </div>
        </div>
        <iframe
          className="reveal"
          src="https://yandex.ru/map-widget/v1/?ll=38.437796%2C55.873836&z=16&pt=38.437796,55.873836,pm2rdm"
          title="Карта: КБ Парус, Ногинск"
          loading="lazy"
        />
      </section>

      <footer className="line-footer">
        <BrandMark compact />
        <nav>
          <a href="#catalog">Каталог</a>
          {nav.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
        </nav>
        <div>
          {contacts.phones.map((phone) => <a href={phone.href} key={phone.href}>{phone.label}</a>)}
          <a href={contacts.email.href}>{contacts.email.label}</a>
          <span>{contacts.address}</span>
        </div>
      </footer>
    </main>
  );
}

function Banner({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
  return (
    <section className="line-banner reveal">
      <div>
        <span className="line-kicker">Бесплатный расчёт</span>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <a className="line-primary" href={href}>{action}</a>
    </section>
  );
}
