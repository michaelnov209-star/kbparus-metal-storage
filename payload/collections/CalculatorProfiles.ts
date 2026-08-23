import type { CollectionConfig, NumberFieldSingleValidation } from "payload";
import { prepareCalculatorProfile } from "../../lib/calculator/profile-admin-validation";
import { booleanStatusAdmin } from "../admin/boolean-status";
import { adminSectionHero } from "../admin/section-hero";
import { adminGroups, adminHints } from "../admin/structure";
import {
  calculatorAdminUi,
  calculatorManagersOnly,
  calculatorReadersOnly
} from "../access/rbac";
import {
  revalidateCalculatorProfileAfterChange,
  revalidateCalculatorProfileAfterDelete
} from "../hooks/revalidateCalculatorProfiles";
import {
  stampUpdatedBy,
  updatedByField,
  updatedBySnapshotFields
} from "../hooks/stampUpdatedBy";

const CALCULATOR_ROW_LABEL = {
  path: "@/app/(payload)/components/CalculatorProfileRowLabel",
  exportName: "CalculatorProfileRowLabel"
} as const;

function kindIs(...kinds: string[]) {
  return (_: unknown, siblingData: Record<string, unknown>) =>
    kinds.includes(String(siblingData.kind ?? ""));
}

function requiredHybridNumber(label: string, allowZero = false): NumberFieldSingleValidation {
  return (value, { siblingData }) => {
    if ((siblingData as { kind?: unknown }).kind !== "hybrid") return true;

    const valid =
      typeof value === "number" &&
      Number.isFinite(value) &&
      (allowZero ? value >= 0 : value > 0);

    return valid
      ? true
      : `Для гибридного профиля поле «${label}» обязательно и должно быть ${
          allowZero ? "неотрицательным" : "больше нуля"
        }.`;
  };
}

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
    components: {
      beforeList: [adminSectionHero("calculator")]
    },
    description: {
      ru: `${adminHints.calculator} Здесь редактируются цены, коэффициенты и опции, которые влияют на расчёт и Telegram-заявку.`,
      en: "All prices and coefficients from the Excel «Админка» sheet."
    },
    useAsTitle: "title",
    defaultColumns: ["title", "kind", "sortOrder", "shortTitle"],
    listSearchableFields: ["title", "shortTitle", "slug"],
    pagination: { defaultLimit: 12, limits: [6, 12, 24] }
  },
  hooks: {
    afterChange: [revalidateCalculatorProfileAfterChange],
    afterDelete: [revalidateCalculatorProfileAfterDelete],
    beforeChange: [stampUpdatedBy],
    beforeValidate: [prepareCalculatorProfile]
  },
  versions: { drafts: true },
  fields: [
    updatedByField(),
    ...updatedBySnapshotFields(),
    {
      name: "calculatorGuide",
      type: "ui",
      admin: {
        components: {
          Field: {
            path: "@/app/(payload)/components/CalculatorProfileGuide",
            exportName: "CalculatorProfileGuide"
          }
        }
      }
    },
    {
      name: "calculatorBuilder",
      type: "ui",
      admin: {
        components: {
          Field: {
            path: "@/app/(payload)/components/CalculatorProfileBuilder",
            exportName: "CalculatorProfileBuilder"
          }
        }
      }
    },
    {
      name: "slug",
      label: { ru: "Внутренний адрес системы", en: "Profile key" },
      type: "text",
      required: true,
      unique: true,
      admin: {
        hidden: true,
        description: {
          ru: "Создаётся автоматически из названия и после первого сохранения не меняется.",
          en: "Generated automatically and kept stable."
        }
      }
    },
    {
      type: "row",
      fields: [
        {
          name: "kind",
          label: { ru: "Как рассчитывать стоимость", en: "Pricing kind" },
          type: "select",
          required: true,
          defaultValue: "automatic",
          options: [
            { label: "Автоматическая система с подъёмным модулем", value: "automatic" },
            { label: "Кассеты с обслуживанием погрузчиком", value: "forkliftCassette" },
            { label: "Система с выкатными полками", value: "rollout" },
            { label: "Комбинация погрузчика и выкатных полок", value: "hybrid" }
          ],
          admin: {
            description: {
              ru: "Выберите механику, которая соответствует конструкции. После публикации менять модель без повторной проверки расчёта нельзя.",
              en: ""
            },
            width: "50%"
          }
        },
        {
          name: "iconKey",
          label: { ru: "Пиктограмма в калькуляторе", en: "Calculator icon" },
          type: "select",
          required: true,
          defaultValue: "automation",
          options: [
            { label: "Автоматизация", value: "automation" },
            { label: "Трубы и длинномер", value: "long-products" },
            { label: "Выкатные полки", value: "rollout" },
            { label: "Погрузчик", value: "forklift" },
            { label: "Двусторонний доступ", value: "two-sided" },
            { label: "Комбинированная система", value: "hybrid" }
          ],
          admin: {
            description: {
              ru: "Помогает быстро отличить систему в списке вариантов.",
              en: ""
            },
            width: "30%"
          }
        },
        {
          name: "sortOrder",
          label: { ru: "Порядок показа", en: "Sort order" },
          type: "number",
          required: true,
          defaultValue: 100,
          min: 0,
          max: 10_000,
          admin: {
            description: {
              ru: "Меньшее число показывается раньше.",
              en: ""
            },
            width: "20%"
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
    {
      name: "bestFor",
      label: { ru: "Для каких задач подходит лучше всего", en: "Best for" },
      type: "textarea",
      required: true,
      admin: {
        description: {
          ru: "Коротко объясните клиенту сценарий применения: материал, частота доступа, способ загрузки или ограничение площади.",
          en: ""
        }
      }
    },
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
              label: { ru: "Полезная высота", en: "Height options" },
              labels: {
                singular: { ru: "Вариант высоты", en: "Height option" },
                plural: { ru: "Варианты высоты", en: "Height options" }
              },
              type: "array",
              minRows: 1,
              admin: {
                components: { RowLabel: CALCULATOR_ROW_LABEL },
                description: {
                  ru: "Добавьте доступные значения в миллиметрах. Коэффициент 1 — базовая цена; 1,2 увеличивает зависимую часть цены на 20%.",
                  en: ""
                }
              },
              fields: [
                { type: "row", fields: [
                  { name: "value", label: { ru: "Значение, мм", en: "Value" }, type: "number", required: true, admin: { width: "50%" } },
                  { name: "factor", label: { ru: "Коэффициент", en: "Factor" }, type: "number", required: true, defaultValue: 1, admin: { width: "50%" } }
                ]}
              ]
            },
            {
              name: "widthOptions",
              label: { ru: "Рабочая ширина", en: "Width options" },
              labels: {
                singular: { ru: "Вариант ширины", en: "Width option" },
                plural: { ru: "Варианты ширины", en: "Width options" }
              },
              type: "array",
              minRows: 1,
              admin: {
                components: { RowLabel: CALCULATOR_ROW_LABEL },
                description: {
                  ru: "Можно выбрать значения из скопированной системы или добавить собственную ширину и коэффициент.",
                  en: ""
                }
              },
              fields: [
                { type: "row", fields: [
                  { name: "value", label: { ru: "Значение, мм", en: "Value" }, type: "number", required: true, admin: { width: "50%" } },
                  { name: "factor", label: { ru: "Коэффициент", en: "Factor" }, type: "number", required: true, defaultValue: 1, admin: { width: "50%" } }
                ]}
              ]
            },
            {
              name: "lengthOptions",
              label: { ru: "Рабочая длина", en: "Length options" },
              labels: {
                singular: { ru: "Вариант длины", en: "Length option" },
                plural: { ru: "Варианты длины", en: "Length options" }
              },
              type: "array",
              minRows: 1,
              admin: {
                components: { RowLabel: CALCULATOR_ROW_LABEL },
                description: {
                  ru: "Задайте все длины, которые клиент сможет выбрать в калькуляторе.",
                  en: ""
                }
              },
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
              label: { ru: "Нагрузка и цена одного уровня", en: "Load and level price" },
              labels: {
                singular: { ru: "Вариант нагрузки", en: "Load option" },
                plural: { ru: "Варианты нагрузки", en: "Load options" }
              },
              type: "array",
              minRows: 1,
              admin: {
                components: { RowLabel: CALCULATOR_ROW_LABEL },
                description: {
                  ru: "Укажите прямую цену уровня для каждой нагрузки. Скрытый технический коэффициент не используется в расчёте.",
                  en: ""
                }
              },
              fields: [
                { type: "row", fields: [
                  { name: "value", label: { ru: "Нагрузка, кг", en: "Load" }, type: "number", required: true, min: 1, admin: { width: "50%" } },
                  { name: "price", label: { ru: "Цена уровня, ₽", en: "Price" }, type: "number", required: true, min: 1, admin: { width: "50%" } },
                  {
                    name: "factor",
                    type: "number",
                    admin: {
                      hidden: true
                    }
                  }
                ]}
              ]
            },
            {
              name: "rolloutLoadOptions",
              label: {
                ru: "Нагрузка и цена выкатного уровня",
                en: "Rollout load and level price"
              },
              labels: {
                singular: { ru: "Вариант выкатной нагрузки", en: "Rollout load option" },
                plural: { ru: "Варианты выкатной нагрузки", en: "Rollout load options" }
              },
              type: "array",
              admin: {
                condition: kindIs("hybrid"),
                components: { RowLabel: CALCULATOR_ROW_LABEL },
                description: {
                  ru: "Только для комбинированной системы: отдельная цена выкатной кассеты для каждой нагрузки.",
                  en: ""
                }
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "value",
                      label: { ru: "Нагрузка, кг", en: "Load" },
                      type: "number",
                      required: true,
                      min: 1,
                      admin: { width: "50%" }
                    },
                    {
                      name: "price",
                      label: { ru: "Цена выкатного уровня, ₽", en: "Price" },
                      type: "number",
                      required: true,
                      min: 1,
                      admin: { width: "50%" }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          label: { ru: "Уровни, секции и несущая конструкция", en: "Counts and structure" },
          fields: [
            {
              name: "shelfCountOptions",
              label: {
                ru: "Доступное количество уровней",
                en: "Shelf count options"
              },
              labels: {
                singular: { ru: "Количество уровней", en: "Shelf count" },
                plural: { ru: "Варианты количества уровней", en: "Shelf counts" }
              },
              type: "array",
              minRows: 1,
              admin: {
                components: { RowLabel: CALCULATOR_ROW_LABEL },
                description: {
                  ru: "Каждое число станет отдельным вариантом в калькуляторе.",
                  en: ""
                }
              },
              fields: [
                {
                  name: "value",
                  label: { ru: "Количество уровней", en: "Count" },
                  type: "number",
                  required: true,
                  min: 1
                }
              ]
            },
            {
              name: "rolloutShelfCountOptions",
              label: {
                ru: "Доступное количество выкатных уровней",
                en: "Rollout shelf count options"
              },
              labels: {
                singular: { ru: "Количество выкатных уровней", en: "Rollout count" },
                plural: { ru: "Варианты выкатных уровней", en: "Rollout counts" }
              },
              type: "array",
              admin: {
                condition: kindIs("hybrid"),
                components: { RowLabel: CALCULATOR_ROW_LABEL },
                description: {
                  ru: "Только для комбинированной системы: сколько выкатных кассет можно добавить отдельно от полок под погрузчик.",
                  en: ""
                }
              },
              fields: [
                {
                  name: "value",
                  label: { ru: "Количество выкатных уровней", en: "Count" },
                  type: "number",
                  required: true,
                  min: 1
                }
              ]
            },
            {
              name: "towerCountOptions",
              label: {
                ru: "Доступное количество секций",
                en: "Section count options"
              },
              labels: {
                singular: { ru: "Количество секций", en: "Section count" },
                plural: { ru: "Варианты количества секций", en: "Section counts" }
              },
              type: "array",
              minRows: 1,
              admin: {
                components: { RowLabel: CALCULATOR_ROW_LABEL },
                description: {
                  ru: "Секции также могут называться башнями — клиент увидит понятное слово «секции».",
                  en: ""
                }
              },
              fields: [
                {
                  name: "value",
                  label: { ru: "Количество секций", en: "Count" },
                  type: "number",
                  required: true,
                  min: 1
                }
              ]
            },
            {
              name: "towerByShelfCount",
              label: { ru: "Цена башни в зависимости от количества полок", en: "Tower price by shelf count" },
              labels: {
                singular: { ru: "Цена несущей секции", en: "Structure price" },
                plural: { ru: "Цены несущей секции", en: "Structure prices" }
              },
              type: "array",
              admin: {
                condition: kindIs("automatic"),
                components: { RowLabel: CALCULATOR_ROW_LABEL },
                description: {
                  ru: "Для каждого количества уровней выше задайте прямую цену несущей секции.",
                  en: ""
                }
              },
              fields: [
                { type: "row", fields: [
                  { name: "shelfCount", label: { ru: "Количество уровней", en: "Shelves" }, type: "number", required: true, min: 1, admin: { width: "50%" } },
                  { name: "price", label: { ru: "Цена секции, ₽", en: "Price" }, type: "number", required: true, min: 1, admin: { width: "50%" } },
                  {
                    name: "factor",
                    type: "number",
                    admin: {
                      hidden: true
                    }
                  }
                ]}
              ]
            },
            {
              name: "towerBasePrice",
              label: { ru: "Базовая цена башни, ₽", en: "Base tower price" },
              type: "number",
              min: 0,
              validate: requiredHybridNumber("Базовая цена башни"),
              admin: {
                condition: kindIs("forkliftCassette", "rollout", "hybrid"),
                description: {
                  ru: "Стоимость несущей секции при базовом количестве уровней.",
                  en: ""
                }
              }
            },
            {
              name: "baseShelfCount",
              label: { ru: "Базовое число полок", en: "Base shelf count" },
              type: "number",
              min: 0,
              validate: requiredHybridNumber("Базовое число полок"),
              admin: {
                condition: kindIs("forkliftCassette", "rollout", "hybrid")
              }
            },
            {
              name: "extraShelfFactor",
              label: { ru: "Коэффициент за каждую полку сверх базы", en: "Extra shelf factor" },
              type: "number",
              min: 0,
              validate: requiredHybridNumber("Коэффициент за каждую полку сверх базы", true),
              admin: {
                condition: kindIs("forkliftCassette", "rollout", "hybrid"),
                description: {
                  ru: "Например 0,1: каждый дополнительный уровень сверх базы увеличивает цену несущей секции на 10%.",
                  en: ""
                }
              }
            },
            {
              name: "maxCombinedShelfCount",
              label: { ru: "Максимум полок в гибридной системе", en: "Maximum combined shelf count" },
              type: "number",
              min: 1,
              defaultValue: 25,
              validate: requiredHybridNumber("Максимум полок в гибридной системе"),
              admin: {
                condition: (_, siblingData) => siblingData.kind === "hybrid",
                description: {
                  ru: "Общий предел полок под погрузчик и выкатных кассет на одну башню. Текущее значение из Excel — 25.",
                  en: "Combined forklift and rollout shelf limit per tower."
                }
              }
            }
          ]
        },
        {
          label: { ru: "Консоль / ворота", en: "Console / gates" },
          fields: [
            {
              name: "consoleBasePrice",
              label: {
                ru: "Цена подъёмного модуля, ₽",
                en: "Console base price"
              },
              type: "number",
              min: 1,
              admin: {
                condition: kindIs("automatic"),
                description: {
                  ru: "Базовая стоимость подъёмного модуля автоматической системы.",
                  en: ""
                }
              }
            },
            {
              type: "row",
              fields: [
                {
                  name: "consoleLongFromMm",
                  label: {
                    ru: "С какой длины считать систему длинной, мм",
                    en: "Long system threshold"
                  },
                  type: "number",
                  defaultValue: 3100,
                  min: 1,
                  admin: {
                    condition: kindIs("automatic"),
                    width: "50%"
                  }
                },
                {
                  name: "consoleLongFactor",
                  label: {
                    ru: "Коэффициент подъёмного модуля для длинной системы",
                    en: "Long system factor"
                  },
                  type: "number",
                  defaultValue: 1.2,
                  min: 0.01,
                  admin: {
                    condition: kindIs("automatic"),
                    description: {
                      ru: "Например 1,2 увеличивает цену подъёмного модуля на 20%.",
                      en: ""
                    },
                    width: "50%"
                  }
                }
              ]
            },
            {
              name: "gateBasePrice",
              label: { ru: "Цена защитных ворот, ₽", en: "Gate base price" },
              type: "number",
              min: 0,
              validate: requiredHybridNumber("Цена распашных ворот"),
              admin: {
                condition: kindIs("rollout", "hybrid"),
                description: {
                  ru: "Используется для выкатной части системы.",
                  en: ""
                }
              }
            },
            {
              name: "supportsTwoSided",
              label: {
                ru: "Разрешить выкат с двух сторон",
                en: "Allow two-sided rollout"
              },
              type: "checkbox",
              defaultValue: false,
              admin: {
                condition: kindIs("rollout"),
                description: {
                  ru: "Включите только если конструкция действительно предусматривает доступ с двух сторон.",
                  en: ""
                },
                ...booleanStatusAdmin({
                  trueLabel: "Двусторонний выкат доступен",
                  falseLabel: "Только односторонний выкат",
                  trueTone: "accent",
                  falseTone: "neutral"
                })
              }
            }
          ]
        },
        {
          label: { ru: "Опции (доп. оборудование)", en: "Options" },
          fields: [
            {
              name: "options",
              label: { ru: "Дополнительные опции с ценами", en: "Options" },
              labels: {
                singular: { ru: "Дополнительная опция", en: "Option" },
                plural: { ru: "Дополнительные опции", en: "Options" }
              },
              type: "array",
              admin: {
                components: { RowLabel: CALCULATOR_ROW_LABEL },
                description: {
                  ru: "Добавьте оборудование, которое клиент сможет включить в расчёт. Системный ключ создаётся автоматически.",
                  en: ""
                }
              },
              fields: [
                { type: "row", fields: [
                  {
                    name: "optionId",
                    type: "text",
                    required: true,
                    admin: { hidden: true }
                  },
                  { name: "title", label: { ru: "Название для клиента", en: "Title" }, type: "text", required: true, admin: { width: "65%" } },
                  { name: "price", label: { ru: "Доплата, ₽", en: "Price" }, type: "number", required: true, min: 0, admin: { width: "35%" } }
                ]},
                {
                  name: "defaultSelected",
                  label: { ru: "По умолчанию выбрана", en: "Default" },
                  type: "checkbox",
                  admin: booleanStatusAdmin({
                    trueLabel: "Выбрана по умолчанию",
                    falseLabel: "Не выбрана",
                    trueTone: "accent",
                    falseTone: "neutral"
                  })
                }
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
                {
                  name: "rolloutShelfCount",
                  label: { ru: "Выкатных полок", en: "" },
                  type: "number",
                  min: 1,
                  admin: {
                    condition: kindIs("hybrid"),
                    description: {
                      ru: "Выберите одно из значений, добавленных в разделе уровней.",
                      en: ""
                    }
                  }
                },
                {
                  name: "rolloutSide",
                  label: { ru: "Сторона (для выкатных)", en: "" },
                  type: "select",
                  options: [
                    { label: { ru: "Односторонний", en: "" }, value: "one" },
                    { label: { ru: "Двусторонний", en: "" }, value: "two" }
                  ],
                  admin: {
                    condition: kindIs("rollout"),
                    description: {
                      ru: "Двусторонний вариант доступен только если он разрешён в разделе «Консоль / ворота».",
                      en: ""
                    }
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
    admin: calculatorAdminUi,
    create: calculatorManagersOnly,
    delete: calculatorManagersOnly,
    read: calculatorReadersOnly,
    readVersions: calculatorReadersOnly,
    update: calculatorManagersOnly
  }
};
