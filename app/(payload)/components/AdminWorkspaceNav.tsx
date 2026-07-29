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
  canEditContent,
  canManageMedia,
  getCmsRole
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

  const canViewSeo = canEditContent(user);
  const canViewMedia = canManageMedia(user);
  const isAdmin = getCmsRole(user) === "admin";
  const contentItems: AdminNavItem[] = [
    ...(canViewSeo
      ? [
          {
            href: "/admin/globals/home-content",
            icon: LayoutDashboard,
            label: "Главная страница",
            description: "Hero и блоки сайта"
          },
          {
            href: "/admin/globals/contacts",
            icon: Building2,
            label: "Контакты компании",
            description: "Телефон и реквизиты"
          },
          {
            href: "/admin/globals/site-navigation",
            icon: Navigation,
            label: "Меню и подвал",
            description: "Навигация сайта"
          }
        ]
      : []),
    ...(canViewMedia
      ? [
          {
            href: "/admin/collections/media",
            icon: ImageIcon,
            label: "Медиа-библиотека",
            description: "Фото, видео и файлы"
          }
        ]
      : [])
  ];
  const catalogItems: AdminNavItem[] = canViewSeo
    ? [
        {
          href: "/admin/collections/categories",
          icon: FolderTree,
          label: "Категории",
          description: "Разделы каталога"
        },
        {
          href: "/admin/collections/subcategories",
          icon: ListTree,
          label: "Подкатегории",
          description: "Структура каталога"
        },
        {
          href: "/admin/collections/products",
          icon: Package,
          label: "Товары",
          description: "Карточки оборудования"
        },
        {
          href: "/admin/collections/calculator-profiles",
          icon: Calculator,
          label: "Профили расчёта",
          description: "Цены калькулятора"
        }
      ]
    : [];
  const salesItems: AdminNavItem[] = isAdmin
    ? [
        {
          href: "/admin/collections/leads",
          icon: Inbox,
          label: "Входящие заявки",
          description: "Клиенты и обработка"
        },
        {
          href: "/admin/globals/lead-management",
          icon: SlidersHorizontal,
          label: "Формы и доставка",
          description: "Доставка заявок"
        }
      ]
    : [];
  const accessItems: AdminNavItem[] = isAdmin
    ? [
        {
          href: "/admin/collections/users",
          icon: UsersRound,
          label: "Команда и доступы",
          description: "Роли сотрудников"
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
      {isAdmin ? (
        <AdminIntentLink
          aria-label="Здоровье и история"
          className="kb-admin-workspace-nav__link"
          href="/admin/system"
          title="Здоровье и история"
        >
          <span className="kb-admin-workspace-nav__section-icon">
            <CircleGauge size={17} aria-hidden />
          </span>
          <span>Здоровье и история</span>
        </AdminIntentLink>
      ) : null}
      {isAdmin ? (
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
