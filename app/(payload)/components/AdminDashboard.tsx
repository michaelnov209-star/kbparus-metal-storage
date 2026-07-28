import { Suspense } from "react";
import type { AdminViewServerProps, Payload } from "payload";
import { Link } from "@payloadcms/ui/elements/Link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Calculator,
  CircleGauge,
  Contact,
  FileClock,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Package,
  Plus,
  Settings2,
  ShieldCheck,
  UploadCloud
} from "lucide-react";

import {
  canEditContent,
  canManageMedia,
  getCmsRole,
  type CmsRole
} from "@/payload/access/rbac";

type DashboardCounts = {
  products: number | null;
  calculatorProfiles: number | null;
  media: number | null;
  leads: number | null;
};

type WorkspaceItem = {
  title: string;
  description: string;
  href: string;
  icon: typeof Package;
  access: "admin" | "content" | "media";
  accent?: boolean;
};

const workspaceItems: WorkspaceItem[] = [
  {
    title: "Главная страница",
    description: "Первый экран, преимущества, кейсы, FAQ и призывы к действию.",
    href: "/admin/globals/home-content",
    icon: LayoutDashboard,
    access: "content"
  },
  {
    title: "Товары каталога",
    description: "Карточки оборудования, цены, изображения и публикация.",
    href: "/admin/collections/products",
    icon: Package,
    access: "content",
    accent: true
  },
  {
    title: "Калькулятор",
    description: "Размеры, нагрузки, коэффициенты, цены и дополнительные опции.",
    href: "/admin/collections/calculator-profiles",
    icon: Calculator,
    access: "content"
  },
  {
    title: "Заявки",
    description: "Обращения с сайта и параметры расчёта клиента.",
    href: "/admin/collections/leads",
    icon: Inbox,
    access: "admin",
    accent: true
  },
  {
    title: "Медиа",
    description: "Фотографии, видео, документы и alt-тексты.",
    href: "/admin/collections/media",
    icon: ImageIcon,
    access: "media"
  },
  {
    title: "Контакты",
    description: "Телефон, почта, адрес, график и мессенджеры.",
    href: "/admin/globals/contacts",
    icon: Contact,
    access: "content"
  }
];

const systemItems: WorkspaceItem[] = [
  {
    title: "SEO и конверсии",
    description: "Позиции, поисковые запросы, цели и динамика.",
    href: "/admin/seo",
    icon: BarChart3,
    access: "content"
  },
  {
    title: "Здоровье и изменения",
    description: "Сервисы сайта, последние изменения и контроль рисков.",
    href: "/admin/system",
    icon: CircleGauge,
    access: "admin",
    accent: true
  },
  {
    title: "Интеграции",
    description: "Telegram, Яндекс Почта, Метрика и Bitrix24.",
    href: "/admin/integrations",
    icon: Settings2,
    access: "admin"
  }
];

const dashboardCache = new Map<
  CmsRole | "restricted",
  { expiresAt: number; pending?: Promise<DashboardCounts>; value?: DashboardCounts }
>();

function canOpen(item: WorkspaceItem, role: CmsRole | null): boolean {
  if (item.access === "admin") return role === "admin";
  if (item.access === "content") return role === "admin" || role === "editor";
  return role === "admin" || role === "editor" || role === "photographer";
}

function roleLabel(role: CmsRole | null): string {
  if (role === "admin") return "Администратор";
  if (role === "editor") return "Редактор контента";
  if (role === "photographer") return "Медиа-менеджер";
  return "Ограниченный доступ";
}

async function readDashboardCounts(
  payload: Payload,
  role: CmsRole | null
): Promise<DashboardCounts> {
  try {
    const hasContentAccess = role === "admin" || role === "editor";
    const hasMediaAccess = canManageMedia({ role });
    const hasLeadAccess = role === "admin";
    const [products, calculatorProfiles, media, leads] = await Promise.all([
      hasContentAccess
        ? payload.count({ collection: "products", overrideAccess: true })
        : null,
      hasContentAccess
        ? payload.count({ collection: "calculator-profiles", overrideAccess: true })
        : null,
      hasMediaAccess
        ? payload.count({ collection: "media", overrideAccess: true })
        : null,
      hasLeadAccess
        ? payload.count({ collection: "leads", overrideAccess: true })
        : null
    ]);

    return {
      products: products?.totalDocs ?? null,
      calculatorProfiles: calculatorProfiles?.totalDocs ?? null,
      media: media?.totalDocs ?? null,
      leads: leads?.totalDocs ?? null
    };
  } catch (error) {
    console.error("[admin-dashboard] Counters are unavailable", error);
    return {
      products: null,
      calculatorProfiles: null,
      media: null,
      leads: null
    };
  }
}

async function getDashboardCounts(
  payload: Payload,
  role: CmsRole | null
): Promise<DashboardCounts> {
  const key = role ?? "restricted";
  const now = Date.now();
  const cached = dashboardCache.get(key);
  if (cached?.value && cached.expiresAt > now) return cached.value;
  if (cached?.pending) return cached.pending;

  const pending = readDashboardCounts(payload, role);
  dashboardCache.set(key, {
    expiresAt: cached?.expiresAt ?? 0,
    pending,
    value: cached?.value
  });
  const value = await pending;
  dashboardCache.set(key, { expiresAt: Date.now() + 45_000, value });
  return value;
}

function CountSkeleton() {
  return (
    <div className="kb-control-center__metrics" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <span className="kb-control-center__metric-skeleton" key={index} />
      ))}
    </div>
  );
}

async function DashboardMetrics({
  payload,
  role
}: {
  payload: Payload;
  role: CmsRole | null;
}) {
  const counts = await getDashboardCounts(payload, role);
  const metrics = [
    {
      label: "Товаров",
      value: counts.products,
      href: "/admin/collections/products",
      icon: Package
    },
    {
      label: "Профилей расчёта",
      value: counts.calculatorProfiles,
      href: "/admin/collections/calculator-profiles",
      icon: Calculator
    },
    {
      label: "Медиафайлов",
      value: counts.media,
      href: "/admin/collections/media",
      icon: ImageIcon
    },
    {
      label: "Заявок",
      value: counts.leads,
      href: "/admin/collections/leads",
      icon: Inbox
    }
  ].filter((item) => item.value !== null);

  return (
    <div className="kb-control-center__metrics">
      {metrics.map((metric) => (
        <Link className="kb-control-center__metric" href={metric.href} key={metric.label} prefetch={false}>
          <span>
            <metric.icon size={17} aria-hidden />
            {metric.label}
          </span>
          <strong>{metric.value}</strong>
        </Link>
      ))}
    </div>
  );
}

function WorkspaceCard({ item }: { item: WorkspaceItem }) {
  return (
    <Link
      className="kb-control-center__card"
      data-accent={item.accent ? "true" : "false"}
      href={item.href}
      prefetch={false}
    >
      <span className="kb-control-center__card-icon">
        <item.icon size={19} aria-hidden />
      </span>
      <div>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
      </div>
      <ArrowRight size={17} aria-hidden />
    </Link>
  );
}

export async function AdminDashboard({
  initPageResult,
  user
}: AdminViewServerProps) {
  const authenticatedUser = user ?? initPageResult.req.user;
  if (!authenticatedUser) {
    redirect("/admin/login");
  }

  const role = getCmsRole(authenticatedUser);
  const canEdit = canEditContent(authenticatedUser);
  const visibleWorkspace = workspaceItems.filter((item) => canOpen(item, role));
  const visibleSystem = systemItems.filter((item) => canOpen(item, role));
  const integrationsConfigured = [
    Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
    Boolean(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID)
  ].filter(Boolean).length;

  const content = (
    <section className="kb-control-center" aria-label="Обзор и быстрые действия">
      <header className="kb-control-center__hero">
        <div>
          <span className="kb-control-center__eyebrow">
            <ShieldCheck size={15} aria-hidden />
            {roleLabel(role)}
          </span>
          <h1>Центр управления сайтом</h1>
          <p>Главное на одном экране: контент, заявки, расчёты и состояние сервисов.</p>
          <div className="kb-control-center__quick-actions">
            {canEdit ? (
              <Link
                className="kb-control-center__action kb-control-center__action--primary"
                href="/admin/collections/products/create"
                prefetch={false}
              >
                <Plus size={16} aria-hidden />
                Новый товар
              </Link>
            ) : null}
            {canManageMedia(authenticatedUser) ? (
              <Link className="kb-control-center__action" href="/admin/collections/media/create" prefetch={false}>
                <UploadCloud size={16} aria-hidden />
                Загрузить файл
              </Link>
            ) : null}
            {role === "admin" ? (
              <Link className="kb-control-center__action" href="/admin/collections/leads" prefetch={false}>
                <Inbox size={16} aria-hidden />
                Открыть заявки
              </Link>
            ) : null}
          </div>
        </div>

        <aside className="kb-control-center__status">
          <div className="kb-control-center__status-head">
            <span>Системный контур</span>
            <strong>{integrationsConfigured}/3</strong>
          </div>
          <div className="kb-control-center__status-bar" aria-hidden>
            <span style={{ width: `${(integrationsConfigured / 3) * 100}%` }} />
          </div>
          <p>Telegram, почта и аналитика подключены через защищённые настройки.</p>
          {role === "admin" ? (
            <Link href="/admin/system" prefetch={false}>
              Проверить здоровье
              <ArrowRight size={14} aria-hidden />
            </Link>
          ) : null}
        </aside>
      </header>

      <Suspense fallback={<CountSkeleton />}>
        <DashboardMetrics payload={initPageResult.req.payload} role={role} />
      </Suspense>

      <div className="kb-control-center__layout">
        <section className="kb-control-center__panel">
          <div className="kb-control-center__section-head">
            <div>
              <span>Рабочие разделы</span>
              <h2>Ежедневная работа</h2>
            </div>
            <Activity size={19} aria-hidden />
          </div>
          <div className="kb-control-center__grid">
            {visibleWorkspace.map((item) => (
              <WorkspaceCard item={item} key={item.href} />
            ))}
          </div>
        </section>

        {visibleSystem.length ? (
          <aside className="kb-control-center__panel kb-control-center__panel--system">
            <div className="kb-control-center__section-head">
              <div>
                <span>Контроль</span>
                <h2>Система и аналитика</h2>
              </div>
              <FileClock size={19} aria-hidden />
            </div>
            <div className="kb-control-center__system-list">
              {visibleSystem.map((item) => (
                <WorkspaceCard item={item} key={item.href} />
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      <footer className="kb-control-center__footer">
        <ShieldCheck size={16} aria-hidden />
        <span>
          Изменения сохраняются в CMS. Перед публикацией проверьте карточку на сайте;
          цены и коэффициенты меняйте только по согласованному расчёту.
        </span>
      </footer>
    </section>
  );

  return content;
}
