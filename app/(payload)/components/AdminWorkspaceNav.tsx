import {
  BarChart3,
  Building2,
  Calculator,
  CircleGauge,
  FolderTree,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  ListTree,
  Navigation,
  Package,
  Settings2,
  SlidersHorizontal,
  type LucideIcon,
  UsersRound
} from "lucide-react";
import type { ServerProps } from "payload";
import {
  canManageIntegrations,
  canEditContent,
  canManageMedia,
  canReadCalculatorProfiles,
  canReadCatalog,
  canReadLeads,
  canReadSeo,
  canReadSystem,
  canViewProductsAdmin,
  isAdminUser
} from "@/payload/access/rbac";
import { AdminIntentLink } from "./AdminIntentLink";
import { AdminNavModeToggle } from "./AdminNavModeToggle";
import { AdminNavPrefetchBridge } from "./AdminNavPrefetchBridge";
import { AdminTrainingNavButton } from "./AdminTrainingNavButton";

type AdminWorkspaceNavProps = Pick<ServerProps, "user">;

type AdminNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
  tour?: string;
};

function AdminNavSection({
  items,
  label
}: {
  items: AdminNavItem[];
  label: string;
}) {
  if (!items.length) return null;

  return (
    <section className="kb-admin-workspace-nav__section" aria-label={label}>
      <span className="kb-admin-workspace-nav__section-label">{label}</span>
      <div className="kb-admin-workspace-nav__section-links">
        {items.map((item) => (
          <AdminIntentLink
            aria-label={item.label}
            className="kb-admin-workspace-nav__section-link"
            data-tour={item.tour}
            href={item.href}
            key={item.href}
            title={item.label}
          >
            <span className="kb-admin-workspace-nav__section-icon">
              <item.icon size={16} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="kb-admin-workspace-nav__section-copy">
              <strong>{item.label}</strong>
              <small title={item.description}>{item.description}</small>
            </span>
          </AdminIntentLink>
        ))}
      </div>
    </section>
  );
}

export function AdminWorkspaceNav({ user }: AdminWorkspaceNavProps) {
  if (!user) {
    return null;
  }

  const canViewSeo = canReadSeo(user);
  const canViewContent = canEditContent(user);
  const canViewMedia = canManageMedia(user);
  const canViewProducts = canViewProductsAdmin(user);
  const canViewCatalog = canReadCatalog(user);
  const canViewCalculator = canReadCalculatorProfiles(user);
  const canViewLeads = canReadLeads(user);
  const canViewHealth = canReadSystem(user);
  const canViewIntegrations = canManageIntegrations(user);
  const isAdmin = isAdminUser(user);
  const contentItems: AdminNavItem[] = [
    ...(canViewCatalog
      ? [
          {
            href: "/admin/globals/home-content",
            icon: LayoutDashboard,
            label: "Главная страница",
            description: "Hero и блоки сайта",
            tour: "nav-home"
          },
          {
            href: "/admin/globals/contacts",
            icon: Building2,
            label: "Контакты компании",
            description: "Телефон и реквизиты",
            tour: "nav-contacts"
          },
          {
            href: "/admin/globals/site-navigation",
            icon: Navigation,
            label: "Меню и подвал",
            description: "Навигация сайта",
            tour: "nav-navigation"
          }
        ]
      : []),
    ...(canViewMedia
      ? [
          {
            href: "/admin/collections/media",
            icon: ImageIcon,
            label: "Медиа-библиотека",
            description: "Фото, видео и файлы",
            tour: "nav-media"
          }
        ]
      : [])
  ];
  const catalogItems: AdminNavItem[] = [
    ...(canViewContent
      ? [
        {
          href: "/admin/collections/categories",
          icon: FolderTree,
          label: "Категории",
          description: "Разделы каталога",
          tour: "nav-categories"
        },
        {
          href: "/admin/collections/subcategories",
          icon: ListTree,
          label: "Подкатегории",
          description: "Структура каталога",
          tour: "nav-subcategories"
        },
      ]
      : []),
    ...(canViewProducts
      ? [{
          href: "/admin/collections/products",
          icon: Package,
          label: "Товары",
          description: "Карточки оборудования",
          tour: "nav-products"
        }]
      : []),
    ...(canViewCalculator
      ? [{
          href: "/admin/collections/calculator-profiles",
          icon: Calculator,
          label: "Профили расчёта",
          description: "Цены калькулятора",
          tour: "nav-calculator"
        }]
      : [])
  ];
  const salesItems: AdminNavItem[] = canViewLeads
    ? [
        {
          href: "/admin/collections/leads",
          icon: Inbox,
          label: "Входящие заявки",
          description: "Клиенты и обработка",
          tour: "nav-leads"
        },
        ...(canViewIntegrations
          ? [{
              href: "/admin/globals/lead-management",
              icon: SlidersHorizontal,
              label: "Формы и доставка",
              description: "Доставка заявок",
              tour: "nav-forms"
            }]
          : [])
      ]
    : [];
  const accessItems: AdminNavItem[] = isAdmin
    ? [
        {
          href: "/admin/collections/users",
          icon: UsersRound,
          label: "Команда и доступы",
          description: "Роли сотрудников",
          tour: "nav-users"
        }
      ]
    : [];

  return (
    <div className="kb-admin-workspace-nav" aria-label="Основные разделы">
      <AdminNavPrefetchBridge />
      <AdminIntentLink
        aria-label="КБ Парус — обзор админки"
        className="kb-admin-workspace-nav__brand"
        data-tour="nav-overview"
        href="/admin"
        title="КБ Парус — обзор админки"
      >
        <img src="/brand/logo-g.png" alt="КБ Парус" width={226} height={75} />
      </AdminIntentLink>
      <div className="kb-admin-workspace-nav__heading">
        <span className="kb-admin-workspace-nav__label">Рабочее пространство</span>
        <AdminNavModeToggle />
      </div>
      <AdminIntentLink
        aria-label="Обзор и быстрые действия"
        className="kb-admin-workspace-nav__link"
        href="/admin"
        title="Обзор и быстрые действия"
      >
        <span className="kb-admin-workspace-nav__section-icon">
          <LayoutDashboard size={17} aria-hidden />
        </span>
        <span>Обзор и быстрые действия</span>
      </AdminIntentLink>
      {canViewSeo ? (
        <AdminIntentLink
          aria-label="SEO, цели и конверсии"
          className="kb-admin-workspace-nav__link"
          data-tour="nav-seo"
          href="/admin/seo"
          title="SEO, цели и конверсии"
        >
          <span className="kb-admin-workspace-nav__section-icon">
            <BarChart3 size={17} aria-hidden />
          </span>
          <span>SEO, цели и конверсии</span>
        </AdminIntentLink>
      ) : null}
      {canViewHealth ? (
        <AdminIntentLink
          aria-label="Здоровье и история"
          className="kb-admin-workspace-nav__link"
          data-tour="nav-system"
          href="/admin/system"
          title="Здоровье и история"
        >
          <span className="kb-admin-workspace-nav__section-icon">
            <CircleGauge size={17} aria-hidden />
          </span>
          <span>Здоровье и история</span>
        </AdminIntentLink>
      ) : null}
      {canViewIntegrations ? (
        <AdminIntentLink
          aria-label="Интеграции и статусы"
          className="kb-admin-workspace-nav__link"
          data-tour="nav-integrations"
          href="/admin/integrations"
          title="Интеграции и статусы"
        >
          <span className="kb-admin-workspace-nav__section-icon">
            <Settings2 size={17} aria-hidden />
          </span>
          <span>Интеграции и статусы</span>
        </AdminIntentLink>
      ) : null}
      <AdminTrainingNavButton />

      <div className="kb-admin-workspace-nav__divider" aria-hidden />
      <AdminNavSection items={contentItems} label="Контент сайта" />
      <AdminNavSection items={catalogItems} label="Каталог и расчёты" />
      <AdminNavSection items={salesItems} label="Продажи и заявки" />
      <AdminNavSection items={accessItems} label="Настройки доступа" />
    </div>
  );
}
