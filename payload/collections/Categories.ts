import type { CollectionConfig } from "payload";
import { adminGroups, adminHints } from "../admin/structure";

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: {
    singular: { ru: "Категория каталога", en: "Category" },
    plural: { ru: "Каталог: категории (17 шт.)", en: "Categories" }
  },
  admin: {
    group: adminGroups.catalog,
    description: {
      ru: `${adminHints.catalog} Верхний уровень каталога: карточки на главной странице, меню и страницы /catalog/<slug>.`,
      en: "17 top-level catalog categories shown on home and nav."
    },
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "featured", "sortOrder"],
    listSearchableFields: ["title", "slug", "summary"],
    pagination: { defaultLimit: 20, limits: [10, 20, 50] }
  },
  versions: { drafts: true },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "slug",
          label: { ru: "Адрес страницы в URL", en: "URL slug" },
          type: "text",
          required: true,
          unique: true,
          admin: {
            description: {
              ru: "Используется в URL: /catalog/<адрес>. Менять только если уверены — может сломать внешние ссылки и SEO.",
              en: "Used in URL: /catalog/<slug>"
            },
            width: "40%"
          }
        },
        {
          name: "sortOrder",
          label: { ru: "Порядок сортировки", en: "Sort order" },
          type: "number",
          defaultValue: 0,
          admin: {
            description: { ru: "Меньшее число = выше в списке.", en: "Lower = higher." },
            width: "20%"
          }
        },
        {
          name: "featured",
          label: { ru: "Выделять", en: "Featured" },
          type: "checkbox",
          admin: {
            description: { ru: "Показать как «рекомендуемую».", en: "Show as featured." },
            width: "20%"
          }
        }
      ]
    },
    {
      name: "title",
      label: { ru: "Название категории", en: "Title" },
      type: "text",
      required: true
    },
    {
      name: "summary",
      label: { ru: "Краткое описание (1-2 предложения)", en: "Summary" },
      type: "textarea",
      required: true
    },
    {
      name: "scenario",
      label: { ru: "Сценарий применения", en: "Scenario" },
      type: "textarea"
    },
    {
      name: "image",
      label: { ru: "Главное изображение", en: "Main image" },
      type: "upload",
      relationTo: "media",
      admin: {
        description: {
          ru: "Основное изображение из медиа-библиотеки. Если пока не загружено, сайт использует временный путь из поля ниже.",
          en: "Primary image from media library."
        }
      }
    },
    {
      name: "legacyImagePath",
      label: { ru: "Текущий путь к изображению на сайте", en: "Legacy image path" },
      type: "text",
      admin: {
        description: {
          ru: "Временное поле миграции. Используется для текущих изображений из /assets, пока менеджер не заменит их файлом из медиа-библиотеки.",
          en: "Temporary migration field for existing static images."
        },
        placeholder: "/assets/images/catalog/01-auto-sheet-metal.jpg"
      }
    },
    {
      type: "collapsible",
      label: { ru: "SEO (поисковая оптимизация)", en: "SEO" },
      admin: { initCollapsed: true },
      fields: [
        { name: "seoTitle", label: { ru: "Title для поисковика", en: "SEO Title" }, type: "text" },
        { name: "seoDescription", label: { ru: "Meta description", en: "Description" }, type: "textarea" },
        {
          name: "ogImage",
          label: { ru: "Картинка для соцсетей (1200×630)", en: "OG image" },
          type: "upload",
          relationTo: "media"
        },
        {
          name: "keywords",
          label: { ru: "Ключевые слова", en: "Keywords" },
          type: "array",
          fields: [{ name: "value", type: "text" }]
        },
        {
          name: "noIndex",
          label: { ru: "Скрыть от поисковиков", en: "No-index" },
          type: "checkbox"
        }
      ]
    }
  ],
  access: { read: () => true }
};
