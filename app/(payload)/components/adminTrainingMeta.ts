import type { CmsRole } from "@/payload/access/rbac";

export const ADMIN_TRAINING_VERSION = "6";

type RoleTrainingMeta = {
  duration: string;
  intro: string;
  label: string;
};

export const adminTrainingRoleMeta: Record<CmsRole, RoleTrainingMeta> = {
  admin: {
    duration: "12–15 минут",
    intro:
      "Полный маршрут по заявкам, аналитике, контенту, каталогу, расчётам и доступам.",
    label: "Администратор"
  },
  director: {
    duration: "5–7 минут",
    intro:
      "Ключевые показатели, заявки, поисковая видимость, здоровье сайта и история изменений.",
    label: "Руководитель"
  },
  general_director: {
    duration: "7–9 минут",
    intro:
      "Заявки, каталог, расчёты, поисковая видимость, здоровье сайта и история изменений без доступа к опасным настройкам.",
    label: "Генеральный директор"
  },
  editor: {
    duration: "8–10 минут",
    intro:
      "Главная страница, каталог, изображения, публикация и безопасная проверка результата.",
    label: "Редактор контента"
  },
  engineer: {
    duration: "6–8 минут",
    intro:
      "Технические характеристики товаров, профили расчёта, коэффициенты и контроль результата.",
    label: "Инженер-калькулятор"
  },
  photographer: {
    duration: "3–4 минуты",
    intro:
      "Загрузка, повторное использование и подготовка изображений без замедления сайта.",
    label: "Медиа-менеджер"
  },
  sales_manager: {
    duration: "3–5 минут",
    intro:
      "Новые обращения, расчёты клиентов, статусы обработки и безопасная работа с заявками.",
    label: "Менеджер по заявкам"
  },
  seo_marketer: {
    duration: "8–10 минут",
    intro:
      "Поисковая аналитика, метаданные страниц, контент и контроль публикации.",
    label: "SEO-маркетолог"
  }
};

export function getAdminTrainingStorageKey(
  role: CmsRole,
  userId: number | string
): string {
  return `kb-admin-tour:${ADMIN_TRAINING_VERSION}:${role}:${String(userId)}`;
}
