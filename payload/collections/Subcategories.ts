import type { CollectionConfig } from "payload";
import { adminGroups, adminHints } from "../admin/structure";

export const Subcategories: CollectionConfig = {
  slug: "subcategories",
  labels: {
    singular: { ru: "Подкатегория", en: "Subcategory" },
    plural: { ru: "Каталог: подкатегории", en: "Subcategories" }
  },
  admin: {
    group: adminGroups.catalog,
    description: {
      ru: `${adminHints.catalog} Подкатегории помогают разложить оборудование внутри основных направлений и сделать каталог понятнее.`,
      en: "Subcategories within main 17 categories."
    },
    useAsTitle: "title",
    defaultColumns: ["title", "sortOrder"],
    listSearchableFields: ["title", "slug", "summary"],
    pagination: { defaultLimit: 20, limits: [10, 20, 50] }
  },
  versions: { drafts: true },
  fields: [
    {
      name: "slug",
      label: { ru: "Адрес страницы в URL", en: "URL slug" },
      type: "text",
      required: true,
      unique: true
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
      relationTo: "media"
    },
    { name: "sortOrder", label: { ru: "Порядок показа", en: "Sort order" }, type: "number", defaultValue: 0 }
  ],
  access: { read: () => true }
};
