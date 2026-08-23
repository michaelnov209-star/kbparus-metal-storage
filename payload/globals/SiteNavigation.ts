import type { GlobalConfig } from "payload";
import { businessRowLabel } from "../admin/array-row-label";
import { adminSectionHeroField } from "../admin/section-hero";
import { adminGroups } from "../admin/structure";
import { canEditContent, contentManagersOnly, publicRead } from "../access/rbac";

const linkFields = [
  {
    type: "row" as const,
    fields: [
      {
        name: "label",
        label: { ru: "Текст ссылки", en: "Label" },
        type: "text" as const,
        required: true,
        admin: { width: "35%", placeholder: "Калькулятор" }
      },
      {
        name: "href",
        label: { ru: "Куда ведёт", en: "URL" },
        type: "text" as const,
        required: true,
        admin: {
          width: "45%",
          placeholder: "#calculator",
          description: { ru: "Можно использовать якорь (#contacts), внутренний путь (/catalog/...) или внешний URL." }
        }
      },
      {
        name: "enabled",
        label: { ru: "Показывать", en: "Enabled" },
        type: "checkbox" as const,
        defaultValue: true,
        admin: { width: "10%" }
      },
      {
        name: "openInNewTab",
        label: { ru: "Новая вкладка", en: "New tab" },
        type: "checkbox" as const,
        defaultValue: false,
        admin: { width: "10%" }
      }
    ]
  }
];

export const SiteNavigation: GlobalConfig = {
  slug: "site-navigation",
  label: { ru: "Компания: навигация и футер", en: "Site navigation" },
  admin: {
    group: adminGroups.company,
    hidden: ({ user }) => !canEditContent(user),
    description: {
      ru: "Управляет ссылками в шапке, мобильной навигации и футере. Меняйте только понятные публичные ссылки: якоря секций, страницы каталога и внешние сайты.",
      en: "Header, mobile and footer navigation."
    }
  },
  fields: [
    adminSectionHeroField("navigation"),
    {
      type: "tabs",
      tabs: [
        {
          label: { ru: "Шапка сайта", en: "Header" },
          description: { ru: "Эти ссылки видны в верхней навигации главной страницы. На мобильных они используются в адаптивном меню." },
          fields: [
            {
              name: "catalog",
              label: { ru: "Пункт «Каталог»", en: "Catalog item" },
              type: "group",
              admin: { description: { ru: "Главный пункт каталога и выпадающий список разделов." } },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "label", label: { ru: "Текст", en: "Label" }, type: "text", defaultValue: "Каталог", admin: { width: "35%" } },
                    { name: "href", label: { ru: "Ссылка", en: "URL" }, type: "text", defaultValue: "/catalog", admin: { width: "45%", description: { ru: "Основная индексируемая страница каталога. Для SEO рекомендуется сохранять путь /catalog." } } },
                    {
                      name: "showDropdown",
                      label: { ru: "Показывать разделы", en: "Show categories" },
                      type: "checkbox",
                      defaultValue: true,
                      admin: { width: "20%" }
                    }
                  ]
                }
              ]
            },
            {
              name: "headerLinks",
              label: { ru: "Основные ссылки в шапке", en: "Header links" },
              labels: {
                singular: { ru: "Ссылка в шапке", en: "Header link" },
                plural: { ru: "Ссылки в шапке", en: "Header links" }
              },
              type: "array",
              admin: {
                description: { ru: "Порядок строк равен порядку ссылок на сайте." },
                initCollapsed: true,
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новая ссылка в шапке",
                    primaryFields: ["label", "href"],
                    secondaryFields: ["href"]
                  })
                }
              },
              fields: linkFields
            },
            {
              name: "detailPageLinks",
              label: { ru: "Ссылки на страницах категорий и товаров", en: "Detail page links" },
              labels: {
                singular: { ru: "Ссылка внутренней страницы", en: "Detail page link" },
                plural: { ru: "Ссылки внутренних страниц", en: "Detail page links" }
              },
              type: "array",
              admin: {
                description: { ru: "Используются в компактной шапке внутренних страниц каталога после кнопки возврата." },
                initCollapsed: true,
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новая ссылка внутренней страницы",
                    primaryFields: ["label", "href"],
                    secondaryFields: ["href"]
                  })
                }
              },
              fields: linkFields
            },
            {
              name: "headerContacts",
              label: { ru: "Контактные кнопки в шапке", en: "Header contact buttons" },
              type: "group",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "showTelegram", label: "Telegram", type: "checkbox", defaultValue: true, admin: { width: "33%" } },
                    { name: "showMax", label: "MAX", type: "checkbox", defaultValue: true, admin: { width: "33%" } },
                    { name: "showPhones", label: { ru: "Телефоны", en: "Phones" }, type: "checkbox", defaultValue: true, admin: { width: "33%" } }
                  ]
                }
              ]
            }
          ]
        },
        {
          label: { ru: "Футер", en: "Footer" },
          description: { ru: "Нижний блок сайта: описание, навигация, юридические ссылки и CTA." },
          fields: [
            {
              name: "footerDescription",
              label: { ru: "Короткое описание под логотипом", en: "Footer description" },
              type: "text",
              defaultValue: "Системы хранения металла",
              admin: { placeholder: "Системы хранения металла" }
            },
            {
              name: "footerLinks",
              label: { ru: "Навигация в футере", en: "Footer links" },
              labels: {
                singular: { ru: "Ссылка в футере", en: "Footer link" },
                plural: { ru: "Ссылки в футере", en: "Footer links" }
              },
              type: "array",
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новая ссылка в футере",
                    primaryFields: ["label", "href"],
                    secondaryFields: ["href"]
                  })
                }
              },
              fields: linkFields
            },
            {
              name: "legalLinks",
              label: { ru: "Юридические и служебные ссылки", en: "Legal links" },
              labels: {
                singular: { ru: "Юридическая ссылка", en: "Legal link" },
                plural: { ru: "Юридические ссылки", en: "Legal links" }
              },
              type: "array",
              admin: {
                description: { ru: "Политика конфиденциальности, реквизиты, документы. Если пусто — блок не выводится." },
                initCollapsed: true,
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новая юридическая ссылка",
                    primaryFields: ["label", "href"],
                    secondaryFields: ["href"]
                  })
                }
              },
              fields: linkFields
            },
            {
              name: "footerCta",
              label: { ru: "CTA в футере", en: "Footer CTA" },
              type: "group",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "enabled", label: { ru: "Показывать", en: "Enabled" }, type: "checkbox", defaultValue: false, admin: { width: "20%" } },
                    { name: "label", label: { ru: "Текст кнопки", en: "Label" }, type: "text", admin: { width: "35%", placeholder: "Получить расчёт" } },
                    { name: "href", label: { ru: "Ссылка", en: "URL" }, type: "text", admin: { width: "45%", placeholder: "#request" } }
                  ]
                }
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
