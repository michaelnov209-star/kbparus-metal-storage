import type { CollectionConfig } from "payload";
import { adminGroups, adminHints } from "../admin/structure";

export const Leads: CollectionConfig = {
  slug: "leads",
  labels: {
    singular: { ru: "Заявка", en: "Lead" },
    plural: { ru: "Заявки с сайта", en: "Website leads" }
  },
  admin: {
    group: adminGroups.leads,
    useAsTitle: "title",
    defaultColumns: ["title", "status", "leadType", "phone", "city", "sourceTitle", "createdAt"],
    listSearchableFields: ["title", "name", "phone", "email", "city", "sourceTitle", "sourceUrl", "comment"],
    description: {
      ru: `${adminHints.leads} Этот журнал сохраняет заявки внутри CMS, чтобы сайт не зависел только от Telegram или внешней CRM.`,
      en: "Internal lead inbox for website requests."
    },
    pagination: { defaultLimit: 20, limits: [10, 20, 50, 100] }
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user)
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: { ru: "Заявка", en: "Lead" },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "title",
                  label: { ru: "Название", en: "Title" },
                  type: "text",
                  required: true,
                  admin: { width: "50%" }
                },
                {
                  name: "status",
                  label: { ru: "Статус обработки", en: "Status" },
                  type: "select",
                  defaultValue: "new",
                  required: true,
                  admin: { width: "25%" },
                  options: [
                    { label: { ru: "Новая", en: "New" }, value: "new" },
                    { label: { ru: "В работе", en: "In progress" }, value: "in_progress" },
                    { label: { ru: "Связались", en: "Contacted" }, value: "contacted" },
                    { label: { ru: "Закрыта", en: "Closed" }, value: "closed" },
                    { label: { ru: "Спам", en: "Spam" }, value: "spam" }
                  ]
                },
                {
                  name: "leadType",
                  label: { ru: "Тип формы", en: "Lead type" },
                  type: "select",
                  required: true,
                  admin: { width: "25%" },
                  options: [
                    { label: { ru: "Контактная форма", en: "Contact" }, value: "contact" },
                    { label: { ru: "Конфигуратор", en: "Configurator" }, value: "configurator" }
                  ]
                }
              ]
            },
            {
              type: "row",
              fields: [
                { name: "name", label: { ru: "Имя", en: "Name" }, type: "text", admin: { width: "25%" } },
                { name: "phone", label: { ru: "Телефон", en: "Phone" }, type: "text", required: true, admin: { width: "25%" } },
                { name: "email", label: { ru: "Email", en: "Email" }, type: "email", admin: { width: "25%" } },
                { name: "city", label: { ru: "Город/регион", en: "City" }, type: "text", admin: { width: "25%" } }
              ]
            },
            {
              name: "comment",
              label: { ru: "Комментарий клиента", en: "Customer comment" },
              type: "textarea"
            },
            {
              name: "managerComment",
              label: { ru: "Комментарий менеджера", en: "Manager comment" },
              type: "textarea",
              admin: {
                description: { ru: "Рабочее поле для обработки заявки внутри компании." }
              }
            }
          ]
        },
        {
          label: { ru: "Источник", en: "Source" },
          fields: [
            {
              type: "row",
              fields: [
                { name: "sourceTitle", label: { ru: "Страница/товар", en: "Source title" }, type: "text", admin: { width: "50%" } },
                { name: "sourceUrl", label: { ru: "URL источника", en: "Source URL" }, type: "text", admin: { width: "50%" } }
              ]
            },
            { name: "source", label: { ru: "Описание источника", en: "Source" }, type: "text" },
            { name: "utm", label: { ru: "UTM-метки", en: "UTM" }, type: "json" }
          ]
        },
        {
          label: { ru: "Калькулятор", en: "Calculator" },
          fields: [
            {
              type: "row",
              fields: [
                { name: "recommendedTitle", label: { ru: "Рекомендованная система", en: "Recommended system" }, type: "text", admin: { width: "50%" } },
                { name: "preliminaryPriceFrom", label: { ru: "Ориентировочная цена от, ₽", en: "Price from" }, type: "number", admin: { width: "50%" } }
              ]
            },
            { name: "calculatorSummary", label: { ru: "Краткая конфигурация", en: "Configuration summary" }, type: "textarea" },
            { name: "calculatorInput", label: { ru: "Полные параметры калькулятора", en: "Calculator input" }, type: "json" }
          ]
        },
        {
          label: { ru: "Доставка", en: "Delivery" },
          fields: [
            {
              type: "row",
              fields: [
                { name: "emailDelivered", label: { ru: "Email", en: "Email" }, type: "checkbox", defaultValue: false, admin: { width: "25%" } },
                { name: "telegramDelivered", label: { ru: "Telegram", en: "Telegram" }, type: "checkbox", defaultValue: false, admin: { width: "25%" } },
                { name: "bitrix24Delivered", label: { ru: "Bitrix24 webhook", en: "Bitrix24 webhook" }, type: "checkbox", defaultValue: false, admin: { width: "25%" } },
                { name: "cmsStored", label: { ru: "Сохранено в CMS", en: "Stored in CMS" }, type: "checkbox", defaultValue: true, admin: { width: "25%", readOnly: true } }
              ]
            },
            {
              name: "deliveryErrors",
              label: { ru: "Ошибки доставки", en: "Delivery errors" },
              type: "textarea",
              admin: { description: { ru: "Заполняется, если внешний канал не принял заявку." } }
            }
          ]
        }
      ]
    }
  ]
};
