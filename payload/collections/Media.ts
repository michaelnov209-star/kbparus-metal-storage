import type { CollectionConfig } from "payload";
import { adminGroups, adminHints } from "../admin/structure";

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: { ru: "Медиа-файл", en: "Media file" },
    plural: { ru: "Медиа-библиотека", en: "Media library" }
  },
  admin: {
    group: adminGroups.media,
    description: {
      ru: adminHints.media,
      en: "Business asset library for the website."
    },
    useAsTitle: "filename",
    defaultColumns: ["internalTitle", "assetType", "usageArea", "alt"],
    listSearchableFields: ["internalTitle", "filename", "alt", "caption"],
    pagination: { defaultLimit: 24, limits: [12, 24, 48] }
  },
  upload: {
    mimeTypes: ["image/*", "video/mp4", "video/webm", "video/quicktime", "application/pdf"],
    imageSizes: [
      { name: "thumb", width: 320, height: undefined, position: "centre" },
      { name: "medium", width: 800, height: undefined, position: "centre" },
      { name: "large", width: 1600, height: undefined, position: "centre" }
    ],
    formatOptions: { format: "webp", options: { quality: 80 } }
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: { ru: "Описание файла", en: "File description" },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "internalTitle",
                  label: { ru: "Рабочее название", en: "Internal title" },
                  type: "text",
                  admin: {
                    width: "50%",
                    placeholder: "Фото автоматического склада листового металла",
                    description: { ru: "Понятное название для поиска внутри CMS. На сайте обычно не показывается." }
                  }
                },
                {
                  name: "assetType",
                  label: { ru: "Тип материала", en: "Asset type" },
                  type: "select",
                  defaultValue: "photo",
                  admin: { width: "25%" },
                  options: [
                    { label: { ru: "Фото", en: "Photo" }, value: "photo" },
                    { label: { ru: "Видео", en: "Video" }, value: "video" },
                    { label: { ru: "Баннер", en: "Banner" }, value: "banner" },
                    { label: { ru: "Логотип", en: "Logo" }, value: "logo" },
                    { label: { ru: "Документ", en: "Document" }, value: "document" }
                  ]
                },
                {
                  name: "usageArea",
                  label: { ru: "Где используется", en: "Usage area" },
                  type: "select",
                  defaultValue: "catalog",
                  admin: { width: "25%" },
                  options: [
                    { label: { ru: "Главная страница", en: "Home page" }, value: "home" },
                    { label: { ru: "Каталог / товары", en: "Catalog" }, value: "catalog" },
                    { label: { ru: "Кейсы", en: "Cases" }, value: "cases" },
                    { label: { ru: "Партнёры", en: "Partners" }, value: "partners" },
                    { label: { ru: "SEO / соцсети", en: "SEO" }, value: "seo" },
                    { label: { ru: "Служебное", en: "Service" }, value: "service" }
                  ]
                }
              ]
            },
            {
              name: "alt",
              label: { ru: "Alt-текст для SEO и доступности", en: "Alt text" },
              type: "text",
              required: true,
              admin: {
                placeholder: "Автоматический стеллаж для хранения листового металла",
                description: { ru: "Коротко опишите, что изображено. Важно для SEO и доступности." }
              }
            },
            {
              name: "caption",
              label: { ru: "Подпись к изображению", en: "Caption" },
              type: "text",
              admin: {
                placeholder: "Производственный склад после внедрения системы хранения"
              }
            }
          ]
        },
        {
          label: { ru: "Операционные заметки", en: "Notes" },
          fields: [
            {
              name: "managerNote",
              label: { ru: "Комментарий для редакторов", en: "Manager note" },
              type: "textarea",
              admin: {
                placeholder: "Например: использовать только для карточек первой категории; не ставить в hero"
              }
            }
          ]
        }
      ]
    }
  ],
  access: {
    read: () => true
  }
};
