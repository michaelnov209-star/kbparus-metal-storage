import type { CollectionConfig } from "payload";
import { adminGroups, adminHints } from "../admin/structure";

/**
 * Профиль калькулятора. Структура 1-в-1 повторяет лист «Админка»
 * из Калькулятор-New.xlsx — все таблицы коэффициентов и базовые цены.
 *
 * ВНИМАНИЕ: формулы расчёта живут в lib/calculator/pricing.ts (код),
 * НЕ в этой коллекции. CMS хранит только данные.
 */
export const CalculatorProfiles: CollectionConfig = {
  slug: "calculator-profiles",
  labels: {
    singular: { ru: "Профиль калькулятора", en: "Calculator profile" },
    plural: { ru: "Калькулятор: профили расчётов", en: "Calculator profiles" }
  },
  admin: {
    group: adminGroups.calculator,
    description: {
      ru: `${adminHints.calculator} Здесь редактируются цены, коэффициенты и опции, которые влияют на расчёт и Telegram-заявку.`,
      en: "All prices and coefficients from the Excel «Админка» sheet."
    },
    useAsTitle: "title",
    defaultColumns: ["title", "kind", "shortTitle"],
    listSearchableFields: ["title", "shortTitle", "slug"],
    pagination: { defaultLimit: 12, limits: [6, 12, 24] }
  },
  versions: { drafts: true },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "slug",
          label: { ru: "Системный ключ профиля", en: "Profile key" },
          type: "select",
          required: true,
          unique: true,
          options: [
            { label: "Автоматический склад листового металла", value: "auto-sheet-metal" },
            { label: "Автоматический склад сорт./трубного проката", value: "auto-sort-metal" },
            { label: "Стеллаж с выкатными кассетами", value: "rollout-cassette-rack" },
            { label: "Кассетный стеллаж под погрузчик", value: "forklift-cassette-rack" },
            { label: "Двухсторонний выкатной стеллаж", value: "two-side-rollout-rack" },
            { label: "Гибридный стеллаж", value: "hybrid-rollout-rack" }
          ],
          admin: {
            description: { ru: "Связан с расчётной логикой сайта. Менять только после согласования с разработчиком и проверки расчёта.", en: "" },
            width: "60%"
          }
        },
        {
          name: "kind",
          label: { ru: "Тип расчётной модели", en: "Pricing kind" },
          type: "select",
          required: true,
          options: [
            { label: "Автоматический склад", value: "automatic" },
            { label: "Кассеты под погрузчик", value: "forkliftCassette" },
            { label: "Выкатные кассеты", value: "rollout" },
            { label: "Гибрид", value: "hybrid" }
          ],
          admin: {
            description: { ru: "Определяет, какая модель расчёта применяется к профилю.", en: "" },
            width: "40%"
          }
        }
      ]
    },
    {
      type: "row",
      fields: [
        { name: "title", label: { ru: "Полное название", en: "Title" }, type: "text", required: true, admin: { width: "50%" } },
        { name: "shortTitle", label: { ru: "Короткое название", en: "Short title" }, type: "text", required: true, admin: { width: "50%" } }
      ]
    },
    { name: "description", label: { ru: "Описание для калькулятора", en: "Description" }, type: "textarea", required: true },
    { name: "image", label: { ru: "Иконка/фото профиля в калькуляторе", en: "Profile image" }, type: "upload", relationTo: "media" },

    // ============== РАБОЧЕЕ ПОЛЕ ПОЛКИ ==============
    {
      type: "tabs",
      tabs: [
        {
          label: { ru: "Размеры (высота/ширина/длина)", en: "Dimensions" },
          description: { ru: "Соответствует первой таблице на листе «Админка». Каждая строка — пара значение + коэффициент.", en: "" },
          fields: [
            {
              name: "heightOptions",
              label: { ru: "Высота (мм) и коэффициент", en: "Height options" },
              type: "array",
              minRows: 1,
              admin: { description: { ru: "Например: 70 → 1.0, 100 → 1.10, 120 → 1.15…", en: "" } },
              fields: [
                { type: "row", fields: [
                  { name: "value", label: { ru: "Значение, мм", en: "Value" }, type: "number", required: true, admin: { width: "50%" } },
                  { name: "factor", label: { ru: "Коэффициент", en: "Factor" }, type: "number", required: true, defaultValue: 1, admin: { width: "50%" } }
                ]}
              ]
            },
            {
              name: "widthOptions",
              label: { ru: "Ширина (мм) и коэффициент", en: "Width options" },
              type: "array",
              minRows: 1,
              fields: [
                { type: "row", fields: [
                  { name: "value", label: { ru: "Значение, мм", en: "Value" }, type: "number", required: true, admin: { width: "50%" } },
                  { name: "factor", label: { ru: "Коэффициент", en: "Factor" }, type: "number", required: true, defaultValue: 1, admin: { width: "50%" } }
                ]}
              ]
            },
            {
              name: "lengthOptions",
              label: { ru: "Длина (мм) и коэффициент", en: "Length options" },
              type: "array",
              minRows: 1,
              fields: [
                { type: "row", fields: [
                  { name: "value", label: { ru: "Значение, мм", en: "Value" }, type: "number", required: true, admin: { width: "50%" } },
                  { name: "factor", label: { ru: "Коэффициент", en: "Factor" }, type: "number", required: true, defaultValue: 1, admin: { width: "50%" } }
                ]}
              ]
            }
          ]
        },
        {
          label: { ru: "Цены полок и нагрузка", en: "Shelf prices & load" },
          description: { ru: "«Цена полки» и «Нагрузка на полку» из Excel.", en: "" },
          fields: [
            {
              name: "loadOptions",
              label: { ru: "Нагрузка (кг), цена полки (₽), коэффициент", en: "Load → price → factor" },
              type: "array",
              minRows: 1,
              admin: {
                description: { ru: "Например: 1500 кг → 75 000 ₽ → 1.0; 2000 → 90 000 → 1.2…", en: "" }
              },
              fields: [
                { type: "row", fields: [
                  { name: "value", label: { ru: "Нагрузка, кг", en: "Load" }, type: "number", required: true, admin: { width: "33%" } },
                  { name: "price", label: { ru: "Цена полки, ₽", en: "Price" }, type: "number", required: true, admin: { width: "34%" } },
                  { name: "factor", label: { ru: "Коэффициент", en: "Factor" }, type: "number", admin: { width: "33%" } }
                ]}
              ]
            }
          ]
        },
        {
          label: { ru: "Цены башен и количество полок", en: "Tower prices" },
          fields: [
            {
              name: "towerByShelfCount",
              label: { ru: "Цена башни в зависимости от количества полок", en: "Tower price by shelf count" },
              type: "array",
              admin: { description: { ru: "10 полок → 1 500 000 ₽, 15 → 1 800 000 ₽, и т.д.", en: "" } },
              fields: [
                { type: "row", fields: [
                  { name: "shelfCount", label: { ru: "Кол-во полок", en: "Shelves" }, type: "number", required: true, admin: { width: "33%" } },
                  { name: "price", label: { ru: "Цена башни, ₽", en: "Price" }, type: "number", required: true, admin: { width: "34%" } },
                  { name: "factor", label: { ru: "Коэффициент", en: "Factor" }, type: "number", admin: { width: "33%" } }
                ]}
              ]
            },
            { name: "towerBasePrice", label: { ru: "Базовая цена башни (для выкатных/погрузчиковых)", en: "Base tower price" }, type: "number" },
            { name: "baseShelfCount", label: { ru: "Базовое число полок (для коэф-та сверх него)", en: "Base shelf count" }, type: "number" },
            { name: "extraShelfFactor", label: { ru: "Коэффициент за каждую полку сверх базы", en: "Extra shelf factor" }, type: "number", admin: { description: { ru: "В Excel: «коэффициент если полок больше 5 — 0.1»", en: "" } } }
          ]
        },
        {
          label: { ru: "Консоль / ворота", en: "Console / gates" },
          fields: [
            { name: "consoleBasePrice", label: { ru: "Базовая цена консоли, ₽", en: "Console base price" }, type: "number" },
            { name: "consoleLongFactor", label: { ru: "Коэффициент длинной полки (>3100 мм)", en: "Long shelf factor" }, type: "number", defaultValue: 1.2 },
            { name: "gateBasePrice", label: { ru: "Цена распашных ворот, ₽", en: "Gate base price" }, type: "number" }
          ]
        },
        {
          label: { ru: "Опции (доп. оборудование)", en: "Options" },
          fields: [
            {
              name: "options",
              label: { ru: "Дополнительные опции с ценами", en: "Options" },
              type: "array",
              admin: { description: { ru: "Например: весы 90 000 ₽, ИК-ограждения 80 000 ₽, вакуумный захват 450 000 ₽…", en: "" } },
              fields: [
                { type: "row", fields: [
                  { name: "id", label: { ru: "Системный ключ опции", en: "Option key" }, type: "text", required: true, admin: { width: "30%" } },
                  { name: "title", label: { ru: "Название", en: "Title" }, type: "text", required: true, admin: { width: "40%" } },
                  { name: "price", label: { ru: "Цена, ₽", en: "Price" }, type: "number", required: true, admin: { width: "30%" } }
                ]},
                { name: "defaultSelected", label: { ru: "По умолчанию выбрана", en: "Default" }, type: "checkbox" }
              ]
            }
          ]
        },
        {
          label: { ru: "Значения по умолчанию", en: "Default values" },
          description: { ru: "Что показывать пользователю при первом открытии калькулятора.", en: "" },
          fields: [
            {
              name: "defaultValues",
              type: "group",
              label: { ru: "Дефолты", en: "Defaults" },
              fields: [
                { type: "row", fields: [
                  { name: "heightMm", label: { ru: "Высота, мм", en: "" }, type: "number", admin: { width: "33%" } },
                  { name: "widthMm", label: { ru: "Ширина, мм", en: "" }, type: "number", admin: { width: "33%" } },
                  { name: "lengthMm", label: { ru: "Длина, мм", en: "" }, type: "number", admin: { width: "34%" } }
                ]},
                { type: "row", fields: [
                  { name: "loadKg", label: { ru: "Нагрузка, кг", en: "" }, type: "number", admin: { width: "33%" } },
                  { name: "shelfCount", label: { ru: "Полок", en: "" }, type: "number", admin: { width: "33%" } },
                  { name: "towerCount", label: { ru: "Башен", en: "" }, type: "number", admin: { width: "34%" } }
                ]},
                { name: "rolloutShelfCount", label: { ru: "Выкатных полок (если применимо)", en: "" }, type: "number" },
                {
                  name: "rolloutSide",
                  label: { ru: "Сторона (для выкатных)", en: "" },
                  type: "select",
                  options: [
                    { label: { ru: "Односторонний", en: "" }, value: "one" },
                    { label: { ru: "Двусторонний", en: "" }, value: "two" }
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
