import {
  Building2,
  Calculator,
  FolderTree,
  Image as ImageIcon,
  Inbox,
  LayoutTemplate,
  ListTree,
  Navigation,
  Package,
  Send,
  Settings2,
  UsersRound,
  type LucideIcon
} from "lucide-react";

export type AdminSectionKey =
  | "home"
  | "contacts"
  | "navigation"
  | "lead-management"
  | "media"
  | "categories"
  | "subcategories"
  | "products"
  | "calculator"
  | "leads"
  | "users";

type SectionMeta = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const sectionMeta: Record<AdminSectionKey, SectionMeta> = {
  home: {
    eyebrow: "Контент сайта",
    title: "Главная страница",
    description:
      "Управляйте первым экраном, ключевыми блоками и подачей продукта на главной.",
    icon: LayoutTemplate
  },
  contacts: {
    eyebrow: "Контент сайта",
    title: "Контакты компании",
    description:
      "Телефоны, почта, адрес, режим работы и каналы связи в одном месте.",
    icon: Building2
  },
  navigation: {
    eyebrow: "Контент сайта",
    title: "Меню и подвал",
    description:
      "Настройте навигацию сайта так, чтобы клиент быстро находил нужный раздел.",
    icon: Navigation
  },
  "lead-management": {
    eyebrow: "Продажи и заявки",
    title: "Формы и доставка заявок",
    description:
      "Контролируйте точки сбора заявок и подключённые каналы без технического шума.",
    icon: Send
  },
  media: {
    eyebrow: "Медиа",
    title: "Медиа-библиотека",
    description:
      "Фотографии, видео и документы сайта с автоматической подготовкой к быстрой загрузке.",
    icon: ImageIcon
  },
  categories: {
    eyebrow: "Каталог",
    title: "Категории оборудования",
    description:
      "Основные направления каталога, их порядок, видимость и визуальная подача.",
    icon: FolderTree
  },
  subcategories: {
    eyebrow: "Каталог",
    title: "Подкатегории",
    description:
      "Внутренняя структура разделов для понятной навигации и точного SEO.",
    icon: ListTree
  },
  products: {
    eyebrow: "Каталог",
    title: "Товары и решения",
    description:
      "Карточки оборудования, характеристики, изображения, документы и публикация.",
    icon: Package
  },
  calculator: {
    eyebrow: "Каталог и расчёты",
    title: "Профили калькулятора",
    description:
      "Системы хранения, рабочие параметры, коэффициенты, цены и варианты оснащения.",
    icon: Calculator
  },
  leads: {
    eyebrow: "Продажи и заявки",
    title: "Входящие заявки",
    description:
      "Клиенты, источники, расчёты и статусы обработки в едином рабочем списке.",
    icon: Inbox
  },
  users: {
    eyebrow: "Настройки доступа",
    title: "Команда и доступы",
    description:
      "Роли сотрудников и безопасный доступ к разделам центра управления.",
    icon: UsersRound
  }
};

export function AdminSectionHero({
  section = "products"
}: {
  section?: AdminSectionKey;
}) {
  const meta = sectionMeta[section] ?? {
    eyebrow: "Центр управления",
    title: "Рабочий раздел",
    description: "Настройки и данные сайта.",
    icon: Settings2
  };
  const Icon = meta.icon;

  return (
    <section
      className="kb-admin-section-hero"
      aria-labelledby={`kb-admin-${section}-title`}
      data-tour={`section-${section}-hero`}
    >
      <span className="kb-admin-section-hero__icon" aria-hidden="true">
        <Icon size={23} strokeWidth={1.8} />
      </span>
      <div>
        <span className="kb-admin-section-hero__eyebrow">{meta.eyebrow}</span>
        <h2 id={`kb-admin-${section}-title`}>{meta.title}</h2>
        <p>{meta.description}</p>
      </div>
    </section>
  );
}
