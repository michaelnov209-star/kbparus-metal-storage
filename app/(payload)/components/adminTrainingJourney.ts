import type { CmsRole } from "@/payload/access/rbac";

export {
  ADMIN_TRAINING_VERSION,
  adminTrainingRoleMeta,
  getAdminTrainingStorageKey
} from "./adminTrainingMeta";

export type AdminTrainingStep = {
  title: string;
  text: string;
  targets: string[];
  placement: "bottom" | "left" | "right" | "top";
};

export type AdminTrainingModule = {
  id: string;
  label: string;
  route: string;
  roles: CmsRole[];
  steps: AdminTrainingStep[];
};

const allRoles = [
  "admin",
  "editor",
  "photographer",
  "director",
  "general_director",
  "sales_manager",
  "engineer",
  "seo_marketer"
] as CmsRole[];

const contentRoles = ["admin", "editor", "seo_marketer"] as CmsRole[];
const mediaRoles = [
  "admin",
  "editor",
  "photographer",
  "seo_marketer"
] as CmsRole[];
const catalogStructureRoles = [
  "admin",
  "editor",
  "general_director",
  "seo_marketer"
] as CmsRole[];
const productRoles = [
  "admin",
  "editor",
  "engineer",
  "general_director",
  "sales_manager",
  "seo_marketer"
] as CmsRole[];
const productCreatorRoles = ["admin", "editor"] as CmsRole[];
const calculatorRoles = [
  "admin",
  "editor",
  "engineer",
  "general_director",
  "sales_manager"
] as CmsRole[];
const leadRoles = [
  "admin",
  "director",
  "general_director",
  "sales_manager"
] as CmsRole[];
const analyticsRoles = [
  "admin",
  "director",
  "general_director",
  "editor",
  "seo_marketer"
] as CmsRole[];
const systemRoles = ["admin", "director", "general_director"] as CmsRole[];
const integrationRoles = ["admin"] as CmsRole[];

const listSteps = (
  section: string,
  title: string,
  description: string
): AdminTrainingStep[] => [
  {
    title,
    text: description,
    targets: [`[data-tour="section-${section}-hero"]`],
    placement: "bottom"
  },
  {
    title: "Поиск, фильтры и колонки",
    text:
      "Используйте поиск и фильтры, чтобы быстро найти запись. Набор колонок можно менять под текущую задачу.",
    targets: [
      ".collection-list .list-controls",
      ".list-controls",
      "main .search-filter"
    ],
    placement: "bottom"
  },
  {
    title: "Рабочий список",
    text:
      "Нажмите на название, чтобы открыть карточку. Изменение и создание доступны только там, где это разрешено вашей ролью; перед добавлением проверьте, что дубля ещё нет.",
    targets: [
      ".collection-list table",
      ".collection-list .table",
      "main table"
    ],
    placement: "top"
  }
];

const formSteps = (
  section: string,
  title: string,
  description: string
): AdminTrainingStep[] => [
  {
    title,
    text: description,
    targets: [`[data-tour="section-${section}-hero"]`],
    placement: "bottom"
  },
  {
    title: "Поля разделены по смыслу",
    text:
      "Заполняйте блоки последовательно. Подсказки объясняют назначение полей, а опубликованные значения уже подставлены в форму.",
    targets: [
      "main .render-fields",
      "main form .tabs-field",
      "main form"
    ],
    placement: "left"
  },
  {
    title: "Сохранение и проверка",
    text:
      "После правок сохраните раздел и откройте публичную страницу в новой вкладке. Так вы сразу увидите итог глазами клиента.",
    targets: [
      "main .doc-controls",
      "main .form-submit",
      "main button[type='submit']"
    ],
    placement: "top"
  }
];

export const adminTrainingModules: AdminTrainingModule[] = [
  {
    id: "overview",
    label: "Обзор",
    route: "/admin",
    roles: allRoles,
    steps: [
      {
        title: "Ваш центр управления",
        text:
          "Главный экран показывает только доступные вам показатели, быстрые действия и состояние рабочих сервисов.",
        targets: ['[data-tour="dashboard-hero"]'],
        placement: "bottom"
      },
      {
        title: "Быстрые действия",
        text:
          "Основные операции открываются отсюда без поиска по меню. Состав действий зависит от вашей роли.",
        targets: ['[data-tour="quick-actions"]'],
        placement: "bottom"
      },
      {
        title: "Рабочие разделы",
        text:
          "Карточки ведут к ежедневным задачам. Дальше обучение будет продолжаться короткими блоками уже внутри каждой страницы.",
        targets: ['[data-tour="workspace"]'],
        placement: "top"
      }
    ]
  },
  {
    id: "leads",
    label: "Входящие заявки",
    route: "/admin/collections/leads",
    roles: leadRoles,
    steps: listSteps(
      "leads",
      "Все обращения в одном журнале",
      "Здесь видны контакты клиента, источник, параметры расчёта и результат доставки заявки."
    )
  },
  {
    id: "seo",
    label: "SEO и конверсии",
    route: "/admin/seo",
    roles: analyticsRoles,
    steps: [
      {
        title: "Поисковая видимость",
        text:
          "Отчёт собирает реальные показы, клики, CTR, позиции, цели и конверсии из подключённых поисковых систем.",
        targets: ['[data-tour="seo-hero"]'],
        placement: "bottom"
      },
      {
        title: "Два рабочих режима",
        text:
          "Переключайтесь между поисковой видимостью и целями. Каждый режим сохраняет понятный набор показателей.",
        targets: ['[data-tour="seo-tabs"]'],
        placement: "bottom"
      },
      {
        title: "Период, поисковик и запрос",
        text:
          "Выберите период, источник и устройство. Для точечной проверки можно ввести конкретный поисковый запрос.",
        targets: ['[data-tour="seo-controls"]'],
        placement: "bottom"
      }
    ]
  },
  {
    id: "system",
    label: "Здоровье сайта",
    route: "/admin/system",
    roles: systemRoles,
    steps: [
      {
        title: "Системный контроль",
        text:
          "Этот экран показывает доступность базы, заявок, почты, Telegram, аналитики и синхронизации контента.",
        targets: ['[data-tour="system-hero"]'],
        placement: "bottom"
      },
      {
        title: "Что требует внимания",
        text:
          "Карточки отделяют рабочие сервисы от предупреждений. Ошибка здесь означает конкретное действие, а не технический код.",
        targets: ['[data-tour="system-health"]'],
        placement: "top"
      },
      {
        title: "Кто и что изменил",
        text:
          "История помогает найти автора и время изменения. Аватар, имя и должность зафиксированы для понятного аудита.",
        targets: ['[data-tour="system-history"]'],
        placement: "top"
      }
    ]
  },
  {
    id: "integrations",
    label: "Интеграции",
    route: "/admin/integrations",
    roles: integrationRoles,
    steps: [
      {
        title: "Статусы подключений",
        text:
          "На странице собраны Telegram, почта, поисковые системы и другие внешние каналы. Зелёный статус означает рабочее подключение.",
        targets: ['[data-tour="integrations-hero"]'],
        placement: "bottom"
      },
      {
        title: "Проверяйте результат, а не секреты",
        text:
          "Админка показывает состояние и способ проверки, но не раскрывает пароли, токены и другие служебные данные.",
        targets: [
          '[data-tour="integrations-grid"]',
          '[data-tour="integrations-note"]'
        ],
        placement: "top"
      }
    ]
  },
  {
    id: "home",
    label: "Главная страница",
    route: "/admin/globals/home-content",
    roles: contentRoles,
    steps: formSteps(
      "home",
      "Контент главной страницы",
      "Здесь находятся текущие тексты, видео и смысловые блоки главной. Новые значения сразу заменяют опубликованные после сохранения."
    )
  },
  {
    id: "contacts",
    label: "Контакты",
    route: "/admin/globals/contacts",
    roles: contentRoles,
    steps: formSteps(
      "contacts",
      "Контакты компании",
      "Телефоны, почта, адрес, график работы и ссылки меняются централизованно и автоматически обновляются на сайте."
    )
  },
  {
    id: "navigation",
    label: "Меню и подвал",
    route: "/admin/globals/site-navigation",
    roles: contentRoles,
    steps: formSteps(
      "navigation",
      "Навигация сайта",
      "Порядок и подписи ссылок должны помогать клиенту быстро перейти в каталог, калькулятор и контакты."
    )
  },
  {
    id: "media",
    label: "Медиа-библиотека",
    route: "/admin/collections/media",
    roles: mediaRoles,
    steps: listSteps(
      "media",
      "Единая библиотека файлов",
      "Загруженные изображения автоматически получают быстрые версии для телефона, планшета и компьютера."
    )
  },
  {
    id: "categories",
    label: "Категории",
    route: "/admin/collections/categories",
    roles: catalogStructureRoles,
    steps: listSteps(
      "categories",
      "Основные направления каталога",
      "Категории задают верхний уровень каталога, порядок показа, изображение и поисковое описание."
    )
  },
  {
    id: "subcategories",
    label: "Подкатегории",
    route: "/admin/collections/subcategories",
    roles: catalogStructureRoles,
    steps: listSteps(
      "subcategories",
      "Внутренняя структура каталога",
      "Подкатегории группируют близкие решения и помогают клиенту быстрее сузить выбор."
    )
  },
  {
    id: "products",
    label: "Товары",
    route: "/admin/collections/products",
    roles: productRoles,
    steps: listSteps(
      "products",
      "Карточки оборудования",
      "В списке видны категория, режим цены, приоритет и статус публикации без технических значений «правда/ложь»."
    )
  },
  {
    id: "product-editor",
    label: "Создание товара",
    route: "/admin/collections/products/create",
    roles: productCreatorRoles,
    steps: [
      {
        title: "Карточка заполняется по порядку",
        text:
          "Начните с названия и категории. Адрес страницы создаётся автоматически, а этапы ведут от описания к публикации.",
        targets: ['[data-tour="product-editor-guide"]'],
        placement: "bottom"
      },
      {
        title: "Главное и дополнительные изображения",
        text:
          "Главное фото представляет товар в каталоге. Дополнительные ракурсы и работа оборудования показываются уменьшенной галереей.",
        targets: [
          "main .tabs-field",
          "main .render-fields",
          "main form"
        ],
        placement: "left"
      },
      {
        title: "Предпросмотр перед публикацией",
        text:
          "Проверьте характеристики, режим цены, SEO и внешний вид карточки. Не сохраняйте учебную запись, если не создаёте реальный товар.",
        targets: [
          "main .doc-controls",
          "main .form-submit",
          "main button[type='submit']"
        ],
        placement: "top"
      }
    ]
  },
  {
    id: "calculator",
    label: "Профили расчёта",
    route: "/admin/collections/calculator-profiles",
    roles: calculatorRoles,
    steps: listSteps(
      "calculator",
      "Системы и формулы калькулятора",
      "Профиль связывает тип системы, доступные размеры, коэффициенты, опции и режим отображения стоимости."
    )
  },
  {
    id: "lead-management",
    label: "Формы и доставка",
    route: "/admin/globals/lead-management",
    roles: ["admin"] as CmsRole[],
    steps: formSteps(
      "lead-management",
      "Формы и доставка заявок",
      "Раздел показывает точки сбора обращений и состояние Telegram, почты и будущих интеграций без хранения секретов."
    )
  },
  {
    id: "users",
    label: "Команда и доступы",
    route: "/admin/collections/users",
    roles: ["admin"] as CmsRole[],
    steps: [
      {
        title: "Сотрудники и безопасные роли",
        text:
          "Каждому сотруднику назначается минимально необходимая роль. Не используйте общий аккаунт для нескольких людей.",
        targets: ['[data-tour="section-users-hero"]'],
        placement: "bottom"
      },
      {
        title: "Приглашение без передачи пароля",
        text:
          "Укажите имя, должность, рабочий email и роль. Сотрудник получит одноразовую ссылку, сам задаст пароль, а аватар выберет при заполнении профиля.",
        targets: ['[data-tour="user-invite"]'],
        placement: "bottom"
      },
      {
        title: "Статус доступа всегда виден",
        text:
          "В списке видно, кто уже активировал аккаунт, у кого ссылка ещё ожидает принятия или письмо не доставлено. При необходимости приглашение можно отправить повторно.",
        targets: [
          ".collection-list table",
          ".collection-list .table",
          "main table"
        ],
        placement: "top"
      }
    ]
  },
  {
    id: "profile",
    label: "Ваш профиль",
    route: "/admin/account",
    roles: allRoles,
    steps: [
      {
        title: "Остался ваш профиль",
        text:
          "Укажите настоящее имя и должность, затем выберите фирменного персонажа. Эти данные будут видны в истории изменений.",
        targets: [
          "main form",
          ".account",
          ".template-minimal__wrap"
        ],
        placement: "left"
      },
      {
        title: "Сохраните профиль",
        text:
          "После сохранения коллеги будут сразу понимать, кто изменил контент, цену или настройки. На этом обучение завершено.",
        targets: [
          "main .doc-controls",
          "main .form-submit",
          "main button[type='submit']"
        ],
        placement: "top"
      }
    ]
  }
];

export function getAdminTrainingJourney(role: CmsRole): AdminTrainingModule[] {
  return adminTrainingModules.filter((module) => module.roles.includes(role));
}

export function isTrainingRoute(pathname: string, route: string): boolean {
  const normalize = (value: string) => {
    const clean = value.split("?")[0]?.split("#")[0] || "/";
    return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
  };

  return normalize(pathname) === normalize(route);
}
