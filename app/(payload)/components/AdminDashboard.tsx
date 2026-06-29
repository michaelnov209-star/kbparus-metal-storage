import { getPayload } from "payload";
import config from "@payload-config";
import type { Category, Product } from "@/payload-types";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Boxes,
  Calculator as CalculatorIcon,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Inbox,
  Layers,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users
} from "lucide-react";

import { AdminTraining } from "./AdminTraining";

type Counts = {
  products: number | null;
  categories: number | null;
  media: number | null;
  leads: number | null;
};

type AdminCatalogProduct = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  isDraft: boolean;
  priceMode: Product["priceMode"];
  pageMode: Product["pageMode"];
  categorySlug: string;
};

type AdminCatalogCategory = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  isDraft: boolean;
  isFeatured: boolean;
  products: AdminCatalogProduct[];
};

type DashboardContext = {
  cmsOk: boolean;
  counts: Counts;
  catalog: AdminCatalogCategory[];
};

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

const siteFlow = [
  {
    title: "Hero и первый экран",
    text: "Заголовок, метрики, видеофон и главные CTA.",
    editHref: "/admin/globals/home-content",
    previewHref: "/",
    icon: LayoutDashboard
  },
  {
    title: "Каталог оборудования",
    text: "17 разделов в порядке публичной витрины.",
    editHref: "/admin/collections/categories",
    previewHref: "/#catalog",
    icon: Layers
  },
  {
    title: "Калькулятор стоимости",
    text: "Профили, размеры, нагрузки, опции и цена «от».",
    editHref: "/admin/collections/calculator-profiles",
    previewHref: "/#calculator",
    icon: CalculatorIcon
  },
  {
    title: "Кейсы, отзывы, партнёры",
    text: "Доверие, примеры работ и социальное доказательство.",
    editHref: "/admin/globals/home-content",
    previewHref: "/#cases",
    icon: Users
  },
  {
    title: "FAQ и контакты",
    text: "Ответы на вопросы, форма связи, адрес и карта.",
    editHref: "/admin/globals/contacts",
    previewHref: "/#contacts",
    icon: Phone
  }
];

const roleWorkflows = [
  {
    title: "Контент-менеджер",
    text: "Меняет главную, фото, категории, товары, FAQ и отзывы без разработчика.",
    checks: ["Порядок блоков как на сайте", "Preview после правки", "Черновик перед публикацией"],
    icon: Pencil
  },
  {
    title: "Менеджер продаж",
    text: "Смотрит заявки, город, контакты, источник и параметры расчёта клиента.",
    checks: ["Статус заявки", "UTM и источник", "Передача в CRM"],
    icon: Inbox
  },
  {
    title: "Инженер",
    text: "Контролирует калькуляторы: размеры, нагрузки, коэффициенты и опции.",
    checks: ["Цена не точная, а «от»", "Нагрузки и габариты", "Опции расчёта"],
    icon: CalculatorIcon
  },
  {
    title: "Руководитель",
    text: "Проверяет готовность сайта, количество заявок, здоровье CMS и ключевые разделы.",
    checks: ["Health сайта", "Каталог опубликован", "Заявки не теряются"],
    icon: ShieldCheck
  }
];

const operations = [
  {
    title: "Открыть сайт",
    text: "Проверить публичную витрину после изменений.",
    href: "/",
    icon: Eye
  },
  {
    title: "Health check",
    text: "Проверить API, базу, CMS и готовность к работе.",
    href: "/api/health",
    icon: Activity
  },
  {
    title: "Заявки",
    text: "Контроль обращений и параметров калькулятора.",
    href: "/admin/collections/leads",
    icon: Inbox
  },
  {
    title: "Документация",
    text: "README, handoff и правила передачи проекта.",
    href: "/admin/collections/media",
    icon: FileText
  }
];

const emptyCounts: Counts = { products: null, categories: null, media: null, leads: null };

function relationId(value: number | { id: number } | null | undefined): string | null {
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") return String(value.id);
  return null;
}

function sortNumber(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

function priceModeLabel(mode: Product["priceMode"]): string {
  return mode === "fixed" ? "фиксированная цена" : "цена по запросу";
}

function pageModeLabel(mode: Product["pageMode"]): string {
  return mode === "configurator" ? "с калькулятором" : "обычная карточка";
}

async function getDashboardContext(): Promise<DashboardContext> {
  try {
    const payload = await getPayload({ config });
    const [products, categories, media, leads, categoryList, productList] = await Promise.all([
      payload.count({ collection: "products", overrideAccess: true }),
      payload.count({ collection: "categories", overrideAccess: true }),
      payload.count({ collection: "media", overrideAccess: true }),
      payload.count({ collection: "leads", overrideAccess: true }),
      payload.find({
        collection: "categories",
        depth: 0,
        draft: true,
        limit: 100,
        overrideAccess: true,
        pagination: false,
        sort: "sortOrder"
      }),
      payload.find({
        collection: "products",
        depth: 1,
        draft: true,
        limit: 300,
        overrideAccess: true,
        pagination: false,
        sort: "sortOrder"
      })
    ]);

    const categoryDocs = categoryList.docs as Category[];
    const productDocs = productList.docs as Product[];
    const categoryById = new Map(categoryDocs.map((category) => [String(category.id), category]));
    const catalog = categoryDocs
      .map<AdminCatalogCategory>((category, index) => ({
        id: String(category.id),
        title: category.title,
        slug: category.slug,
        sortOrder: sortNumber(category.sortOrder, index + 1),
        isDraft: category._status === "draft",
        isFeatured: Boolean(category.featured),
        products: []
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ru"));

    const categoryBuckets = new Map(catalog.map((category) => [category.id, category]));

    productDocs.forEach((product, index) => {
      const categoryId = relationId(product.category);
      if (!categoryId) return;

      const category = categoryById.get(categoryId);
      const bucket = categoryBuckets.get(categoryId);
      if (!category || !bucket) return;

      bucket.products.push({
        id: String(product.id),
        title: product.shortTitle || product.title,
        slug: product.slug,
        sortOrder: sortNumber(product.sortOrder, index + 1),
        isDraft: Boolean(product.draft) || product._status === "draft",
        priceMode: product.priceMode,
        pageMode: product.pageMode,
        categorySlug: category.slug
      });
    });

    catalog.forEach((category) => {
      category.products.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ru"));
    });

    return {
      cmsOk: true,
      counts: {
        products: products.totalDocs,
        categories: categories.totalDocs,
        media: media.totalDocs,
        leads: leads.totalDocs
      },
      catalog
    };
  } catch (error) {
    console.error("Admin dashboard failed to read Payload context", error);
    return { cmsOk: false, counts: emptyCounts, catalog: [] };
  }
}

function fmt(value: number | null): string {
  return value === null ? "—" : String(value);
}

export async function AdminDashboard() {
  const dashboard = await getDashboardContext();
  const counts = dashboard.counts;

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
          <h2>Управляйте сайтом в той же логике, как он выглядит для клиента</h2>
          <p>
            Главная, каталог, товары, калькуляторы и заявки собраны в один рабочий центр. Редактор видит структуру сайта сверху вниз, быстро переходит в нужный раздел и проверяет
            результат на витрине.
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
            <strong>{dashboard.cmsOk ? "Рабочий режим" : "Нужна проверка"}</strong>
          </div>
          <div className="kb-admin-dashboard__progress" aria-hidden>
            <span />
          </div>
          <ul>
            <li>
              <CheckCircle2 size={16} aria-hidden />
              Каталог и товары редактируются по порядку сайта
            </li>
            <li>
              <CheckCircle2 size={16} aria-hidden />
              Заявки сохраняются в CMS
            </li>
            <li>
              <Clock3 size={16} aria-hidden />
              Интеграции CRM и 1С подключаются отдельным этапом
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

      <section className="kb-admin-dashboard__site-map" data-tour="site-map">
        <div className="kb-admin-dashboard__block-head">
          <span>
            <ListChecks size={17} aria-hidden />
            Структура сайта
          </span>
          <strong>как на публичной странице</strong>
        </div>
        <div className="kb-admin-dashboard__site-flow">
          {siteFlow.map((item, index) => (
            <article className="kb-admin-dashboard__site-flow-item" key={item.title}>
              <span className="kb-admin-dashboard__site-flow-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="kb-admin-dashboard__site-flow-icon">
                <item.icon size={18} aria-hidden />
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <div className="kb-admin-dashboard__mini-actions">
                <a href={item.editHref}>
                  <Pencil size={14} aria-hidden />
                  Редактировать
                </a>
                <a href={item.previewHref} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} aria-hidden />
                  Посмотреть
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="kb-admin-dashboard__catalog-map" data-tour="catalog-map">
        <div className="kb-admin-dashboard__block-head">
          <span>
            <Layers size={17} aria-hidden />
            Каталог в порядке сайта
          </span>
          <strong>{dashboard.catalog.length ? `${dashboard.catalog.length} разделов` : "нет данных"}</strong>
        </div>
        {dashboard.catalog.length ? (
          <div className="kb-admin-dashboard__catalog-list">
            {dashboard.catalog.map((category, index) => (
              <article className="kb-admin-dashboard__category-card" key={category.id}>
                <div className="kb-admin-dashboard__category-top">
                  <span className="kb-admin-dashboard__category-number">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{category.title}</h3>
                    <p>{category.products.length ? `${category.products.length} товаров внутри раздела` : "Товары пока не добавлены"}</p>
                  </div>
                  <span className={category.isDraft ? "kb-admin-dashboard__badge is-warning" : "kb-admin-dashboard__badge"}>{category.isDraft ? "черновик" : "опубликовано"}</span>
                </div>
                <div className="kb-admin-dashboard__mini-actions">
                  <a href={`/admin/collections/categories/${category.id}`}>
                    <Pencil size={14} aria-hidden />
                    Категория
                  </a>
                  <a href={`/catalog/${category.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} aria-hidden />
                    На сайте
                  </a>
                </div>
                <div className="kb-admin-dashboard__product-list">
                  {category.products.slice(0, 5).map((product) => (
                    <div className="kb-admin-dashboard__product-row" key={product.id}>
                      <div>
                        <strong>{product.title}</strong>
                        <span>
                          {pageModeLabel(product.pageMode)} · {priceModeLabel(product.priceMode)}
                        </span>
                      </div>
                      <span className={product.isDraft ? "kb-admin-dashboard__badge is-warning" : "kb-admin-dashboard__badge"}>{product.isDraft ? "черновик" : "live"}</span>
                      <a href={`/admin/collections/products/${product.id}`}>Изменить</a>
                      <a href={`/catalog/${product.categorySlug}/${product.slug}`} target="_blank" rel="noreferrer">
                        Preview
                      </a>
                    </div>
                  ))}
                  {category.products.length > 5 ? <p className="kb-admin-dashboard__more">Ещё {category.products.length - 5} товаров в разделе</p> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="kb-admin-dashboard__empty">
            <Activity size={18} aria-hidden />
            <span>Каталог не загрузился. Проверьте `/api/health` и подключение CMS к базе.</span>
          </div>
        )}
      </section>

      <section className="kb-admin-dashboard__roles" data-tour="roles-map">
        <div className="kb-admin-dashboard__block-head">
          <span>
            <Users size={17} aria-hidden />
            Роли сотрудников
          </span>
          <strong>что важно каждому</strong>
        </div>
        <div className="kb-admin-dashboard__roles-grid">
          {roleWorkflows.map((role) => (
            <article className="kb-admin-dashboard__role-card" key={role.title}>
              <span>
                <role.icon size={18} aria-hidden />
              </span>
              <h3>{role.title}</h3>
              <p>{role.text}</p>
              <ul>
                {role.checks.map((check) => (
                  <li key={check}>{check}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="kb-admin-dashboard__ops" data-tour="ops-health">
        <div className="kb-admin-dashboard__block-head">
          <span>
            <Activity size={17} aria-hidden />
            Preview, статус и здоровье
          </span>
          <strong>{dashboard.cmsOk ? "CMS отвечает" : "нужна диагностика"}</strong>
        </div>
        <div className="kb-admin-dashboard__ops-grid">
          {operations.map((item) => (
            <a className="kb-admin-dashboard__ops-card" href={item.href} key={item.title} target={item.href.startsWith("/admin") ? undefined : "_blank"} rel="noreferrer">
              <span>
                <item.icon size={18} aria-hidden />
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <ArrowRight size={15} aria-hidden />
            </a>
          ))}
        </div>
      </section>

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
          Правило работы: сначала медиа, потом карточка, затем проверка страницы на сайте. Системные поля, ключи интеграций и расчётные коэффициенты менять только после согласования с
          ответственным инженером.
        </span>
      </div>
    </section>
  );
}
