import type { GlobalConfig } from "payload";

export const Contacts: GlobalConfig = {
  slug: "contacts",
  label: { ru: "Контакты компании", en: "Contacts" },
  admin: {
    description: {
      ru: "Телефоны, email, адрес и соцсети, которые показываются в шапке, футере и форме заявки.",
      en: "Phones, email, address, socials shown in header, footer and lead form."
    }
  },
  fields: [
    {
      name: "phones",
      label: { ru: "Телефоны", en: "Phones" },
      type: "array",
      fields: [
        { type: "row", fields: [
          { name: "label", label: { ru: "Подпись", en: "Label" }, type: "text", admin: { width: "40%" } },
          { name: "number", label: { ru: "Номер", en: "Number" }, type: "text", required: true, admin: { width: "60%" } }
        ]}
      ]
    },
    { name: "email", label: { ru: "E-mail", en: "Email" }, type: "email" },
    { name: "address", label: { ru: "Адрес офиса", en: "Address" }, type: "textarea" },
    { name: "workingHours", label: { ru: "Часы работы", en: "Working hours" }, type: "text" },
    {
      name: "socials",
      label: { ru: "Соцсети и мессенджеры", en: "Socials" },
      type: "array",
      fields: [
        { type: "row", fields: [
          { name: "platform", label: { ru: "Платформа", en: "Platform" }, type: "select", options: [
            { label: "Telegram", value: "telegram" },
            { label: "WhatsApp", value: "whatsapp" },
            { label: "ВКонтакте", value: "vk" },
            { label: "MAX", value: "max" },
            { label: "Email", value: "email" }
          ], admin: { width: "30%" }},
          { name: "url", label: { ru: "Ссылка", en: "URL" }, type: "text", required: true, admin: { width: "70%" } }
        ]}
      ]
    },
    { name: "inn", label: { ru: "ИНН", en: "INN" }, type: "text" },
    { name: "legalName", label: { ru: "Юр. название", en: "Legal name" }, type: "text" }
  ],
  access: { read: () => true }
};
