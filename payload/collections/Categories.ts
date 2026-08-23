import type { CollectionConfig } from "payload";
import { createStableCollectionSlug } from "../../lib/cms/stable-collection-slug";
import { businessRowLabel } from "../admin/array-row-label";
import { booleanStatusAdmin } from "../admin/boolean-status";
import { adminSectionHero, adminSectionHeroField } from "../admin/section-hero";
import { adminGroups, adminHints } from "../admin/structure";
import {
  catalogAdminUi,
  catalogReadersOnly,
  contentManagersOnly,
  publicReadCatalog
} from "../access/rbac";
import {
  stampUpdatedBy,
  updatedByField,
  updatedBySnapshotFields
} from "../hooks/stampUpdatedBy";

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: {
    singular: { ru: "Категория каталога", en: "Category" },
    plural: { ru: "Каталог: категории (17 шт.)", en: "Categories" }
  },
  admin: {
    group: adminGroups.catalog,
    components: {
      beforeList: [adminSectionHero("categories")]
    },
    description: {
      ru: `${adminHints.catalog} Верхний уровень каталога: карточки на главной странице, меню и страницы /catalog/<slug>.`,
      en: "17 top-level catalog categories shown on home and nav."
    },
    useAsTitle: "title",
    defaultColumns: ["title", "featured", "sortOrder"],
    listSearchableFields: ["title", "slug", "summary"],
    pagination: { defaultLimit: 20, limits: [10, 20, 50] }
  },
  hooks: {
    beforeChange: [stampUpdatedBy],
    beforeValidate: [createStableCollectionSlug("categories")]
  },
  versions: { drafts: true },
  fields: [
    updatedByField(),
    ...updatedBySnapshotFields(),
    adminSectionHeroField("categories"),
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
            hidden: true,
            description: {
              ru: "Создаётся автоматически из названия и сохраняется при последующих изменениях.",
              en: "Generated from the title and preserved after creation."
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
            width: "50%"
          }
        },
        {
          name: "featured",
          label: { ru: "Выделять", en: "Featured" },
          type: "checkbox",
          admin: {
            description: { ru: "Показать как «рекомендуемую».", en: "Show as featured." },
            width: "50%",
            ...booleanStatusAdmin({
              trueLabel: "Выделяется",
              falseLabel: "Обычная",
              trueTone: "accent",
              falseTone: "neutral"
            })
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
          ru: "Основное изображение из медиа-библиотеки. Для старых материалов резервное изображение подставляется автоматически.",
          en: "Primary image from media library."
        }
      }
    },
    {
      name: "legacyImagePath",
      label: { ru: "Текущий путь к изображению на сайте", en: "Legacy image path" },
      type: "text",
      admin: {
        hidden: true,
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
          labels: {
            singular: { ru: "Поисковая тема", en: "Keyword" },
            plural: { ru: "Поисковые темы", en: "Keywords" }
          },
          type: "array",
          admin: {
            components: {
              RowLabel: businessRowLabel({
                fallback: "Новая поисковая тема",
                primaryFields: ["value"]
              })
            }
          },
          fields: [
            {
              name: "value",
              label: { ru: "Поисковая фраза", en: "Search phrase" },
              type: "text",
              admin: {
                description: {
                  ru: "Короткая фраза, по которой клиент может искать эту категорию."
                }
              }
            }
          ]
        },
        {
          name: "noIndex",
          label: { ru: "Скрыть от поисковиков", en: "No-index" },
          type: "checkbox",
          admin: booleanStatusAdmin({
            trueLabel: "Скрыта от поиска",
            falseLabel: "Доступна поиску",
            trueTone: "warning",
            falseTone: "positive"
          })
        }
      ]
    }
  ],
  access: {
    admin: catalogAdminUi,
    create: contentManagersOnly,
    delete: contentManagersOnly,
    read: publicReadCatalog,
    readVersions: catalogReadersOnly,
    update: contentManagersOnly
  }
};
