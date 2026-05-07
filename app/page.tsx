import { BrandMark } from "@/components/BrandMark";
import { Calculator } from "@/components/Calculator";
import { LeadForm } from "@/components/LeadForm";
import { LinePageStyles } from "@/components/LinePageStyles";
import { SliderControls } from "@/components/SliderControls";
import { excelHomeCatalog } from "@/data/storageSystems/excelCatalog";
import { visualAssets } from "@/data/storageSystems/visualAssets";
import {
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
  { value: "1,5 млн м²", label: "выполненных работ" },
  { value: "3000+", label: "довольных покупателей" },
  { value: "700+", label: "обслужили городов" },
  { value: "15+ лет", label: "производим оборудование" }
];

const heroSignals = [
  "Под лист, трубы и профиль",
  "Под кран-балку и погрузчик",
  "Под реальные ограничения цеха"
];

const nav = [
  ["Калькулятор", "#calculator"],
  ["Кейсы", "#cases"],
  ["География", "#geography"],
  ["О компании", "#about"],
  ["FAQ", "#faq"],
  ["Контакты", "#contacts"]
] as const;

function getCatalogBadge(id: string) {
  if (id.includes("auto") || id.includes("automated")) return "Автоматизация";
  if (id.includes("manual")) return "Ручная система";
  if (id.includes("pipe") || id.includes("cantilever")) return "Трубы и профиль";
  if (id.includes("warehouse") || id.includes("erp")) return "Склад и учет";
  if (id.includes("lifting")) return "Подача и подъем";
  return "Категория";
}

function getCatalogPlaceholder(id: string) {
  if (id.includes("erp")) return { icon: Globe2, label: "Система учёта" };
  if (id.includes("lifting")) return { icon: Truck, label: "Подача и подъём" };
  if (id.includes("warehouse")) return { icon: Warehouse, label: "Складская логистика" };
  if (id.includes("cable")) return { icon: Layers3, label: "Кабель и оснастка" };
  if (id.includes("packing")) return { icon: PackageCheck, label: "Подготовка к отгрузке" };
  if (id.includes("carousel")) return { icon: Boxes, label: "Вертикальное хранение" };
  return { icon: Factory, label: "Изображение добавим" };
}

const storedMaterials = [
  { title: "Листовой металл", text: "Пачки листа, форматные заготовки, деловые обрезки.", label: "Лист / кассеты", icon: Layers3 },
  { title: "Трубы и профиль", text: "Круглые и профильные трубы, уголок, швеллер, балка.", label: "Трубы / профиль", icon: Boxes },
  { title: "Сортовой прокат", text: "Пруток, уголок, швеллер, балка, пачки заготовок и смешанная номенклатура.", label: "Пруток / балка", icon: Warehouse },
  { title: "Оснастка и комплектующие", text: "Инструмент, расходники, кабель, паллеты и складские позиции.", label: "Оснастка / ЗИП", icon: PackageCheck }
];

const cases = [
  {
    customer: "Компания-заказчик",
    title: "Хранение листового металла рядом с зоной резки",
    task: "Убрать листы из проходов и ускорить подачу материала к станку.",
    result: "Система хранения освободила рабочую зону и упростила поиск нужного формата.",
    image: visualAssets.productionLine
  },
  {
    customer: "Компания-заказчик",
    title: "Адресное хранение труб и профиля",
    task: "Разделить типоразмеры и убрать постоянную перекладку пачек.",
    result: "Погрузчик подъезжает к нужной зоне без лишних маневров и потери времени.",
    image: visualAssets.tubesProfile
  },
  {
    customer: "Компания-заказчик",
    title: "Консольные стеллажи для металлоконструкций",
    task: "Организовать балки, швеллер и профиль с доступом кран-балкой.",
    result: "Склад стал понятнее для мастеров, а выдача металла стала безопаснее.",
    image: visualAssets.steelProfile
  },
  {
    customer: "Компания-заказчик",
    title: "Выкатные кассеты для частого отбора",
    task: "Дать прямой доступ к листу и заготовкам без повреждений.",
    result: "Оператор получает нужную кассету без разбора соседних уровней.",
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

const partners = [
  { name: "Delem", mark: "DE" },
  { name: "Uniteller", mark: "UN" },
  { name: "Purelogic", mark: "PL" },
  { name: "HIWIN", mark: "HW" },
  { name: "Металлообработка", mark: "М" },
  { name: "Машиностроение", mark: "МП" }
];

const faq = [
  {
    question: "Как понять, какая система хранения подойдет нашему складу?",
    answer: "Нужно оценить материал, габариты, вес пачек, частоту отбора, технику загрузки и ограничения помещения. Калькулятор собирает первичные данные, а инженер проверяет схему."
  },
  {
    question: "Можно ли хранить трубы, профиль, балки и швеллер?",
    answer: "Да. Для труб, профиля, балок и швеллера обычно подходят консольные, ячеистые или специальные системы под погрузчик и кран-балку."
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
          <div className="line-hero-content reveal">
            <span className="line-kicker">КБ Парус / складские системы для металла</span>
            <h1><strong>Системы хранения</strong> металла</h1>
            <p>
              Подбор, производство и внедрение систем для листа, труб, профиля, сортового проката и складской логистики.
            </p>
            <div className="hero-signal-row" aria-label="Ключевые преимущества">
              {heroSignals.map((item) => <span key={item}>{item}</span>)}
            </div>
            <div className="line-actions">
              <a className="line-primary" href="#calculator">Рассчитать стоимость</a>
              <a className="line-secondary" href="#contacts">Связаться с инженером</a>
            </div>
            <div className="hero-calculator-spotlight">
              <div>
                <span>Калькулятор стоимости</span>
                <strong>Предварительный расчет системы хранения за несколько шагов</strong>
                <p>Клиент выбирает тип оборудования, размеры, нагрузку и опции, а инженер получает готовые вводные для предложения.</p>
              </div>
              <a href="#calculator">
                Открыть калькулятор <ArrowRight size={18} />
              </a>
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
        </div>
      </section>

      <section className="line-section catalog-section" id="catalog">
        <div className="section-title-row is-single reveal">
          <div>
            <span className="line-kicker">Каталог оборудования</span>
            <h2>Разделы для хранения металла и складской логистики</h2>
          </div>
        </div>
        <div className="catalog-summary reveal">
          <article>
            <strong>17 разделов</strong>
            <span>от листового металла до складской логистики и ERP</span>
          </article>
          <article>
            <strong>Подбор по задаче</strong>
            <span>лист, трубы, профиль, паллеты, кабель, складская техника и учет</span>
          </article>
          <article>
            <strong>Фото добавляются</strong>
            <span>категории без утвержденного изображения показываются с аккуратной заглушкой</span>
          </article>
        </div>
        <div className="catalog-grid">
          {excelHomeCatalog.map((item, index) => {
            const placeholder = getCatalogPlaceholder(item.id);
            const PlaceholderIcon = placeholder.icon;
            const hasImage = Boolean(item.featured) && item.id !== "manual-sheet-metal";

            return (
              <a className="catalog-card reveal" href={`/catalog/${item.id}`} key={item.id}>
                <div className={`catalog-card-visual${hasImage ? " has-image" : " is-placeholder"}`}>
                  {hasImage ? (
                    <img src={item.image} alt={item.title} />
                  ) : (
                    <div className="catalog-placeholder" aria-hidden="true">
                      <PlaceholderIcon size={34} />
                      <span>{placeholder.label}</span>
                    </div>
                  )}
                </div>
                <div className="catalog-card-body">
                  <div className="catalog-card-meta">
                    <small>{getCatalogBadge(item.id)}</small>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{hasImage ? item.scenario : item.summary}</p>
                  <b>
                    Перейти в категорию <ArrowRight size={16} />
                  </b>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="line-section storage-materials">
        <div className="section-title-row reveal">
          <div>
            <span className="line-kicker">Что можно хранить</span>
            <h2>От листа до труб и профиля: один склад без хаоса</h2>
          </div>
          <p>Показываем материал понятными группами: что лежит на складе, как к нему подходят и чем его забирают.</p>
        </div>
        <div className="material-grid">
          {storedMaterials.map((item) => {
            const Icon = item.icon;
            return (
              <article className="material-card reveal" key={item.title}>
                <div className="material-placeholder" aria-hidden="true">
                  <Icon size={46} />
                  <strong>{item.label}</strong>
                </div>
                <div>
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
            <h2>Кейсы внедрения систем хранения</h2>
          </div>
          <SliderControls targetId="cases-slider" label="Навигация по кейсам" />
        </div>
        <div className="case-slider" id="cases-slider">
          {cases.map((item) => (
            <article className="case-card reveal" key={item.title}>
              <img src={item.image} alt={item.title} />
              <a href="#contacts" aria-label={`Обсудить кейс: ${item.title}`}><ArrowRight size={24} /></a>
              <h3>{item.customer}</h3>
              <strong>{item.title}</strong>
              <p><b>Задача:</b> {item.task}</p>
              <p><b>Результат:</b> {item.result}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="line-section line-map-section" id="geography">
        <div className="section-title-row reveal">
          <div>
            <span className="line-kicker">География поставок</span>
            <h2>Поставляем оборудование по России</h2>
          </div>
          <p>Ниже оставлена рабочая Яндекс.Карта. На следующем этапе точки поставок можно хранить в админке и выводить по городам.</p>
        </div>
        <div className="geo-yandex-stage reveal">
          <iframe
            src="https://yandex.ru/map-widget/v1/?ll=82.923450%2C55.028190&z=3&l=map"
            title="География поставок КБ Парус по России"
            loading="lazy"
          />
          <div className="geo-project-list" aria-label="Примеры городов поставок">
            <strong>Примеры направлений</strong>
            {geoProjects.map((item) => (
              <span key={item.city}><MapPin size={16} />{item.city}: {item.company}</span>
            ))}
            <b><Globe2 size={18} />700+ городов обслуживания</b>
          </div>
        </div>
      </section>

      <section className="line-section reviews-section" id="reviews">
        <div className="section-title-row reveal">
          <div>
            <span className="line-kicker">Отзывы</span>
            <h2>Покупатели хвалят качество нашего оборудования</h2>
          </div>
          <SliderControls targetId="reviews-slider" label="Навигация по отзывам" />
        </div>
        <div className="review-slider" id="reviews-slider">
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
          <SliderControls targetId="partners-slider" label="Навигация по партнерам" />
        </div>
        <div className="line-partners" id="partners-slider">
          {partners.map((partner) => (
            <article className="partner-logo reveal" key={partner.name}>
              <span>{partner.mark}</span>
              <strong>{partner.name}</strong>
            </article>
          ))}
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

