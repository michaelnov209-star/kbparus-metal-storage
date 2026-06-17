import { getPayload } from "payload";
import config from "@payload-config";
import {
  Boxes,
  Image as ImageIcon,
  Inbox,
  Layers,
  LayoutDashboard,
  Package,
  Phone,
  Plus,
  Calculator as CalculatorIcon,
  ArrowRight
} from "lucide-react";

const sections = [
  {
    group: "Контент сайта",
    items: [
      {
        title: "Главная страница",
        text: "Hero, метрики, преимущества, кейсы, отзывы, FAQ, партнёры и CTA-блоки.",
        href: "/admin/globals/home-content",
        cta: "Управлять лендингом",
        icon: LayoutDashboard
      },
      {
        title: "Компания и контакты",
        text: "Контакты, реквизиты, мессенджеры и сквозные данные, которые видит клиент.",
        href: "/admin/globals/contacts",
        cta: "Редактировать контакты",
        icon: Phone
      }
    ]
  },
  {
    group: "Каталог и калькулятор",
    items: [
      {
        title: "Каталог",
        text: "Категории, подкатегории, товары, цены, изображения и SEO страниц каталога.",
        href: "/admin/collections/products",
        cta: "Открыть товары",
        icon: Package
      },
      {
        title: "Калькулятор",
        text: "Профили расчётов, цены, коэффициенты и опции, которые попадают в заявки.",
        href: "/admin/collections/calculator-profiles",
        cta: "Проверить профили",
        icon: CalculatorIcon
      },
      {
        title: "Медиа-библиотека",
        text: "Фото, видео, баннеры и файлы для страниц сайта и карточек оборудования.",
        href: "/admin/collections/media",
        cta: "Открыть медиа",
        icon: ImageIcon
      }
    ]
  },
  {
    group: "Операции",
    items: [
      {
        title: "Заявки",
        text: "Внутренний журнал заявок с сайта: контакты, источник, UTM, параметры калькулятора и статус.",
        href: "/admin/collections/leads",
        cta: "Открыть заявки",
        icon: Inbox
      }
    ]
  }
];

const quickActions = [
  { label: "Новый товар", href: "/admin/collections/products/create", icon: Plus },
  { label: "Загрузить фото", href: "/admin/collections/media/create", icon: ImageIcon },
  { label: "Открыть заявки", href: "/admin/collections/leads", icon: Inbox },
  { label: "Редактировать главную", href: "/admin/globals/home-content", icon: LayoutDashboard }
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
    { label: "Товаров в каталоге", value: fmt(counts.products), icon: Package, href: "/admin/collections/products" },
    { label: "Категорий", value: fmt(counts.categories), icon: Layers, href: "/admin/collections/categories" },
    { label: "Медиа-файлов", value: fmt(counts.media), icon: Boxes, href: "/admin/collections/media" },
    { label: "Заявок с сайта", value: fmt(counts.leads), icon: Inbox, href: "/admin/collections/leads" }
  ];

  return (
    <section className="kb-admin-dashboard" aria-label="Центр управления сайтом">
      <div className="kb-admin-dashboard__hero">
        <p className="kb-admin-dashboard__eyebrow">КБ Парус CMS</p>
        <h2>Центр управления сайтом и каталогом</h2>
        <p>
          Рабочая панель для менеджеров: видно состояние каталога и заявок, и можно
          сразу перейти к нужной задаче без поиска по таблицам.
        </p>
        <div className="kb-admin-dashboard__quick">
          {quickActions.map((action) => (
            <a className="kb-admin-dashboard__quick-link" href={action.href} key={action.href}>
              <action.icon size={16} aria-hidden />
              {action.label}
            </a>
          ))}
        </div>
      </div>

      <div className="kb-admin-dashboard__kpis">
        {kpis.map((kpi) => (
          <a className="kb-admin-dashboard__kpi" href={kpi.href} key={kpi.label}>
            <span className="kb-admin-dashboard__kpi-icon">
              <kpi.icon size={22} aria-hidden />
            </span>
            <strong className="kb-admin-dashboard__kpi-value">{kpi.value}</strong>
            <span className="kb-admin-dashboard__kpi-label">{kpi.label}</span>
          </a>
        ))}
      </div>

      {sections.map((section) => (
        <div className="kb-admin-dashboard__section" key={section.group}>
          <p className="kb-admin-dashboard__section-title">{section.group}</p>
          <div className="kb-admin-dashboard__grid">
            {section.items.map((item) => (
              <a className="kb-admin-dashboard__card" href={item.href} key={item.href}>
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
    </section>
  );
}
