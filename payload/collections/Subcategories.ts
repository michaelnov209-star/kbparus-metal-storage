import type { CollectionConfig } from "payload";

export const Subcategories: CollectionConfig = {
  slug: "subcategories",
  labels: {
    singular: { ru: "Подкатегория", en: "Subcategory" },
    plural: { ru: "Каталог: подкатегории", en: "Subcategories" }
  },
  admin: {
    description: {
      ru: "Подкатегории внутри основных 17 категорий (например, «Стеллажи типа Ёлочка»).",
      en: "Subcategories within main 17 categories."
    },
    useAsTitle: "title",
    defaultColumns: ["title", "category", "sortOrder"]
  },
  versions: { drafts: true },
  fields: [
    {
      name: "slug",
      label: { ru: "ID (URL-сегмент)", en: "Slug" },
      type: "text",
      required: true,
      unique: true
    },
    {
      name: "category",
      label: { ru: "Родительская категория", en: "Parent category" },
      type: "relationship",
      relationTo: "categories",
      required: true
    },
    {
      name: "title",
      label: { ru: "Название", en: "Title" },
      type: "text",
      required: true
    },
    {
      name: "summary",
      label: { ru: "Описание", en: "Summary" },
      type: "textarea",
      required: true
    },
    {
      name: "image",
      label: { ru: "Изображение", en: "Image" },
      type: "upload",
      relationTo: "media"
    },
    { name: "sortOrder", label: { ru: "Порядок", en: "Sort order" }, type: "number", defaultValue: 0 }
  ],
  access: { read: () => true }
};
