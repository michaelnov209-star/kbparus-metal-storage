import type { GlobalConfig } from "payload";
import { adminGroups, adminHints } from "../admin/structure";
import { adminOnly, isAdminUser } from "../access/rbac";

export const LeadManagement: GlobalConfig = {
  slug: "lead-management",
  label: { ru: "Заявки: формы и интеграции", en: "Lead forms and integrations" },
  admin: {
    group: adminGroups.leads,
    hidden: ({ user }) => !isAdminUser(user),
    description: {
      ru: `${adminHints.leads} Этот раздел не хранит секреты и не заменяет переменные окружения Vercel.`,
      en: "Operational notes for lead forms and integrations."
    }
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: { ru: "Формы на сайте", en: "Website forms" },
          fields: [
            {
              name: "forms",
              label: { ru: "Точки сбора заявок", en: "Lead sources" },
              type: "array",
              admin: {
                description: {
                  ru: "Список помогает менеджерам понимать, откуда приходят заявки. Сам endpoint `/api/leads` остаётся единым."
                }
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "title",
                      label: { ru: "Название формы", en: "Form title" },
                      type: "text",
                      required: true,
                      admin: { width: "35%", placeholder: "Калькулятор на главной" }
                    },
                    {
                      name: "sourcePath",
                      label: { ru: "Страница / источник", en: "Source path" },
                      type: "text",
                      admin: { width: "35%", placeholder: "/#calculator" }
                    },
                    {
                      name: "owner",
                      label: { ru: "Ответственный", en: "Owner" },
                      type: "text",
                      admin: { width: "30%", placeholder: "Отдел продаж" }
                    }
                  ]
                },
                {
                  name: "managerNote",
                  label: { ru: "Комментарий для менеджера", en: "Manager note" },
                  type: "textarea",
                  admin: {
                    placeholder: "Что важно проверить при обработке заявки из этой формы"
                  }
                }
              ]
            }
          ]
        },
        {
          label: { ru: "Telegram", en: "Telegram" },
          fields: [
            {
              name: "telegram",
              label: { ru: "Статус Telegram-уведомлений", en: "Telegram status" },
              type: "group",
              admin: {
                description: {
                  ru: "Токен и chat id хранятся только в Vercel env. Здесь фиксируется операционный статус для команды."
                }
              },
              fields: [
                {
                  name: "enabled",
                  label: { ru: "Telegram-уведомления включены в окружении", en: "Enabled" },
                  type: "checkbox",
                  defaultValue: true
                },
                {
                  name: "channelName",
                  label: { ru: "Название рабочего чата", en: "Channel name" },
                  type: "text",
                  admin: { placeholder: "Заявки сайта КБ Парус" }
                },
                {
                  name: "lastManualCheck",
                  label: { ru: "Дата последней ручной проверки", en: "Last manual check" },
                  type: "date",
                  admin: {
                    date: { pickerAppearance: "dayOnly" },
                    description: { ru: "Обновляйте после тестовой заявки или проверки менеджером." }
                  }
                }
              ]
            }
          ]
        },
        {
          label: { ru: "Bitrix24", en: "Bitrix24" },
          fields: [
            {
              name: "bitrix24",
              label: { ru: "Необязательная интеграция Bitrix24", en: "Optional Bitrix24 integration" },
              type: "group",
              admin: {
                description: {
                  ru: "Bitrix24 не входит в текущий рабочий процесс. Сайт полноценно принимает заявки через админку, Telegram и почту; этот блок оставлен только на случай будущего подключения CRM."
                }
              },
              fields: [
                {
                  name: "status",
                  label: { ru: "Статус", en: "Status" },
                  type: "select",
                  defaultValue: "not_used",
                  options: [
                    { label: { ru: "Не используется", en: "Not used" }, value: "not_used" },
                    { label: { ru: "Запланировано", en: "Planned" }, value: "planned" },
                    { label: { ru: "На проверке", en: "Testing" }, value: "testing" },
                    { label: { ru: "Готово", en: "Ready" }, value: "ready" }
                  ]
                },
                {
                  name: "notes",
                  label: { ru: "Что нужно подготовить", en: "Notes" },
                  type: "textarea",
                  admin: {
                    placeholder: "Поля сделки, ответственные менеджеры, источник заявки, права вебхука"
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  access: {
    read: adminOnly,
    update: adminOnly
  }
};
