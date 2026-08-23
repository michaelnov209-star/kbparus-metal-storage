import type { CollectionConfig, Field, FieldAccess } from "payload";
import { booleanStatusAdmin } from "../admin/boolean-status";
import { adminSectionHero, adminSectionHeroField } from "../admin/section-hero";
import { adminGroups, adminHints } from "../admin/structure";
import {
  adminOnly,
  getCmsRole,
  leadManagersOnly,
  leadReadersOnly,
  leadsAdminUi
} from "../access/rbac";

const salesEditableLeadFields = new Set(["managerComment", "status"]);

const leadFieldUpdateAccess =
  (fieldName: string): FieldAccess =>
  ({ req }) => {
    const role = getCmsRole(req.user);
    return (
      role === "admin" ||
      (role === "sales_manager" && salesEditableLeadFields.has(fieldName))
    );
  };

function applyLeadRoleAccess(fields: Field[]): Field[] {
  return fields.map((field) => {
    if (field.type === "ui") return field;

    if ("name" in field && typeof field.name === "string") {
      return {
        ...field,
        access: {
          ...field.access,
          update: leadFieldUpdateAccess(field.name)
        }
      } as Field;
    }

    if (field.type === "tabs") {
      return {
        ...field,
        tabs: field.tabs.map((tab) => ({
          ...tab,
          fields: applyLeadRoleAccess(tab.fields)
        }))
      };
    }

    if ("fields" in field && Array.isArray(field.fields)) {
      return {
        ...field,
        fields: applyLeadRoleAccess(field.fields)
      } as Field;
    }

    return field;
  });
}

export const Leads: CollectionConfig = {
  slug: "leads",
  defaultSort: "-createdAt",
  labels: {
    singular: { ru: "Заявка", en: "Lead" },
    plural: { ru: "Заявки с сайта", en: "Website leads" }
  },
  admin: {
    group: adminGroups.leads,
    components: {
      beforeList: [adminSectionHero("leads")]
    },
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
    admin: leadsAdminUi,
    read: leadReadersOnly,
    create: adminOnly,
    update: leadManagersOnly,
    delete: adminOnly
  },
  fields: applyLeadRoleAccess([
    adminSectionHeroField("leads"),
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
                {
                  name: "sourceUrl",
                  label: { ru: "Страница, откуда пришла заявка", en: "Source page" },
                  type: "text",
                  admin: {
                    width: "50%",
                    description: {
                      ru: "Ссылка помогает быстро открыть страницу клиента и проверить контекст обращения."
                    }
                  }
                }
              ]
            },
            { name: "source", label: { ru: "Описание источника", en: "Source" }, type: "text" },
            {
              type: "collapsible",
              label: { ru: "Дополнительные данные источника", en: "Additional source details" },
              admin: { initCollapsed: true },
              fields: [
                {
                  name: "utm",
                  label: { ru: "Метки рекламной кампании", en: "Campaign tags" },
                  type: "json",
                  admin: {
                    readOnly: true,
                    description: {
                      ru: "Заполняются сайтом автоматически и нужны для аналитики рекламы."
                    }
                  }
                }
              ]
            }
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
            {
              type: "collapsible",
              label: { ru: "Подробности расчёта", en: "Calculation details" },
              admin: { initCollapsed: true },
              fields: [
                {
                  name: "calculatorInput",
                  label: { ru: "Все выбранные параметры", en: "All selected parameters" },
                  type: "json",
                  admin: {
                    readOnly: true,
                    description: {
                      ru: "Полный снимок расчёта. Обычно менеджеру достаточно краткой конфигурации выше."
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          label: { ru: "Доставка", en: "Delivery" },
          fields: [
            {
              type: "collapsible",
              label: { ru: "Служебный статус доставки", en: "Delivery status details" },
              admin: { initCollapsed: true },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "emailDelivered", label: { ru: "Отправлено на почту", en: "Email delivered" }, type: "checkbox", defaultValue: false, admin: { width: "25%", ...booleanStatusAdmin({ trueLabel: "Доставлено", falseLabel: "Не доставлено", falseTone: "warning" }) } },
                    { name: "telegramDelivered", label: { ru: "Отправлено в Telegram", en: "Telegram delivered" }, type: "checkbox", defaultValue: false, admin: { width: "25%", ...booleanStatusAdmin({ trueLabel: "Доставлено", falseLabel: "Не доставлено", falseTone: "warning" }) } },
                    { name: "bitrix24Delivered", label: { ru: "Передано в Bitrix24", en: "Bitrix24 delivered" }, type: "checkbox", defaultValue: false, admin: { width: "25%", ...booleanStatusAdmin({ trueLabel: "Доставлено", falseLabel: "Не доставлено", falseTone: "warning" }) } },
                    { name: "cmsStored", label: { ru: "Заявка сохранена", en: "Lead stored" }, type: "checkbox", defaultValue: true, admin: { width: "25%", readOnly: true, ...booleanStatusAdmin({ trueLabel: "Сохранено", falseLabel: "Не сохранено", falseTone: "negative" }) } }
                  ]
                },
                {
                  name: "deliveryErrors",
                  label: { ru: "Что помешало доставке", en: "Delivery issue" },
                  type: "textarea",
                  admin: {
                    readOnly: true,
                    description: {
                      ru: "Заполняется автоматически, если один из каналов не принял заявку."
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ])
};
