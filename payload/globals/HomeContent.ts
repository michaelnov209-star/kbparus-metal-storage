import type { GlobalConfig } from "payload";
import { businessRowLabel } from "../admin/array-row-label";
import { adminSectionHeroField } from "../admin/section-hero";
import { adminGroups, adminHints } from "../admin/structure";
import { canEditContent, contentManagersOnly, publicRead } from "../access/rbac";

const iconOptions = [
  { label: { ru: "Инженерная проверка", en: "Engineering check" }, value: "badge-check" },
  { label: { ru: "Материалы / коробки", en: "Materials" }, value: "boxes" },
  { label: { ru: "Контрольный список", en: "Checklist" }, value: "clipboard-check" },
  { label: { ru: "Производство", en: "Factory" }, value: "factory" },
  { label: { ru: "География", en: "Geography" }, value: "globe" },
  { label: { ru: "Листы / уровни", en: "Layers" }, value: "layers" },
  { label: { ru: "Заявка / связь", en: "Message" }, value: "message-circle" },
  { label: { ru: "Комплектация", en: "Package" }, value: "package-check" },
  { label: { ru: "Маршрут", en: "Route" }, value: "route" },
  { label: { ru: "Безопасность", en: "Safety" }, value: "shield-check" },
  { label: { ru: "Доставка", en: "Delivery" }, value: "truck" },
  { label: { ru: "Склад", en: "Warehouse" }, value: "warehouse" },
  { label: { ru: "Проектирование", en: "Engineering" }, value: "wrench" },
  { label: { ru: "Скорость", en: "Speed" }, value: "zap" }
];

export const HomeContent: GlobalConfig = {
  slug: "home-content",
  label: { ru: "Главная страница", en: "Home content" },
  admin: {
    group: adminGroups.home,
    hidden: ({ user }) => !canEditContent(user),
    description: {
      ru: `${adminHints.homepage} Раздел устроен как редактор лендинга: двигайтесь по вкладкам сверху вниз в порядке появления блоков на сайте.`,
      en: "Homepage blocks."
    }
  },
  fields: [
    adminSectionHeroField("home"),
    {
      type: "tabs",
      tabs: [
        {
          label: { ru: "Hero: первый экран сайта", en: "Hero" },
          fields: [
            {
              name: "hero",
              type: "group",
              label: { ru: "Главный экран сайта", en: "Hero" },
              admin: {
                description: {
                  ru: "Первое, что видит клиент. Здесь задаются смысл, фон и ключевые цифры главной страницы."
                }
              },
              fields: [
                { name: "eyebrow", label: { ru: "Надзаголовок (мелкий текст сверху)", en: "Eyebrow" }, type: "text" },
                { name: "title", label: { ru: "Главный заголовок", en: "Main title" }, type: "text", required: true },
                { name: "description", label: { ru: "Подзаголовок", en: "Description" }, type: "textarea" },
                {
                  name: "background",
                  type: "group",
                  label: { ru: "Фон Hero", en: "Background" },
                  admin: {
                    description: {
                      ru: "Выберите видео или статичную картинку. Если ничего не задано — будет показано дефолтное видео производства.",
                      en: ""
                    }
                  },
                  fields: [
                    {
                      name: "type",
                      label: { ru: "Что показывать на фоне", en: "Background type" },
                      type: "select",
                      required: true,
                      defaultValue: "video",
                      options: [
                        { label: { ru: "Видео (с автозапуском)", en: "Video (autoplay)" }, value: "video" },
                        { label: { ru: "Картинка (статичная)", en: "Static image" }, value: "image" }
                      ]
                    },
                    {
                      name: "video",
                      label: { ru: "Видео-фон (mp4 / webm)", en: "Background video" },
                      type: "upload",
                      relationTo: "media",
                      filterOptions: { mimeType: { contains: "video" } },
                      admin: {
                        description: {
                          ru: "MP4 или WebM. Проигрывается автоматически без звука. Рекомендуем 10-30 сек, до 10 МБ. На мобильных подгружается с задержкой (preload=metadata) — не нагружает производительность.",
                          en: ""
                        },
                        condition: (_, sibling) => sibling?.type === "video"
                      }
                    },
                    {
                      name: "mobileVideo",
                      label: { ru: "Облегчённое видео для телефонов и планшетов", en: "Mobile and tablet video" },
                      type: "upload",
                      relationTo: "media",
                      filterOptions: { mimeType: { contains: "video" } },
                      admin: {
                        description: {
                          ru: "Необязательный MP4/WebM: ширина 720–960 px, без звука, желательно до 3 МБ. Телефоны и планшеты до 1180 px загрузят этот файл вместо тяжёлого основного видео.",
                          en: "Optional lightweight video used on screens up to 1180 px."
                        },
                        condition: (_, sibling) => sibling?.type === "video"
                      }
                    },
                    {
                      name: "poster",
                      label: { ru: "Постер (картинка-заглушка пока видео грузится)", en: "Video poster" },
                      type: "upload",
                      relationTo: "media",
                      filterOptions: { mimeType: { contains: "image" } },
                      admin: {
                        description: {
                          ru: "Что показать на медленных устройствах, пока видео не подгрузилось. Также используется как fallback если браузер не воспроизводит видео.",
                          en: ""
                        },
                        condition: (_, sibling) => sibling?.type === "video"
                      }
                    },
                    {
                      name: "image",
                      label: { ru: "Картинка-фон", en: "Background image" },
                      type: "upload",
                      relationTo: "media",
                      filterOptions: { mimeType: { contains: "image" } },
                      admin: {
                        description: {
                          ru: "Высококачественное фото (рекомендуем 1920×1080 px и больше). Будет автоматически оптимизирована и подана в формате WebP в трёх размерах для разных устройств.",
                          en: ""
                        },
                        condition: (_, sibling) => sibling?.type === "image"
                      }
                    }
                  ]
                },
                {
                  name: "metrics",
                  label: { ru: "Метрики (3 цифры в hero)", en: "Hero metrics" },
                  labels: {
                    singular: { ru: "Показатель первого экрана", en: "Hero metric" },
                    plural: { ru: "Показатели первого экрана", en: "Hero metrics" }
                  },
                  type: "array",
                  maxRows: 4,
                  admin: {
                    components: {
                      RowLabel: businessRowLabel({
                        fallback: "Новый показатель",
                        primaryFields: ["label", "value"],
                        secondaryFields: ["value"]
                      })
                    }
                  },
                  fields: [
                    { type: "row", fields: [
                      { name: "value", label: { ru: "Значение (напр. «500+»)", en: "Value" }, type: "text", required: true, admin: { width: "40%" } },
                      { name: "label", label: { ru: "Подпись (напр. «проектов»)", en: "Label" }, type: "text", required: true, admin: { width: "60%" } }
                    ]}
                  ]
                },
                {
                  name: "actions",
                  label: { ru: "Кнопки призыва к действию (под заголовком)", en: "Hero CTAs" },
                  labels: {
                    singular: { ru: "Кнопка первого экрана", en: "Hero button" },
                    plural: { ru: "Кнопки первого экрана", en: "Hero buttons" }
                  },
                  type: "array",
                  maxRows: 3,
                  admin: {
                    description: {
                      ru: "Кнопки под главным заголовком. Если оставить пустым — показываются стандартные «Рассчитать стоимость» и «Получить КП». Рекомендуем 1–2 кнопки. В поле «Куда ведёт» можно указать якорь раздела: #calculator (калькулятор) или #request (форма заявки).",
                      en: "Buttons under the main headline. Empty = default CTAs."
                    },
                    components: {
                      RowLabel: businessRowLabel({
                        fallback: "Новая кнопка",
                        primaryFields: ["label", "href"],
                        secondaryFields: ["href"]
                      })
                    }
                  },
                  fields: [
                    { type: "row", fields: [
                      { name: "label", label: { ru: "Текст кнопки", en: "Label" }, type: "text", required: true, admin: { width: "40%", placeholder: "Рассчитать стоимость" } },
                      { name: "href", label: { ru: "Куда ведёт (URL или #якорь)", en: "Href" }, type: "text", required: true, admin: { width: "40%", placeholder: "#calculator" } },
                      { name: "style", label: { ru: "Стиль", en: "Style" }, type: "select", defaultValue: "primary", admin: { width: "20%" }, options: [
                        { label: { ru: "Основная (оранжевая)", en: "Primary" }, value: "primary" },
                        { label: { ru: "Второстепенная (контурная)", en: "Secondary" }, value: "secondary" }
                      ] }
                    ]}
                  ]
                }
              ]
            }
          ]
        },
        {
          label: { ru: "Преимущества: почему выбирают КБ Парус", en: "Advantages" },
          fields: [
            {
              name: "advantages",
              label: { ru: "Карточки преимуществ", en: "Advantage cards" },
              labels: {
                singular: { ru: "Преимущество", en: "Advantage" },
                plural: { ru: "Преимущества", en: "Advantages" }
              },
              type: "array",
              admin: {
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новое преимущество",
                    primaryFields: ["title"]
                  })
                }
              },
              fields: [
                { name: "title", label: { ru: "Заголовок", en: "Title" }, type: "text", required: true },
                { name: "icon", label: { ru: "Иконка карточки", en: "Icon" }, type: "select", options: iconOptions, defaultValue: "badge-check" },
                { name: "description", label: { ru: "Описание", en: "Description" }, type: "textarea" }
              ]
            }
          ]
        },
        {
          label: { ru: "Что храним: материалы и сценарии", en: "What to store" },
          fields: [
            {
              name: "storedMaterials",
              label: { ru: "Материалы (карточки)", en: "Stored materials" },
              labels: {
                singular: { ru: "Материал или сценарий", en: "Stored material" },
                plural: { ru: "Материалы и сценарии", en: "Stored materials" }
              },
              type: "array",
              admin: {
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новый материал",
                    primaryFields: ["title", "label"]
                  })
                }
              },
              fields: [
                { name: "title", label: { ru: "Название", en: "" }, type: "text", required: true },
                { name: "label", label: { ru: "Короткая подпись на визуале", en: "Visual label" }, type: "text" },
                { name: "icon", label: { ru: "Иконка", en: "Icon" }, type: "select", options: iconOptions, defaultValue: "package-check" },
                { name: "description", label: { ru: "Описание", en: "" }, type: "textarea" },
                { name: "image", label: { ru: "Фото", en: "" }, type: "upload", relationTo: "media" }
              ]
            }
          ]
        },
        {
          label: { ru: "До / после: визуальное сравнение", en: "Before / after" },
          fields: [
            {
              name: "beforeBlock",
              label: { ru: "ДО (хаос)", en: "Before" },
              type: "group",
              fields: [
                { name: "title", label: { ru: "Заголовок", en: "" }, type: "text" },
                { name: "text", label: { ru: "Короткое описание", en: "Text" }, type: "textarea" },
                { name: "image", label: { ru: "Фото", en: "" }, type: "upload", relationTo: "media" },
                {
                  name: "points",
                  label: { ru: "Тезисы", en: "Points" },
                  labels: {
                    singular: { ru: "Проблема до внедрения", en: "Before point" },
                    plural: { ru: "Проблемы до внедрения", en: "Before points" }
                  },
                  type: "array",
                  admin: {
                    components: {
                      RowLabel: businessRowLabel({
                        fallback: "Новая проблема",
                        primaryFields: ["value"]
                      })
                    }
                  },
                  fields: [
                    {
                      name: "value",
                      label: { ru: "Проблема до внедрения", en: "Before point" },
                      type: "text",
                      admin: {
                        description: {
                          ru: "Один конкретный недостаток прежнего способа работы."
                        }
                      }
                    }
                  ]
                }
              ]
            },
            {
              name: "afterBlock",
              label: { ru: "ПОСЛЕ (порядок)", en: "After" },
              type: "group",
              fields: [
                { name: "title", label: { ru: "Заголовок", en: "" }, type: "text" },
                { name: "text", label: { ru: "Короткое описание", en: "Text" }, type: "textarea" },
                { name: "image", label: { ru: "Фото", en: "" }, type: "upload", relationTo: "media" },
                {
                  name: "points",
                  label: { ru: "Тезисы", en: "Points" },
                  labels: {
                    singular: { ru: "Результат после внедрения", en: "After point" },
                    plural: { ru: "Результаты после внедрения", en: "After points" }
                  },
                  type: "array",
                  admin: {
                    components: {
                      RowLabel: businessRowLabel({
                        fallback: "Новый результат",
                        primaryFields: ["value"]
                      })
                    }
                  },
                  fields: [
                    {
                      name: "value",
                      label: { ru: "Результат после внедрения", en: "After point" },
                      type: "text",
                      admin: {
                        description: {
                          ru: "Одно понятное улучшение, которое получил клиент."
                        }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          label: { ru: "Кейсы: подтверждение опыта", en: "Cases" },
          fields: [
            {
              name: "cases",
              label: { ru: "Кейсы клиентов", en: "Cases" },
              labels: {
                singular: { ru: "Кейс клиента", en: "Case" },
                plural: { ru: "Кейсы клиентов", en: "Cases" }
              },
              type: "array",
              admin: {
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новый кейс",
                    primaryFields: ["title", "customer"],
                    secondaryFields: ["customer"]
                  })
                }
              },
              fields: [
                { name: "customer", label: { ru: "Клиент / отрасль", en: "Customer" }, type: "text" },
                { name: "title", label: { ru: "Название проекта", en: "Title" }, type: "text", required: true },
                { name: "task", label: { ru: "Задача клиента", en: "Task" }, type: "textarea" },
                { name: "result", label: { ru: "Результат", en: "Result" }, type: "textarea" },
                { name: "description", label: { ru: "Короткое описание (fallback)", en: "" }, type: "textarea" },
                { name: "image", label: { ru: "Фото", en: "" }, type: "upload", relationTo: "media" },
                {
                  name: "metrics",
                  label: { ru: "Цифры (опционально)", en: "Metrics" },
                  labels: {
                    singular: { ru: "Результат в цифрах", en: "Case metric" },
                    plural: { ru: "Результаты в цифрах", en: "Case metrics" }
                  },
                  type: "array",
                  admin: {
                    components: {
                      RowLabel: businessRowLabel({
                        fallback: "Новый результат в цифрах",
                        primaryFields: ["label", "value"],
                        secondaryFields: ["value"]
                      })
                    }
                  },
                  fields: [
                    { type: "row", fields: [
                      { name: "value", label: { ru: "Значение", en: "" }, type: "text", admin: { width: "40%" } },
                      { name: "label", label: { ru: "Подпись", en: "" }, type: "text", admin: { width: "60%" } }
                    ]}
                  ]
                }
              ]
            }
          ]
        },
        {
          label: { ru: "География поставок", en: "Geography" },
          fields: [
            {
              name: "geoProjects",
              label: { ru: "Города и проекты на карте", en: "Cities" },
              labels: {
                singular: { ru: "Город поставки", en: "Delivery city" },
                plural: { ru: "Города поставок", en: "Delivery cities" }
              },
              type: "array",
              admin: {
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новый город поставки",
                    primaryFields: ["city"],
                    secondaryFields: ["project"]
                  })
                }
              },
              fields: [
                { type: "row", fields: [
                  { name: "city", label: { ru: "Город", en: "" }, type: "text", required: true, admin: { width: "40%" } },
                  { name: "project", label: { ru: "Краткий проект", en: "" }, type: "text", admin: { width: "60%" } }
                ]}
              ]
            }
          ]
        },
        {
          label: { ru: "Отзывы клиентов", en: "Reviews" },
          fields: [
            {
              name: "reviews",
              label: { ru: "Отзывы клиентов", en: "Reviews" },
              labels: {
                singular: { ru: "Отзыв клиента", en: "Review" },
                plural: { ru: "Отзывы клиентов", en: "Reviews" }
              },
              type: "array",
              admin: {
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новый отзыв",
                    primaryFields: ["name"],
                    secondaryFields: ["role"]
                  })
                }
              },
              fields: [
                { name: "name", label: { ru: "Имя", en: "Name" }, type: "text", required: true },
                { name: "role", label: { ru: "Должность / компания", en: "Role" }, type: "text" },
                { name: "text", label: { ru: "Текст отзыва", en: "Text" }, type: "textarea", required: true },
                { name: "image", label: { ru: "Фото автора", en: "" }, type: "upload", relationTo: "media" }
              ]
            }
          ]
        },
        {
          label: { ru: "Партнёры (логотипы)", en: "Partners" },
          fields: [
            {
              name: "partners",
              label: { ru: "Логотипы партнёров", en: "Partner logos" },
              labels: {
                singular: { ru: "Партнёр", en: "Partner" },
                plural: { ru: "Партнёры", en: "Partners" }
              },
              type: "array",
              admin: {
                description: { ru: "Загрузите логотип каждого партнёра. Они будут показаны в слайдере на главной.", en: "" },
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новый партнёр",
                    primaryFields: ["name"],
                    secondaryFields: ["url"]
                  })
                }
              },
              fields: [
                { type: "row", fields: [
                  { name: "name", label: { ru: "Название партнёра", en: "Name" }, type: "text", required: true, admin: { width: "40%" } },
                  { name: "logo", label: { ru: "Логотип", en: "Logo" }, type: "upload", relationTo: "media", admin: { width: "30%" } },
                  { name: "url", label: { ru: "Ссылка на сайт партнёра (опц.)", en: "URL" }, type: "text", admin: { width: "30%" } }
                ]}
              ]
            }
          ]
        },
        {
          label: { ru: "3 шага отгрузки", en: "Shipment steps" },
          fields: [
            {
              name: "shipmentSteps",
              label: { ru: "Этапы отгрузки", en: "Steps" },
              labels: {
                singular: { ru: "Этап отгрузки", en: "Shipment step" },
                plural: { ru: "Этапы отгрузки", en: "Shipment steps" }
              },
              type: "array",
              maxRows: 5,
              admin: {
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новый этап отгрузки",
                    primaryFields: ["title"]
                  })
                }
              },
              fields: [
                { name: "title", label: { ru: "Заголовок шага", en: "Title" }, type: "text", required: true },
                { name: "icon", label: { ru: "Иконка", en: "Icon" }, type: "select", options: iconOptions, defaultValue: "route" },
                { name: "description", label: { ru: "Описание", en: "Description" }, type: "textarea" }
              ]
            }
          ]
        },
        {
          label: { ru: "О компании: доверие и факты", en: "About" },
          fields: [
            { name: "aboutTitle", label: { ru: "Заголовок", en: "Title" }, type: "text" },
            { name: "aboutText", label: { ru: "Текст о компании", en: "Text" }, type: "textarea" },
            {
              name: "aboutFeatures",
              label: { ru: "Короткие факты под текстом", en: "Feature chips" },
              labels: {
                singular: { ru: "Факт о компании", en: "Company fact" },
                plural: { ru: "Факты о компании", en: "Company facts" }
              },
              type: "array",
              maxRows: 6,
              admin: {
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новый факт о компании",
                    primaryFields: ["label"]
                  })
                }
              },
              fields: [
                { type: "row", fields: [
                  { name: "label", label: { ru: "Факт", en: "Label" }, type: "text", admin: { width: "70%" } },
                  { name: "icon", label: { ru: "Иконка", en: "Icon" }, type: "select", options: iconOptions, defaultValue: "factory", admin: { width: "30%" } }
                ]}
              ]
            },
            {
              name: "aboutMetrics",
              label: { ru: "Метрики о компании", en: "Metrics" },
              labels: {
                singular: { ru: "Показатель компании", en: "Company metric" },
                plural: { ru: "Показатели компании", en: "Company metrics" }
              },
              type: "array",
              admin: {
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новый показатель компании",
                    primaryFields: ["label", "value"],
                    secondaryFields: ["value"]
                  })
                }
              },
              fields: [
                { type: "row", fields: [
                  { name: "value", label: { ru: "Значение", en: "" }, type: "text", admin: { width: "40%" } },
                  { name: "label", label: { ru: "Подпись", en: "" }, type: "text", admin: { width: "60%" } }
                ]}
              ]
            }
          ]
        },
        {
          label: { ru: "Баннеры и переходы на связанные сайты", en: "Banners" },
          fields: [
            {
              name: "kbparusBanner",
              label: { ru: "Баннер kbparus.ru", en: "kbparus.ru banner" },
              type: "group",
              fields: [
                { name: "image", label: { ru: "Картинка", en: "" }, type: "upload", relationTo: "media" },
                { name: "url", label: { ru: "Ссылка", en: "" }, type: "text", defaultValue: "https://www.kbparus.ru/" },
                { name: "ctaLabel", label: { ru: "Текст кнопки", en: "" }, type: "text", defaultValue: "Перейти на kbparus.ru" }
              ]
            },
            {
              name: "coatingBanner",
              label: { ru: "Баннер линииокраски.рф", en: "Coating banner" },
              type: "group",
              fields: [
                { name: "image", label: { ru: "Картинка", en: "" }, type: "upload", relationTo: "media" },
                { name: "url", label: { ru: "Ссылка", en: "" }, type: "text", defaultValue: "https://линииокраски.рф/" },
                { name: "ctaLabel", label: { ru: "Текст кнопки", en: "" }, type: "text", defaultValue: "Перейти на линииокраски.рф" }
              ]
            }
          ]
        },
        {
          label: { ru: "FAQ: вопросы клиентов", en: "FAQ" },
          fields: [
            {
              name: "faq",
              label: { ru: "Вопросы и ответы", en: "FAQ" },
              labels: {
                singular: { ru: "Вопрос клиента", en: "FAQ item" },
                plural: { ru: "Вопросы клиентов", en: "FAQ items" }
              },
              type: "array",
              admin: {
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новый вопрос",
                    primaryFields: ["question"]
                  })
                }
              },
              fields: [
                { name: "question", label: { ru: "Вопрос", en: "Question" }, type: "text", required: true },
                { name: "answer", label: { ru: "Ответ", en: "Answer" }, type: "textarea", required: true }
              ]
            }
          ]
        }
      ]
    }
  ],
  access: {
    read: publicRead,
    update: contentManagersOnly
  }
};
