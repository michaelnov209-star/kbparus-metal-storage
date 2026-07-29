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
            className="kb-admin-workspace-nav__section-link"
            data-tour={item.tour}
            href={item.href}
            key={item.href}
          >
            <span className="kb-admin-workspace-nav__section-icon">
              <item.icon size={16} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="kb-admin-workspace-nav__section-copy">
              <strong>{item.label}</strong>
              <small>{item.description}</small>
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
            description: "Первый экран и блоки сайта"
          },
          {
            href: "/admin/globals/contacts",
            icon: Building2,
            label: "Контакты компании",
            description: "Телефон, почта и реквизиты"
          },
          {
            href: "/admin/globals/site-navigation",
            icon: Navigation,
            label: "Меню и подвал",
            description: "Ссылки и навигация сайта"
          }
        ]
      : []),
    ...(canViewMedia
      ? [
          {
            href: "/admin/collections/media",
            icon: ImageIcon,
            label: "Медиа-библиотека",
            description: "Фото, видео и документы"
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
          description: "Основные направления каталога"
        },
        {
          href: "/admin/collections/subcategories",
          icon: ListTree,
          label: "Подкатегории",
          description: "Внутренняя структура разделов"
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
          description: "Цены и логика калькулятора"
        }
      ]
    : [];
  const salesItems: AdminNavItem[] = isAdmin
    ? [
        {
          href: "/admin/collections/leads",
          icon: Inbox,
          label: "Входящие заявки",
          description: "Клиенты и статусы обработки"
        },
        {
          href: "/admin/globals/lead-management",
          icon: SlidersHorizontal,
          label: "Формы и доставка",
          description: "Каналы отправки заявок"
        }
      ]
    : [];
  const accessItems: AdminNavItem[] = isAdmin
    ? [
        {
          href: "/admin/collections/users",
          icon: UsersRound,
          label: "Команда и доступы",
          description: "Роли сотрудников админки"
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
      >
        <img src="/brand/logo-g.png" alt="КБ Парус" width={226} height={75} />
      </AdminIntentLink>
      <span className="kb-admin-workspace-nav__label">Рабочее пространство</span>
      <AdminIntentLink className="kb-admin-workspace-nav__link" href="/admin">
        <LayoutDashboard size={17} aria-hidden />
        <span>Обзор и быстрые действия</span>
      </AdminIntentLink>
      {canViewSeo ? (
        <AdminIntentLink className="kb-admin-workspace-nav__link" data-tour="nav-seo" href="/admin/seo">
          <BarChart3 size={17} aria-hidden />
          <span>SEO, цели и конверсии</span>
        </AdminIntentLink>
      ) : null}
      {isAdmin ? (
        <AdminIntentLink className="kb-admin-workspace-nav__link" href="/admin/system">
          <CircleGauge size={17} aria-hidden />
          <span>Здоровье и история</span>
        </AdminIntentLink>
      ) : null}
      {isAdmin ? (
        <AdminIntentLink className="kb-admin-workspace-nav__link" data-tour="nav-integrations" href="/admin/integrations">
          <Settings2 size={17} aria-hidden />
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
