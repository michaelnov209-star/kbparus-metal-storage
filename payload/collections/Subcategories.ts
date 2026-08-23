import type { CollectionConfig } from "payload";
import { createStableCollectionSlug } from "../../lib/cms/stable-collection-slug";
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

export const Subcategories: CollectionConfig = {
  slug: "subcategories",
  labels: {
    singular: { ru: "Подкатегория", en: "Subcategory" },
    plural: { ru: "Каталог: подкатегории", en: "Subcategories" }
  },
  admin: {
    group: adminGroups.catalog,
    components: {
      beforeList: [adminSectionHero("subcategories")]
    },
    description: {
      ru: `${adminHints.catalog} Подкатегории помогают разложить оборудование внутри основных направлений и сделать каталог понятнее.`,
      en: "Subcategories within main 17 categories."
    },
    useAsTitle: "title",
    defaultColumns: ["title", "sortOrder"],
    listSearchableFields: ["title", "slug", "summary"],
    pagination: { defaultLimit: 20, limits: [10, 20, 50] }
  },
  hooks: {
    beforeChange: [stampUpdatedBy],
    beforeValidate: [createStableCollectionSlug("subcategories")]
  },
  versions: { drafts: true },
  fields: [
    updatedByField(),
    ...updatedBySnapshotFields(),
    adminSectionHeroField("subcategories"),
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
        }
      }
    },
    {
      name: "category",
      label: { ru: "Основная категория", en: "Parent category" },
      type: "relationship",
      relationTo: "categories",
      required: true
    },
    {
      name: "title",
      label: { ru: "Название подкатегории", en: "Title" },
      type: "text",
      required: true
    },
    {
      name: "summary",
      label: { ru: "Краткое описание для страницы", en: "Summary" },
      type: "textarea",
      required: true
    },
    {
      name: "image",
      label: { ru: "Изображение подкатегории", en: "Image" },
      type: "upload",
      relationTo: "media",
      admin: {
        description: {
          ru: "Изображение из медиа-библиотеки. Для старых материалов резервное изображение подставляется автоматически.",
          en: "Image from media library."
        }
      }
    },
    {
      name: "legacyImagePath",
      label: { ru: "Текущий путь к изображению", en: "Legacy image path" },
      type: "text",
      admin: {
        hidden: true,
        description: {
          ru: "Временное поле миграции для текущих изображений из /assets.",
          en: "Temporary migration field for existing static images."
        }
      }
    },
    { name: "sortOrder", label: { ru: "Порядок показа", en: "Sort order" }, type: "number", defaultValue: 0 }
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
