import { BrandMark } from "@/components/BrandMark";
import { Calculator } from "@/components/Calculator";
import { LeadForm } from "@/components/LeadForm";
import { LinePageStyles } from "@/components/LinePageStyles";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import { visualAssets } from "@/data/storageSystems/visualAssets";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  ChevronRight,
  ClipboardCheck,
  Factory,
  Globe2,
  Layers3,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  PackageCheck,
  PhoneCall,
  Quote,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Warehouse,
  Wrench,
  Zap
} from "lucide-react";

const contacts = {
  phones: [
    { label: "+7 (499) 403-39-62", href: "tel:+74994033962" },
    { label: "+7 (495) 741-87-10", href: "tel:+74957418710" }
  ],
  email: { label: "info@kbparus.ru", href: "mailto:info@kbparus.ru" },
  address: "МО, г. Ногинск, 1-й Кардолентный проезд, д. 5",
  worktime: "Пн–Пт 9:00–18:00"
};

const metrics = [
  { value: "1.5 млн. м²", label: "выполненных работ" },
  { value: "3000+", label: "довольных покупателей" },
  { value: "700+", label: "обслужили городов" },
  { value: "15+ лет", label: "производим оборудование" }
];

const nav = [
  ["Калькулятор", "#calculator"],
  ["Кейсы", "#cases"],
  ["География", "#geography"],
  ["О компании", "#about"],
  ["FAQ", "#faq"],
  ["Контакты", "#contacts"]
] as const;

const storedMaterials = [
  { title: "Листовой металл", text: "Пачки листа, форматные заготовки, деловые обрезки.", image: visualAssets.sheetMetal, icon: Layers3 },
  { title: "Трубы и профиль", text: "Круглые и профильные трубы, уголок, швеллер, балка.", image: visualAssets.tubesProfile, icon: Boxes },
  { title: "Сортовой прокат", text: "Длинномер, пачки заготовок и смешанная номенклатура.", image: visualAssets.steelProfile, icon: Warehouse },
  { title: "Оснастка и комплектующие", text: "Инструмент, расходники, кабель, паллеты и складские позиции.", image: visualAssets.warehouse, icon: PackageCheck }
];

const cases = [
  {
    customer: "Металлообрабатывающий цех",
    title: "Организовали листовой металл рядом с зоной резки",
    result: "Материал перестал занимать проходы, оператор быстрее подает нужный лист к станку.",
    image: visualAssets.productionLine
  },
  {
    customer: "Склад металлопроката",
    title: "Разделили трубы и профиль по типоразмерам",
    result: "Погрузчик подъезжает к нужной зоне без перекладки соседних пачек.",
    image: visualAssets.tubesProfile
  },
  {
    customer: "Производство металлоконструкций",
    title: "Подобрали консольное хранение под длинномер",
    result: "Склад стал понятнее для мастеров, а выдача металла стала безопаснее.",
    image: visualAssets.steelProfile
  },
  {
    customer: "Сервисный участок",
    title: "Собрали компактную систему с выкатными кассетами",
    result: "Лист и заготовки доступны без лишних перемещений и повреждений.",
    image: visualAssets.forklift
  }
];

const geoProjects = [
  { city: "Москва", company: "производство металлоконструкций", x: 18, y: 54 },
  { city: "Санкт-Петербург", company: "склад металлопроката", x: 22, y: 38 },
  { city: "Казань", company: "машиностроительный цех", x: 35, y: 58 },
  { city: "Екатеринбург", company: "участок лазерной резки", x: 49, y: 61 },
  { city: "Новосибирск", company: "производственный склад", x: 64, y: 63 },
  { city: "Краснодар", company: "склад труб и профиля", x: 21, y: 76 }
];

const reviews = [
  {
    name: "Виктор М.",
    role: "руководитель склада",
    text: "Понравилось, что нам не пытались продать абстрактный стеллаж. Сначала разобрали металл, габариты, погрузчик и только потом предложили схему."
  },
  {
    name: "Александр Т.",
    role: "начальник производства",
    text: "После внедрения стало проще искать нужный профиль. Сотрудники меньше перекладывают металл, проходы свободнее."
  },
  {
    name: "Николай Б.",
    role: "главный инженер",
    text: "Хороший инженерный подход: сразу посчитали нагрузку, опоры, высоту и варианты расширения. Это важнее красивой картинки."
  },
  {
    name: "Сергей А.",
    role: "директор",
    text: "Нужна была система с запасом по нагрузке и нормальной покраской. Получили понятное решение под помещение, а не типовую витрину."
  }
];

const aboutMetrics = [
  { value: "2009", label: "работаем с промышленным оборудованием" },
  { value: "15+ лет", label: "проектируем и производим решения" },
  { value: "3000+", label: "покупателей оборудования" },
  { value: "18 мес.", label: "гарантийный подход к продукции" }
];

const advantages = [
  { title: "Инженерный подбор", text: "Считаем нагрузку, габариты, способ загрузки и реальные ограничения помещения.", icon: BadgeCheck },
  { title: "Собственное производство", text: "Проектирование, металлообработка, покраска и сборка остаются в одной цепочке.", icon: Factory },
  { title: "Быстрый доступ к металлу", text: "Материал получает адрес, а погрузчик или кран-балка работают без лишней перекладки.", icon: Zap },
  { title: "Безопасность склада", text: "Проверяем опоры, нагрузку, проходы, зоны обслуживания и запас прочности.", icon: ShieldCheck },
  { title: "Доставка и монтаж", text: "Учитываем логистику, подъезд, сборку и ввод оборудования на объекте.", icon: Truck },
  { title: "Готовность к учету", text: "Заявку и параметры можно передавать в CRM, 1С или складскую систему.", icon: ClipboardCheck }
];

const shipmentSteps = [
  { title: "Получаем заявку", text: "Фиксируем задачу, материал, размеры, нагрузку и условия склада.", icon: MessageCircle },
  { title: "Выполняем расчет", text: "Подбираем конструкцию, опции, покраску, доставку и монтаж.", icon: Wrench },
  { title: "Отгружаем на объект", text: "Готовим оборудование, документы и передаем систему в монтаж.", icon: Route }
];

const partners = ["Delem", "Uniteller", "Purelogic", "HIWIN", "Металлообработка", "Машиностроение"];

const faq = [
  {
    question: "Как понять, какая система хранения подойдет нашему складу?",
    answer: "Нужно оценить материал, габариты, вес пачек, частоту отбора, технику загрузки и ограничения помещения. Калькулятор собирает первичные данные, а инженер проверяет схему."
  },
  {
    question: "Можно ли хранить трубы, профиль, балки и швеллер?",
    answer: "Да. Для длинномера обычно подходят консольные, ячеистые или специальные системы под погрузчик и кран-балку."
  },
  {
    question: "Можно ли хранить листовой металл вертикально или в кассетах?",
    answer: "Да. Лист можно хранить вертикально, в кассетах под погрузчик или в выкатных кассетах. Выбор зависит от формата листа, веса пачки и частоты доступа."
  },
  {
    question: "Как рассчитывается нагрузка?",
    answer: "Берется максимальный вес материала на полку или кассету, количество уровней, схема опирания и способ загрузки. После этого инженер закладывает запас прочности."
  },
  {
    question: "Можно ли изготовить систему под размеры нашего помещения?",
    answer: "Да. Мы учитываем высоту, ширину проходов, ворота, колонны, зоны обслуживания и работу погрузчика или кран-балки."
  },
  {
    question: "Можно ли загружать металл погрузчиком или кран-балкой?",
    answer: "Да. Способ загрузки выбирается заранее, потому что от него зависит конструкция, доступ к ячейкам и требования к безопасности."
  },
  {
    question: "Сколько места можно сэкономить?",
    answer: "Зависит от текущего склада, номенклатуры и высоты помещения. Обычно экономия появляется за счет вертикального объема, адресного хранения и свободных проходов."
  },
  {
    question: "Делаете ли вы доставку и монтаж?",
    answer: "Да. Доставку и монтаж можно включить в предложение после уточнения состава системы и условий объекта."
  },
  {
    question: "Можно ли потом расширить систему?",
    answer: "Да. Расширение можно предусмотреть на этапе проектирования: по секциям, башням, кассетам или дополнительным зонам хранения."
  },
  {
    question: "Можно ли передавать заявки и расчеты в CRM, 1С или складскую систему?",
    answer: "Да, заявки и расчеты можно передавать в вашу CRM или учетную систему. Это нужно, чтобы менеджер сразу видел параметры запроса и быстрее готовил предложение."
  }
];

export default function Home() {
  return (
    <main className="line-page" id="top">
      <LinePageStyles />

      <header className="line-header">
        <BrandMark />
        <nav aria-label="Навигация по сайту">
          <div className="catalog-menu">
            <a href="#catalog" className="catalog-trigger"><Menu size={16} />Каталог</a>
            <div className="catalog-dropdown" aria-label="Разделы каталога">
              {excelHomeCatalog.map((item) => (
                <a href={`/catalog/${item.id}`} key={item.id}>
                  <strong>{item.title}</strong>
                  <ChevronRight size={16} />
                </a>
              ))}
            </div>
          </div>
          {nav.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
        </nav>
        <div className="line-header-contact">
          <a className="social-btn telegram" href="mailto:info@kbparus.ru" aria-label="Написать в Telegram"><Send size={18} /></a>
          <a className="social-btn whatsapp" href={contacts.phones[0].href} aria-label="Связаться в WhatsApp"><MessageCircle size={18} /></a>
          <div className="phone-stack">
            {contacts.phones.map((phone) => (
              <a className="phone-pill" href={phone.href} key={phone.href}>
                <PhoneCall size={17} />
                {phone.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      <section className="line-hero">
        <div className="line-hero-bg" aria-hidden="true">
          <img src={visualAssets.hero} alt="" />
        </div>
        <div className="line-hero-overlay" />
        <div className="line-hero-inner">
          <div className="hero-quick-links" aria-label="Быстрые разделы">
            {excelHomeCatalog.slice(0, 4).map((item) => (
              <a href={`/catalog/${item.id}`} key={item.id}><span />{item.title}</a>
            ))}
          </div>
          <div className="line-hero-content reveal">
            <span className="line-kicker">КБ Парус / складские системы для металла</span>
            <h1><strong>Системы хранения</strong> металла</h1>
            <p>
              Подбор, производство и внедрение систем для листа, труб, профиля, сортового проката и складской логистики.
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
          <div className="hero-video-control reveal">
            <button type="button" aria-label="Видеообзор оборудования"><span /></button>
            <p>Видеообзор оборудования и производственного процесса</p>
          </div>
        </div>
      </section>

      <section className="line-section" id="catalog">
        <div className="section-title-row reveal">
          <div>
            <span className="line-kicker">Каталог оборудования</span>
            <h2>Разделы для хранения металла и складской логистики</h2>
          </div>
          <p>Каталог собран по утвержденной структуре ассортимента: без лишних разделов и внутренних пометок.</p>
        </div>
        <div className="line-catalog">
          {excelHomeCatalog.map((item, index) => (
            <article className={item.featured ? "catalog-card catalog-card-featured reveal" : "catalog-card reveal"} key={item.id}>
              <img src={item.image} alt={item.title} />
              <div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <a href={`/catalog/${item.id}`}>Перейти в раздел <ArrowRight size={16} /></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="line-section storage-materials">
        <div className="section-title-row reveal">
          <div>
            <span className="line-kicker">Что можно хранить</span>
            <h2>От листа до длинномера: один склад без хаоса</h2>
          </div>
          <p>Показываем не абстрактные карточки, а реальные сценарии: материал, способ доступа и техника загрузки.</p>
        </div>
        <div className="material-grid">
          {storedMaterials.map((item) => {
            const Icon = item.icon;
            return (
              <article className="material-card reveal" key={item.title}>
                <img src={item.image} alt={item.title} />
                <div>
                  <Icon size={26} />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="before-after-section">
        <div className="section-title-row reveal">
          <div>
            <span className="line-kicker">До / после склада</span>
            <h2>Из металла на полу в управляемую систему хранения</h2>
          </div>
        </div>
        <div className="before-after-grid">
          <article className="before-after-card reveal">
            <img src={visualAssets.beforeWarehouse} alt="До внедрения: металл на полу и хаос на складе" />
            <div><span>До</span><h3>Хаос, металл на полу</h3><p>Проходы заняты, материал сложно найти, погрузчик тратит время на перекладку.</p></div>
          </article>
          <article className="before-after-card is-after reveal">
            <img src={visualAssets.afterWarehouse} alt="После внедрения: система хранения и порядок на складе" />
            <div><span>После</span><h3>Система хранения, порядок</h3><p>Материал получает адрес, доступ становится быстрее, склад готов к росту.</p></div>
          </article>
        </div>
      </section>

      <Calculator />

      <Banner
        title="Получите бесплатный расчет стоимости оборудования"
        text="Инженер проверит выбранные размеры, нагрузку, количество полок, башен и опции, а затем подготовит предложение под объект."
        href="#contacts"
        action="Оставить заявку"
      />

      <section className="line-section" id="cases">
        <div className="section-title-row reveal">
          <div>
            <span className="line-kicker">Кейсы</span>
            <h2>Сценарии внедрения для производственных складов</h2>
          </div>
          <div className="slider-arrows" aria-label="Навигация по кейсам">
            <button type="button"><ArrowLeft size={24} /></button>
            <button type="button"><ArrowRight size={24} /></button>
          </div>
        </div>
        <div className="case-slider">
          {cases.map((item) => (
            <article className="case-card reveal" key={item.title}>
              <img src={item.image} alt={item.title} />
              <a href="#contacts" aria-label={`Обсудить кейс: ${item.title}`}><ArrowRight size={24} /></a>
              <h3>{item.customer}</h3>
              <strong>{item.title}</strong>
              <p>{item.result}</p>
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
        <div className="section-title-row reveal">
          <div>
            <span className="line-kicker">География поставок</span>
            <h2>Поставляем оборудование по России</h2>
          </div>
          <p>Наводите на точки, чтобы увидеть пример направления проекта и город поставки.</p>
        </div>
        <div className="geo-map-stage reveal" aria-label="Интерактивная карта поставок">
          <svg className="russia-silhouette" viewBox="0 0 1000 420" aria-hidden="true">
            <path d="M43 205 88 176l73 9 58-44 88 7 42-45 87 28 59-23 88 36 82-31 88 33 114 14 86 47-41 54-104-13-68 50-119-18-83 43-92-30-76 43-118-37-74 33-91-42-89 16-51-51Z" />
            <path d="M132 261 195 250l46 31-30 43-77 13-48-33 46-43Z" />
            <path d="M760 252 845 242l90 33-47 38-105-9-23-52Z" />
          </svg>
          {geoProjects.map((item) => (
            <button className="geo-point" style={{ left: `${item.x}%`, top: `${item.y}%` }} type="button" key={item.city}>
              <MapPin size={18} />
              <span className="geo-popover"><strong>{item.city}</strong>{item.company}</span>
            </button>
          ))}
          <div className="geo-stat-card">
            <Globe2 size={34} />
            <strong>700+ городов</strong>
            <span>опыт поставок и обслуживания оборудования</span>
          </div>
        </div>
      </section>

      <section className="line-section reviews-section" id="reviews">
        <div className="section-title-row reveal">
          <div>
            <span className="line-kicker">Отзывы</span>
            <h2>Покупатели хвалят качество нашего оборудования</h2>
          </div>
          <div className="slider-arrows" aria-label="Навигация по отзывам">
            <button type="button"><ArrowLeft size={24} /></button>
            <button type="button"><ArrowRight size={24} /></button>
          </div>
        </div>
        <div className="review-slider">
          {reviews.map((review) => (
            <article className="review-card reveal" key={review.name}>
              <div className="review-avatar"><Quote size={24} /></div>
              <div>
                <strong>{review.name}</strong>
                <span>{review.role}</span>
                <div className="stars" aria-label="5 звезд">{Array.from({ length: 5 }).map((_, index) => <Star size={16} fill="currentColor" key={index} />)}</div>
              </div>
              <p>{review.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="line-about reveal" id="about">
        <div className="about-copy">
          <span className="line-kicker">О компании</span>
          <h2>Мы проектируем и производим промышленное оборудование под задачи заказчика</h2>
          <p>
            КБ Парус работает с 2009 года. Мы занимаемся промышленным оборудованием, автоматизацией, металлообработкой
            и инженерными решениями, которые должны работать в реальном цехе, а не только хорошо выглядеть в каталоге.
          </p>
          <div className="about-features">
            <span><Factory size={20} />Собственное производство</span>
            <span><Wrench size={20} />Проектирование под задачу</span>
            <span><ShieldCheck size={20} />Расчет под нагрузку</span>
          </div>
          <a className="line-secondary" href="#contacts">Связаться с инженером</a>
        </div>
        <div className="line-metrics">
          {aboutMetrics.map((item) => <article key={item.value}><strong>{item.value}</strong><span>{item.label}</span></article>)}
        </div>
      </section>

      <section className="line-main-site-banner reveal">
        <div>
          <BrandMark compact />
          <span>Компания «КБ Парус» производит и поставляет станки по металлообработке</span>
          <h2>Станки с ЧПУ PARUS</h2>
        </div>
        <a className="line-primary" href="https://www.kbparus.ru/" target="_blank" rel="noreferrer">Каталог kbparus.ru</a>
      </section>

      <section className="line-section">
        <div className="section-title-center reveal">
          <h2>Выбирая нас, вы получаете <span>множество преимуществ</span></h2>
        </div>
        <div className="line-advantages">
          {advantages.map((item, index) => {
            const Icon = item.icon;
            return (
              <article className={index % 2 === 1 ? "advantage-card is-blue reveal" : "advantage-card reveal"} key={item.title}>
                <div className="icon-medallion"><Icon size={30} /></div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="line-section">
        <div className="section-title-row reveal">
          <div>
            <span className="orange-title">3 шага</span>
            <h2>для отгрузки оборудования на объект</h2>
          </div>
          <p>Каждый этап производственного процесса строго контролируется, чтобы оборудование приехало готовым к монтажу.</p>
        </div>
        <div className="line-steps">
          {shipmentSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article className="step-card reveal" key={step.title}>
                <span>Шаг {String(index + 1).padStart(2, "0")}</span>
                <Icon size={28} />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="line-section partners-section">
        <div className="section-title-row reveal">
          <div>
            <span className="line-kicker">Партнеры</span>
            <h2>Партнеры, которые нам доверяют</h2>
          </div>
          <div className="slider-arrows" aria-label="Навигация по партнерам">
            <button type="button"><ArrowLeft size={24} /></button>
            <button type="button"><ArrowRight size={24} /></button>
          </div>
        </div>
        <div className="line-partners">
          {partners.map((partner) => <article className="reveal" key={partner}>{partner}</article>)}
        </div>
      </section>

      <section className="line-section" id="faq">
        <div className="section-title-row reveal">
          <div>
            <span className="line-kicker">FAQ</span>
            <h2>Отвечаем на частые вопросы покупателей</h2>
          </div>
          <a className="line-secondary" href="#request">Задать свой вопрос</a>
        </div>
        <div className="line-faq">
          {faq.map((item) => (
            <details className="reveal" key={item.question}>
              <summary><span />{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="line-contact-form" id="request">
        <div className="reveal">
          <span className="line-kicker">Не нашли, что искали?</span>
          <h2>Оставьте заявку, и мы поможем подобрать систему хранения</h2>
          <p>Свяжемся с вами, уточним исходные данные и бесплатно проконсультируем по оборудованию.</p>
        </div>
        <LeadForm title="Получить консультацию" />
      </section>

      <section className="line-contacts" id="contacts">
        <div className="contacts-heading reveal">
          <span>Свяжитесь с нами</span>
          <h2>любым удобным способом</h2>
        </div>
        <div className="contact-cards">
          <article className="contact-card reveal">
            <span><PhoneCall size={20} />Телефон</span>
            {contacts.phones.map((phone) => <a href={phone.href} key={phone.href}>{phone.label}</a>)}
            <a href={contacts.email.href}>{contacts.email.label}</a>
          </article>
          <article className="contact-card reveal">
            <span><MapPin size={20} />Адрес</span>
            <strong>{contacts.address}</strong>
            <p>{contacts.worktime}</p>
          </article>
          <article className="contact-card reveal">
            <span><Sparkles size={20} />Социальные сети</span>
            <div className="social-row">
              <a className="telegram" href={contacts.email.href}><Send size={30} /></a>
              <a className="whatsapp" href={contacts.phones[0].href}><MessageCircle size={30} /></a>
              <a className="vk" href="https://www.kbparus.ru/" target="_blank" rel="noreferrer">VK</a>
            </div>
          </article>
        </div>
        <iframe
          className="reveal"
          src="https://yandex.ru/map-widget/v1/?mode=search&text=%D0%9D%D0%BE%D0%B3%D0%B8%D0%BD%D1%81%D0%BA%2C%201-%D0%B9%20%D0%9A%D0%B0%D1%80%D0%B4%D0%BE%D0%BB%D0%B5%D0%BD%D1%82%D0%BD%D1%8B%D0%B9%20%D0%BF%D1%80%D0%BE%D0%B5%D0%B7%D0%B4%2C%205&z=16"
          title="Карта: КБ Парус, Ногинск"
          loading="lazy"
        />
      </section>

      <footer className="line-footer">
        <div>
          <BrandMark compact />
          <p>Системы хранения металла</p>
        </div>
        <nav>
          <a href="#top">Главная</a>
          <a href="#catalog">Каталог</a>
          {nav.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
        </nav>
        <div className="footer-contacts">
          {contacts.phones.map((phone) => <a href={phone.href} key={phone.href}><PhoneCall size={16} />{phone.label}</a>)}
          <a href={contacts.email.href}><Mail size={16} />{contacts.email.label}</a>
          <span><MapPin size={16} />{contacts.address}</span>
        </div>
      </footer>
    </main>
  );
}

function Banner({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
  return (
    <section className="line-banner reveal">
      <div>
        <span className="line-kicker">Бесплатный расчет</span>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <a className="line-primary" href={href}>{action}</a>
    </section>
  );
}
