import type { CollectionConfig } from "payload";
import { adminGroups } from "../admin/structure";

export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: { ru: "Сотрудник админки", en: "Admin user" },
    plural: { ru: "Администраторы и редакторы", en: "Users" }
  },
  admin: {
    group: adminGroups.users,
    useAsTitle: "displayName",
    defaultColumns: ["displayName", "email", "role"],
    listSearchableFields: ["firstName", "lastName", "displayName", "email"],
    description: {
      ru: "Доступы сотрудников к CMS. Раздел не управляет клиентами сайта, только пользователями админки.",
      en: "CMS staff access."
    },
    pagination: { defaultLimit: 20, limits: [10, 20, 50] }
  },
  auth: {
    cookies: {
      sameSite: "Lax",
      secure: true
    }
  },
  hooks: {
    beforeChange: [
      ({ data }) => ({
        ...data,
        displayName:
          data.displayName ||
          [data.firstName, data.lastName].filter(Boolean).join(" ") ||
          data.name ||
          data.email
      })
    ]
  },
  fields: [
    {
      name: "name",
      label: { ru: "ФИО (старое служебное поле)", en: "Legacy full name" },
      type: "text",
      admin: {
        hidden: true,
        description: { ru: "Сохранено для совместимости со старыми записями. Новые данные заполняйте в отдельных полях." }
      }
    },
    {
      type: "row",
      fields: [
        {
          name: "firstName",
          label: { ru: "Имя", en: "First name" },
          type: "text",
          admin: { width: "50%", placeholder: "Иван" }
        },
        {
          name: "lastName",
          label: { ru: "Фамилия", en: "Last name" },
          type: "text",
          admin: { width: "50%", placeholder: "Петров" }
        }
      ]
    },
    {
      type: "row",
      fields: [
        {
          name: "displayName",
          label: { ru: "Отображаемое имя", en: "Display name" },
          type: "text",
          admin: {
            width: "50%",
            placeholder: "Иван Петров",
            description: { ru: "Как показывать сотрудника в админке. Если пусто, используйте email." }
          }
        },
        {
          name: "position",
          label: { ru: "Должность", en: "Position" },
          type: "text",
          admin: { width: "50%", placeholder: "Контент-менеджер" }
        }
      ]
    },
    {
      name: "role",
      label: { ru: "Роль в CMS", en: "CMS role" },
      type: "select",
      defaultValue: "editor",
      required: true,
      admin: {
        description: { ru: "Определяет уровень доступа сотрудника к разделам админки." }
      },
      options: [
        { label: { ru: "Администратор: полный доступ", en: "Admin" }, value: "admin" },
        { label: { ru: "Редактор контента", en: "Editor" }, value: "editor" },
        { label: { ru: "Медиа-менеджер", en: "Media manager" }, value: "photographer" }
      ]
    }
  ]
};
