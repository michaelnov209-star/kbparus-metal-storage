import type { CollectionConfig } from "payload";
import { adminGroups, adminHints } from "../admin/structure";

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: { ru: "Товар", en: "Product" },
    plural: { ru: "Каталог: товары", en: "Products" }
  },
  admin: {
    group: adminGroups.catalog,
    description: {
      ru: `${adminHints.catalog} Товары — это конкретные модели оборудования и посадочные страницы для продаж.`,
      en: "Concrete equipment models within subcategories."
    },
    useAsTitle: "title",
    defaultColumns: ["title", "pageMode", "priceMode", "draft"],
    listSearchableFields: ["title", "shortTitle", "slug", "summary"],
    pagination: { defaultLimit: 20, limits: [10, 20, 50] }
  },
  versions: { drafts: true },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: { ru: "Основное", en: "Main" },
          fields: [
            {
              type: "row",
              fields: [
                { name: "slug", label: { ru: "Адрес товара в URL", en: "URL slug" }, type: "text", required: true, unique: true, admin: { width: "40%" } },
                { name: "sku", label: { ru: "Внутренний артикул", en: "SKU" }, type: "text", admin: { width: "30%" } },
                { name: "sortOrder", label: { ru: "Порядок показа", en: "Sort" }, type: "number", defaultValue: 0, admin: { width: "15%" } }
              ]
            },
            { name: "title", label: { ru: "Название (полное)", en: "Title" }, type: "text", required: true },
            { name: "shortTitle", label: { ru: "Короткое название", en: "Short title" }, type: "text" },
            {
              type: "row",
              fields: [
                {
                  name: "category",
                  label: { ru: "Категория", en: "Category" },
                  type: "relationship",
                  relationTo: "categories",
                  required: true,
                  admin: { width: "50%" }
                },
                {
                  name: "subcategory",
                  label: { ru: "Подкатегория", en: "Subcategory" },
                  type: "relationship",
                  relationTo: "subcategories",
                  admin: { width: "50%" }
                }
              ]
            },
            {
              name: "badge",
              label: { ru: "Бейдж (метка над названием)", en: "Badge" },
              type: "text",
              admin: { description: { ru: "Например: «Под погрузчик», «Двусторонний»", en: "" } }
            },
            { name: "summary", label: { ru: "Краткое описание", en: "Summary" }, type: "textarea", required: true },
            { name: "description", label: { ru: "Полное описание", en: "Description" }, type: "textarea", required: true }
          ]
        },
        {
          label: { ru: "Изображения", en: "Images" },
          fields: [
            {
              name: "image",
              label: { ru: "Главное изображение", en: "Main image" },
              type: "upload",
              relationTo: "media",
              admin: {
                description: {
                  ru: "Основное изображение товара из медиа-библиотеки. Если пока не загружено, сайт использует временный путь из поля ниже.",
                  en: "Primary product image from media library."
                }
              }
            },
            {
              name: "legacyImagePath",
              label: { ru: "Текущий путь к главному изображению", en: "Legacy main image path" },
              type: "text",
              admin: {
                description: {
                  ru: "Временное поле миграции. Используется для текущих изображений из /assets, пока менеджер не заменит их файлом из медиа-библиотеки.",
                  en: "Temporary migration field for existing static images."
                },
                placeholder: "/assets/images/products/auto-sheet-metal/1.1.jpg"
              }
            },
            {
              name: "gallery",
              label: { ru: "Галерея (доп. фото)", en: "Gallery" },
              type: "array",
              fields: [{ name: "image", type: "upload", relationTo: "media" }]
            },
            {
              name: "legacyGalleryPaths",
              label: { ru: "Текущие пути к изображениям галереи", en: "Legacy gallery paths" },
              type: "array",
              admin: {
                description: {
                  ru: "Временное поле миграции для текущей галереи из /assets. Новые фото лучше добавлять через поле «Галерея».",
                  en: "Temporary migration field for existing static gallery images."
                }
              },
              fields: [{ name: "path", label: { ru: "Путь", en: "Path" }, type: "text", required: true }]
            }
          ]
        },
        {
          label: { ru: "Цена", en: "Price" },
          fields: [
            {
              name: "priceMode",
              label: { ru: "Режим цены", en: "Price mode" },
              type: "select",
              options: [
                { label: { ru: "Цена по запросу", en: "Request" }, value: "request" },
                { label: { ru: "Фиксированная цена", en: "Fixed" }, value: "fixed" }
              ],
              defaultValue: "request",
              required: true
            },
            { name: "priceFrom", label: { ru: "Цена от (₽)", en: "Price from" }, type: "number", admin: { description: { ru: "Минимальная цена для отображения «от X ₽»", en: "" } } },
            { name: "priceTo", label: { ru: "Цена до (₽, опционально)", en: "Price to" }, type: "number" },
            { name: "priceLabel", label: { ru: "Кастомный текст цены (опционально)", en: "Custom label" }, type: "text" }
          ]
        },
        {
          label: { ru: "Конфигуратор (если есть)", en: "Configurator" },
          fields: [
            {
              name: "pageMode",
              label: { ru: "Тип страницы товара", en: "Page mode" },
              type: "select",
              options: [
                { label: { ru: "Обычная страница (форма заявки)", en: "Standard" }, value: "standard" },
                { label: { ru: "С калькулятором-конфигуратором", en: "Configurator" }, value: "configurator" }
              ],
              defaultValue: "standard",
              required: true
            },
            {
              name: "calculatorProfile",
              label: { ru: "Связанный профиль калькулятора", en: "Calculator profile" },
              type: "relationship",
              relationTo: "calculator-profiles",
              admin: {
                description: { ru: "Заполнять только если выбран режим «С калькулятором».", en: "" },
                condition: (data) => data?.pageMode === "configurator"
              }
            }
          ]
        },
        {
          label: { ru: "Спецификации", en: "Specs" },
          fields: [
            {
              name: "applications",
              label: { ru: "Применение (где используется)", en: "Applications" },
              type: "array",
              fields: [{ name: "value", type: "text" }]
            },
            {
              name: "specs",
              label: { ru: "Технические характеристики", en: "Specs" },
              type: "array",
              fields: [
                { name: "label", label: { ru: "Параметр", en: "Label" }, type: "text", required: true },
                { name: "value", label: { ru: "Значение", en: "Value" }, type: "text", required: true }
              ]
            },
            {
              name: "includes",
              label: { ru: "Что входит / что проверим", en: "Includes" },
              type: "array",
              fields: [{ name: "value", type: "text" }]
            },
            {
              name: "documents",
              label: { ru: "Документы (PDF и т.д.)", en: "Documents" },
              type: "array",
              fields: [
                { name: "title", type: "text", required: true },
                { name: "href", label: { ru: "Ссылка/URL", en: "Link" }, type: "text", required: true }
              ]
            },
            {
              name: "referenceUrl",
              label: { ru: "Ссылка на эталонный товар (опционально)", en: "Reference URL" },
              type: "text"
            }
          ]
        },
        {
          label: { ru: "SEO", en: "SEO" },
          fields: [
            { name: "seoTitle", label: { ru: "Title для поисковика", en: "SEO Title" }, type: "text" },
            { name: "seoDescription", label: { ru: "Meta description", en: "Description" }, type: "textarea" },
            { name: "ogImage", label: { ru: "Картинка для соцсетей", en: "OG image" }, type: "upload", relationTo: "media" },
            {
              name: "keywords",
              label: { ru: "Ключевые слова", en: "Keywords" },
              type: "array",
              fields: [{ name: "value", type: "text" }]
            },
            { name: "noIndex", label: { ru: "Скрыть от поисковиков", en: "No-index" }, type: "checkbox" }
          ]
        },
        {
          label: { ru: "Публикация", en: "Publishing" },
          fields: [
            {
              name: "draft",
              label: { ru: "Черновик (не показывать на сайте)", en: "Draft" },
              type: "checkbox",
              defaultValue: false,
              admin: { description: { ru: "Поставьте галочку, чтобы скрыть от посетителей до готовности.", en: "" } }
            },
            {
              name: "featured",
              label: { ru: "Рекомендуемый (показывать в верхней части категории)", en: "Featured" },
              type: "checkbox"
            }
          ]
        }
      ]
    }
  ],
  access: {
    read: ({ req }) => {
      // Не показывать черновики неавторизованным
      if (req.user) return true;
      return { draft: { not_equals: true } };
    }
  }
};
