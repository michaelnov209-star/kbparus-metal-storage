import type { CollectionConfig } from "payload";

/**
 * Пользователи админки. Только зарегистрированные могут заходить в /admin.
 * Первый пользователь создаётся при первом заходе на /admin.
 */
export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: { ru: "Пользователь", en: "User" },
    plural: { ru: "Администраторы и редакторы", en: "Users" }
  },
  admin: {
    useAsTitle: "email"
  },
  auth: {
    cookies: {
      sameSite: "Lax",
      secure: true
    }
  },
  fields: [
    {
      name: "name",
      label: { ru: "Имя", en: "Name" },
      type: "text"
    },
    {
      name: "role",
      label: { ru: "Роль", en: "Role" },
      type: "select",
      defaultValue: "editor",
      required: true,
      options: [
        { label: { ru: "Администратор (всё)", en: "Admin" }, value: "admin" },
        { label: { ru: "Редактор контента (без удаления)", en: "Editor" }, value: "editor" },
        { label: { ru: "Фотограф (только медиа)", en: "Photographer" }, value: "photographer" }
      ]
    }
  ]
};
