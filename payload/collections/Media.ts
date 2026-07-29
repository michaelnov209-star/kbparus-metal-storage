import type { CollectionConfig } from "payload";
import { normalizeUploadBuffersBeforeCloudStorage } from "../../lib/storage/normalize-upload-buffers";
import { adminGroups, adminHints } from "../admin/structure";
import {
  mediaAdminUi,
  mediaInternalFieldRead,
  mediaManagersOnly,
  publicReadAvailableMedia
} from "../access/rbac";

const webp = (quality: number) =>
  ({
    format: "webp" as const,
    options: { quality }
  });

const derivedSizeAdmin = {
  disableGroupBy: true,
  disableListColumn: true,
  disableListFilter: true
} as const;

export const Media: CollectionConfig = {
  slug: "media",
  hooks: {
    beforeChange: [normalizeUploadBuffersBeforeCloudStorage]
  },
  labels: {
    singular: { ru: "Медиа-файл", en: "Media file" },
    plural: { ru: "Медиа-библиотека", en: "Media library" }
  },
  admin: {
    group: adminGroups.media,
    description: {
      ru: `${adminHints.media} Загружайте обычный JPG, PNG, WebP или AVIF: сайт сам ограничит слишком большой оригинал и создаст быстрые WebP-версии для телефона, планшета и компьютера.`,
      en: "Business asset library with automatic responsive WebP processing."
    },
    useAsTitle: "filename",
    defaultColumns: ["internalTitle", "assetType", "usageArea", "alt"],
    listSearchableFields: ["internalTitle", "filename", "alt", "caption"],
    pagination: { defaultLimit: 24, limits: [12, 24, 48] }
  },
  upload: {
    allowRestrictedFileTypes: false,
    adminThumbnail: "cardSm",
    constructorOptions: {
      // Keep a compressed image bomb from exhausting a serverless worker
      // before the 2400px output cap can be applied.
      limitInputPixels: 40_000_000
    },
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "application/pdf"
    ],
    resizeOptions: {
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true
    },
    modifyResponseHeaders: ({ headers }) => {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("X-Content-Type-Options", "nosniff");
      return headers;
    },
    imageSizes: [
      {
        name: "thumb",
        width: 320,
        height: undefined,
        position: "centre",
        withoutEnlargement: true,
        formatOptions: webp(78),
        admin: derivedSizeAdmin
      },
      {
        name: "medium",
        width: 800,
        height: undefined,
        position: "centre",
        withoutEnlargement: true,
        formatOptions: webp(80),
        admin: derivedSizeAdmin
      },
      {
        name: "large",
        width: 1600,
        height: undefined,
        position: "centre",
        withoutEnlargement: true,
        formatOptions: webp(82),
        admin: derivedSizeAdmin
      },
      {
        name: "cardSm",
        width: 320,
        height: 240,
        fit: "contain",
        position: "centre",
        withoutEnlargement: true,
        formatOptions: webp(78),
        admin: derivedSizeAdmin
      },
      {
        name: "cardMd",
        width: 640,
        height: 480,
        fit: "contain",
        position: "centre",
        withoutEnlargement: true,
        formatOptions: webp(80),
        admin: derivedSizeAdmin
      },
      {
        name: "cardLg",
        width: 960,
        height: 720,
        fit: "contain",
        position: "centre",
        withoutEnlargement: true,
        formatOptions: webp(82),
        admin: derivedSizeAdmin
      }
    ],
    formatOptions: webp(82)
  },
  fields: [
    {
      name: "publiclyAvailable",
      label: {
        ru: "Показывать в публичном API сайта",
        en: "List in the public website API"
      },
      type: "checkbox",
      required: true,
      defaultValue: true,
      admin: {
        description: {
          ru: "Отключение убирает запись из публичного API и подборщиков, но не закрывает прямую ссылку Vercel Blob. Загружайте сюда только материалы, которые допустимо публиковать; конфиденциальные документы храните вне этой библиотеки.",
          en: "This hides the API record but does not make the underlying public Blob private."
        },
        position: "sidebar"
      }
    },
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
                  access: {
                    read: mediaInternalFieldRead
                  },
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
              access: {
                read: mediaInternalFieldRead
              },
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
    admin: mediaAdminUi,
    create: mediaManagersOnly,
    delete: mediaManagersOnly,
    read: publicReadAvailableMedia,
    update: mediaManagersOnly
  }
};
