import type { GlobalConfig } from "payload";

export const HomeContent: GlobalConfig = {
  slug: "home-content",
  label: { ru: "Главная страница", en: "Home content" },
  admin: {
    description: {
      ru: "Все блоки главной страницы: hero, метрики, преимущества, баннеры, отзывы, партнёры, FAQ.",
      en: "Homepage blocks."
    }
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: { ru: "Hero (главный блок)", en: "Hero" },
          fields: [
            { name: "heroEyebrow", label: { ru: "Надзаголовок (мелкий текст сверху)", en: "Eyebrow" }, type: "text" },
            { name: "heroTitle", label: { ru: "Главный заголовок", en: "Main title" }, type: "text", required: true },
            { name: "heroDescription", label: { ru: "Подзаголовок", en: "Description" }, type: "textarea" },
            {
              name: "heroBackgroundMode",
              label: { ru: "Что показывать на фоне", en: "Background mode" },
              type: "select",
              required: true,
              defaultValue: "video",
              options: [
                { label: { ru: "Видео (с автозапуском)", en: "Video (autoplay)" }, value: "video" },
                { label: { ru: "Картинка (статичная)", en: "Static image" }, value: "image" }
              ],
              admin: {
                description: {
                  ru: "Если выбрано «Видео» — на фоне будет проигрываться видео из поля ниже. Если «Картинка» — статичное изображение.",
                  en: ""
                }
              }
            },
            {
              name: "heroVideo",
              label: { ru: "Видео-фон (mp4 / webm)", en: "Hero video" },
              type: "upload",
              relationTo: "media",
              filterOptions: { mimeType: { contains: "video" } },
              admin: {
                description: {
                  ru: "Загрузите видео формата MP4 (или WebM). Будет проигрываться автоматически без звука. Рекомендуем длину 10-30 сек, размер до 10 МБ для быстрой загрузки.",
                  en: ""
                },
                condition: (_, sibling) => sibling?.heroBackgroundMode === "video"
              }
            },
            {
              name: "heroPosterImage",
              label: { ru: "Постер видео (что показывается ДО загрузки видео)", en: "Video poster" },
              type: "upload",
              relationTo: "media",
              filterOptions: { mimeType: { contains: "image" } },
              admin: {
                description: {
                  ru: "Изображение, которое отображается на тех устройствах, где видео ещё не загрузилось или не поддерживается.",
                  en: ""
                },
                condition: (_, sibling) => sibling?.heroBackgroundMode === "video"
              }
            },
            {
              name: "heroImage",
              label: { ru: "Картинка-фон", en: "Hero image" },
              type: "upload",
              relationTo: "media",
              filterOptions: { mimeType: { contains: "image" } },
              admin: {
                description: {
                  ru: "Высококачественное фото производства или объекта (рекомендуем 1920×1080 px и больше). Используется когда выбран режим «Картинка».",
                  en: ""
                },
                condition: (_, sibling) => sibling?.heroBackgroundMode === "image"
              }
            },
            {
              name: "heroMetrics",
              label: { ru: "Метрики (3 цифры в hero)", en: "Hero metrics" },
              type: "array",
              maxRows: 4,
              fields: [
                { type: "row", fields: [
                  { name: "value", label: { ru: "Значение (напр. «500+»)", en: "Value" }, type: "text", required: true, admin: { width: "40%" } },
                  { name: "label", label: { ru: "Подпись (напр. «проектов»)", en: "Label" }, type: "text", required: true, admin: { width: "60%" } }
                ]}
              ]
            }
          ]
        },
        {
          label: { ru: "Преимущества", en: "Advantages" },
          fields: [
            {
              name: "advantages",
              label: { ru: "Карточки преимуществ", en: "Advantage cards" },
              type: "array",
              fields: [
                { name: "title", label: { ru: "Заголовок", en: "Title" }, type: "text", required: true },
                { name: "description", label: { ru: "Описание", en: "Description" }, type: "textarea" }
              ]
            }
          ]
        },
        {
          label: { ru: "Что хранить", en: "What to store" },
          fields: [
            {
              name: "storedMaterials",
              label: { ru: "Материалы (карточки)", en: "Stored materials" },
              type: "array",
              fields: [
                { name: "title", label: { ru: "Название", en: "" }, type: "text", required: true },
                { name: "description", label: { ru: "Описание", en: "" }, type: "textarea" },
                { name: "image", label: { ru: "Фото", en: "" }, type: "upload", relationTo: "media" }
              ]
            }
          ]
        },
        {
          label: { ru: "До / после", en: "Before / after" },
          fields: [
            {
              name: "beforeBlock",
              label: { ru: "ДО (хаос)", en: "Before" },
              type: "group",
              fields: [
                { name: "title", label: { ru: "Заголовок", en: "" }, type: "text" },
                { name: "image", label: { ru: "Фото", en: "" }, type: "upload", relationTo: "media" },
                { name: "points", label: { ru: "Тезисы", en: "" }, type: "array", fields: [{ name: "value", type: "text" }] }
              ]
            },
            {
              name: "afterBlock",
              label: { ru: "ПОСЛЕ (порядок)", en: "After" },
              type: "group",
              fields: [
                { name: "title", label: { ru: "Заголовок", en: "" }, type: "text" },
                { name: "image", label: { ru: "Фото", en: "" }, type: "upload", relationTo: "media" },
                { name: "points", label: { ru: "Тезисы", en: "" }, type: "array", fields: [{ name: "value", type: "text" }] }
              ]
            }
          ]
        },
        {
          label: { ru: "Кейсы", en: "Cases" },
          fields: [
            {
              name: "cases",
              label: { ru: "Кейсы клиентов", en: "Cases" },
              type: "array",
              fields: [
                { name: "title", label: { ru: "Название клиента/проекта", en: "Title" }, type: "text", required: true },
                { name: "description", label: { ru: "Описание", en: "" }, type: "textarea" },
                { name: "image", label: { ru: "Фото", en: "" }, type: "upload", relationTo: "media" },
                {
                  name: "metrics",
                  label: { ru: "Цифры (опционально)", en: "Metrics" },
                  type: "array",
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
          label: { ru: "География", en: "Geography" },
          fields: [
            {
              name: "geoProjects",
              label: { ru: "Города и проекты на карте", en: "Cities" },
              type: "array",
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
          label: { ru: "Отзывы", en: "Reviews" },
          fields: [
            {
              name: "reviews",
              label: { ru: "Отзывы клиентов", en: "Reviews" },
              type: "array",
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
              type: "array",
              admin: { description: { ru: "Загрузите логотип каждого партнёра. Они будут показаны в слайдере на главной.", en: "" } },
              fields: [
                { type: "row", fields: [
                  { name: "name", label: { ru: "Название партнёра", en: "Name" }, type: "text", required: true, admin: { width: "40%" } },
                  { name: "logo", label: { ru: "Логотип", en: "Logo" }, type: "upload", relationTo: "media", required: true, admin: { width: "30%" } },
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
              type: "array",
              maxRows: 5,
              fields: [
                { name: "title", label: { ru: "Заголовок шага", en: "Title" }, type: "text", required: true },
                { name: "description", label: { ru: "Описание", en: "Description" }, type: "textarea" }
              ]
            }
          ]
        },
        {
          label: { ru: "О компании", en: "About" },
          fields: [
            { name: "aboutTitle", label: { ru: "Заголовок", en: "Title" }, type: "text" },
            { name: "aboutText", label: { ru: "Текст о компании", en: "Text" }, type: "textarea" },
            {
              name: "aboutMetrics",
              label: { ru: "Метрики о компании", en: "Metrics" },
              type: "array",
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
          label: { ru: "Баннеры (партнёрские сайты)", en: "Banners" },
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
          label: { ru: "FAQ", en: "FAQ" },
          fields: [
            {
              name: "faq",
              label: { ru: "Вопросы и ответы", en: "FAQ" },
              type: "array",
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
  access: { read: () => true }
};
