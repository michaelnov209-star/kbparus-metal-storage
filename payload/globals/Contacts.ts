import type { GlobalConfig } from "payload";
import { adminGroups, adminHints } from "../admin/structure";

export const Contacts: GlobalConfig = {
  slug: "contacts",
  label: { ru: "Компания: контакты и реквизиты", en: "Company contacts" },
  admin: {
    group: adminGroups.company,
    description: {
      ru: adminHints.company,
      en: "Company-wide contacts shown across the website."
    }
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: { ru: "Контакты для клиентов", en: "Client contacts" },
          fields: [
            {
              name: "phones",
              label: { ru: "Телефоны продаж и консультаций", en: "Phones" },
              type: "array",
              admin: {
                description: {
                  ru: "Показываются в шапке, футере и контактных блоках. Первый номер обычно считается основным."
                }
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "label",
                      label: { ru: "Подпись", en: "Label" },
                      type: "text",
                      admin: { width: "40%", placeholder: "Отдел продаж" }
                    },
                    {
                      name: "number",
                      label: { ru: "Номер телефона", en: "Number" },
                      type: "text",
                      required: true,
                      admin: { width: "60%", placeholder: "+7 (495) 137-94-50" }
                    }
                  ]
                }
              ]
            },
            {
              type: "row",
              fields: [
                {
                  name: "email",
                  label: { ru: "E-mail для заявок", en: "Email" },
                  type: "email",
                  admin: { width: "50%", placeholder: "info@kbparus.ru" }
                },
                {
                  name: "workingHours",
                  label: { ru: "График работы", en: "Working hours" },
                  type: "text",
                  admin: { width: "50%", placeholder: "Пн-Пт 9:00-18:00" }
                }
              ]
            },
            {
              name: "address",
              label: { ru: "Адрес офиса / производства", en: "Address" },
              type: "textarea",
              admin: {
                placeholder: "Москва, адрес офиса или производства",
                description: { ru: "Используется в блоке контактов, футере и микроразметке организации." }
              }
            }
          ]
        },
        {
          label: { ru: "Мессенджеры и соцсети", en: "Socials" },
          fields: [
            {
              name: "socials",
              label: { ru: "Каналы связи", en: "Socials" },
              type: "array",
              admin: {
                description: {
                  ru: "Telegram/MAX/WhatsApp и другие ссылки, которые показываются рядом с контактами."
                }
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "platform",
                      label: { ru: "Канал", en: "Platform" },
                      type: "select",
                      options: [
                        { label: "Telegram", value: "telegram" },
                        { label: "WhatsApp", value: "whatsapp" },
                        { label: "ВКонтакте", value: "vk" },
                        { label: "MAX", value: "max" },
                        { label: "Email", value: "email" }
                      ],
                      admin: { width: "30%" }
                    },
                    {
                      name: "url",
                      label: { ru: "Ссылка", en: "URL" },
                      type: "text",
                      required: true,
                      admin: { width: "70%", placeholder: "https://t.me/..." }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          label: { ru: "Реквизиты", en: "Legal" },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "legalName",
                  label: { ru: "Юридическое название", en: "Legal name" },
                  type: "text",
                  admin: { width: "60%", placeholder: "ООО «Технокам»" }
                },
                {
                  name: "inn",
                  label: { ru: "ИНН", en: "INN" },
                  type: "text",
                  admin: { width: "40%", placeholder: "7700000000" }
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
