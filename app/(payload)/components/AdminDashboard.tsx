import { getPayload } from "payload";
import config from "@payload-config";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Boxes,
  Calculator as CalculatorIcon,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  Inbox,
  Layers,
  LayoutDashboard,
  Package,
  Phone,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  UploadCloud
} from "lucide-react";

import { AdminTraining } from "./AdminTraining";

const sections = [
  {
    group: "Контент сайта",
    items: [
      {
        title: "Главная страница",
        text: "Hero, метрики, преимущества, кейсы, отзывы, FAQ, партнёры и CTA-блоки.",
        href: "/admin/globals/home-content",
        cta: "Редактировать главную",
        icon: LayoutDashboard,
        tourId: "card-home"
      },
      {
        title: "Контакты компании",
        text: "Телефоны, адрес, мессенджеры, часы работы и сквозные данные в шапке и футере.",
        href: "/admin/globals/contacts",
        cta: "Проверить контакты",
        icon: Phone
      }
    ]
  },
  {
    group: "Каталог и калькулятор",
    items: [
      {
        title: "Товары каталога",
        text: "Карточки оборудования, фото, галереи, описание, режим цены и привязка к калькулятору.",
        href: "/admin/collections/products",
        cta: "Открыть товары",
        icon: Package,
        tourId: "card-products"
      },
      {
        title: "Профили калькулятора",
        text: "Размеры, нагрузки, базовые цены, коэффициенты и опции расчёта из админки.",
        href: "/admin/collections/calculator-profiles",
        cta: "Настроить расчёты",
        icon: CalculatorIcon,
        tourId: "card-calculator"
      },
      {
        title: "Медиа-библиотека",
        text: "Фото, видео, баннеры и документы для главной, каталога и карточек товаров.",
        href: "/admin/collections/media",
        cta: "Загрузить медиа",
        icon: ImageIcon,
        tourId: "card-media"
      }
    ]
  },
  {
    group: "Продажи",
    items: [
      {
        title: "Заявки с сайта",
        text: "Контакты клиента, источник, UTM, параметры калькулятора и статус передачи.",
        href: "/admin/collections/leads",
        cta: "Посмотреть заявки",
        icon: Inbox
      }
    ]
  }
];

const quickActions = [
  { label: "Новый товар", href: "/admin/collections/products/create", icon: Plus, tourId: "quick-products" },
  { label: "Загрузить фото", href: "/admin/collections/media/create", icon: UploadCloud },
  { label: "Заявки", href: "/admin/collections/leads", icon: Inbox },
  { label: "Главная", href: "/admin/globals/home-content", icon: LayoutDashboard }
];

const workflow = [
  {
    title: "1. Добавить фото",
    text: "Сначала загрузите изображения в медиа-библиотеку и заполните alt-текст.",
    icon: UploadCloud
  },
  {
    title: "2. Создать товар",
    text: "Выберите категорию, добавьте описание, галерею и режим цены.",
    icon: Package
  },
  {
    title: "3. Проверить расчёт",
    text: "Если товар с конфигуратором, проверьте профиль калькулятора и коэффициенты.",
    icon: CalculatorIcon
  },
  {
    title: "4. Опубликовать",
    text: "Снимите черновик, проверьте страницу на сайте и отправьте ссылку инженеру.",
    icon: Rocket
  }
];

async function getCounts() {
  try {
    const payload = await getPayload({ config });
    const [products, categories, media, leads] = await Promise.all([
      payload.count({ collection: "products" }),
      payload.count({ collection: "categories" }),
      payload.count({ collection: "media" }),
      payload.count({ collection: "leads" })
    ]);

    return {
      products: products.totalDocs,
      categories: categories.totalDocs,
      media: media.totalDocs,
      leads: leads.totalDocs
    };
  } catch {
    return { products: null, categories: null, media: null, leads: null };
  }
}

function fmt(value: number | null): string {
  return value === null ? "—" : String(value);
}

export async function AdminDashboard() {
  const counts = await getCounts();

  const kpis = [
    { label: "Товаров", value: fmt(counts.products), icon: Package, href: "/admin/collections/products" },
    { label: "Категорий", value: fmt(counts.categories), icon: Layers, href: "/admin/collections/categories" },
    { label: "Медиа", value: fmt(counts.media), icon: Boxes, href: "/admin/collections/media" },
    { label: "Заявок", value: fmt(counts.leads), icon: Inbox, href: "/admin/collections/leads", tourId: "kpi-leads" }
  ];

  return (
    <section className="kb-admin-dashboard" aria-label="Центр управления сайтом">
      <div className="kb-admin-dashboard__hero">
        <div className="kb-admin-dashboard__hero-copy">
          <span className="kb-admin-dashboard__status">
            <Sparkles size={15} aria-hidden />
            SaaS-панель управления
          </span>
          <p className="kb-admin-dashboard__eyebrow">КБ Парус CMS</p>
          <h2>Управляйте сайтом без разработчика</h2>
          <p>
            Быстрый доступ к каталогу, главной странице, медиа, заявкам и калькулятору. Панель собрана как рабочее место
            контент-менеджера: меньше таблиц, больше понятных действий.
          </p>
          <div className="kb-admin-dashboard__quick">
            {quickActions.map((action) => (
              <a className="kb-admin-dashboard__quick-link" href={action.href} key={action.href} data-tour={action.tourId}>
                <action.icon size={16} aria-hidden />
                {action.label}
              </a>
            ))}
          </div>
        </div>

        <div className="kb-admin-dashboard__hero-panel">
          <div className="kb-admin-dashboard__hero-panel-top">
            <span>Готовность CMS</span>
            <strong>Рабочий режим</strong>
          </div>
          <div className="kb-admin-dashboard__progress" aria-hidden>
            <span />
          </div>
          <ul>
            <li>
              <CheckCircle2 size={16} aria-hidden />
              Каталог и товары редактируются
            </li>
            <li>
              <CheckCircle2 size={16} aria-hidden />
              Заявки сохраняются в CMS
            </li>
            <li>
              <Clock3 size={16} aria-hidden />
              Интеграции донастраиваются отдельно
            </li>
          </ul>
        </div>
      </div>

      <div className="kb-admin-dashboard__kpis">
        {kpis.map((kpi) => (
          <a className="kb-admin-dashboard__kpi" href={kpi.href} key={kpi.label} data-tour={kpi.tourId}>
            <span className="kb-admin-dashboard__kpi-icon">
              <kpi.icon size={22} aria-hidden />
            </span>
            <strong className="kb-admin-dashboard__kpi-value">{kpi.value}</strong>
            <span className="kb-admin-dashboard__kpi-label">{kpi.label}</span>
          </a>
        ))}
      </div>

      <div className="kb-admin-dashboard__learning-row">
        <AdminTraining />

        <div className="kb-admin-dashboard__workflow" data-tour="workflow">
          <div className="kb-admin-dashboard__block-head">
            <span>
              <ShieldCheck size={17} aria-hidden />
              Безопасный порядок работы
            </span>
            <strong>4 шага публикации</strong>
          </div>
          <div className="kb-admin-dashboard__workflow-grid">
            {workflow.map((item) => (
              <article className="kb-admin-dashboard__workflow-item" key={item.title}>
                <span>
                  <item.icon size={18} aria-hidden />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      {sections.map((section) => (
        <div className="kb-admin-dashboard__section" key={section.group}>
          <p className="kb-admin-dashboard__section-title">{section.group}</p>
          <div className="kb-admin-dashboard__grid">
            {section.items.map((item) => (
              <a className="kb-admin-dashboard__card" href={item.href} key={item.href} data-tour={item.tourId}>
                <span className="kb-admin-dashboard__card-icon">
                  <item.icon size={20} aria-hidden />
                </span>
                <span className="kb-admin-dashboard__card-title">{item.title}</span>
                <p>{item.text}</p>
                <strong>
                  {item.cta}
                  <ArrowRight size={15} aria-hidden />
                </strong>
              </a>
            ))}
          </div>
        </div>
      ))}

      <div className="kb-admin-dashboard__footer-note">
        <BookOpen size={18} aria-hidden />
        <span>
          Правило работы: сначала медиа, потом карточка, затем проверка страницы на сайте. Системные поля и ключи менять
          только после согласования.
        </span>
      </div>
    </section>
  );
}
