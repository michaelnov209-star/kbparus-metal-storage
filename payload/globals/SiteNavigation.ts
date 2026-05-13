import type { GlobalConfig } from "payload";
import { adminGroups } from "../admin/structure";

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
    description: {
      ru: "Управляет ссылками в шапке, мобильной навигации и футере. Меняйте только понятные публичные ссылки: якоря секций, страницы каталога и внешние сайты.",
      en: "Header, mobile and footer navigation."
    }
  },
  fields: [
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
                    { name: "href", label: { ru: "Ссылка", en: "URL" }, type: "text", defaultValue: "#catalog", admin: { width: "45%" } },
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
              type: "array",
              admin: {
                description: { ru: "Порядок строк равен порядку ссылок на сайте." },
                initCollapsed: true
              },
              fields: linkFields
            },
            {
              name: "detailPageLinks",
              label: { ru: "Ссылки на страницах категорий и товаров", en: "Detail page links" },
              type: "array",
              admin: {
                description: { ru: "Используются в компактной шапке внутренних страниц каталога после кнопки возврата." },
                initCollapsed: true
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
              type: "array",
              admin: { initCollapsed: true },
              fields: linkFields
            },
            {
              name: "legalLinks",
              label: { ru: "Юридические и служебные ссылки", en: "Legal links" },
              type: "array",
              admin: {
                description: { ru: "Политика конфиденциальности, реквизиты, документы. Если пусто — блок не выводится." },
                initCollapsed: true
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
  access: { read: () => true }
};
