import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Field,
  FieldAccess
} from "payload";
import { createProductSlug } from "../../lib/cms/product-slug";
import { businessRowLabel } from "../admin/array-row-label";
import { adminSectionHero } from "../admin/section-hero";
import { adminGroups, adminHints } from "../admin/structure";
import {
  BOOLEAN_STATUS_CELL,
  type BooleanStatusLabels
} from "../admin/boolean-status";
import {
  canReadProductDrafts,
  getCmsRole,
  productCreatorsOnly,
  productEditorsOnly,
  productsAdminUi,
  publicReadProducts
} from "../access/rbac";
import {
  revalidateProductAfterChange,
  revalidateProductAfterDelete
} from "../hooks/revalidateProduct";
import { normalizeProductGallery } from "../hooks/normalizeProductGallery";
import {
  stampUpdatedBy,
  updatedByField,
  updatedBySnapshotFields
} from "../hooks/stampUpdatedBy";

const HELP_LABEL = {
  path: "@/app/(payload)/components/AdminHelpLabel",
  exportName: "AdminHelpLabel"
} as const;

type ProductFieldArea =
  | "content"
  | "media"
  | "pricing"
  | "publishing"
  | "restricted"
  | "seo"
  | "technical";

const productFieldAreas: Readonly<Record<string, ProductFieldArea>> = {
  applications: "technical",
  badge: "content",
  calculatorProfile: "pricing",
  category: "content",
  description: "content",
  documents: "media",
  draft: "restricted",
  featured: "publishing",
  gallery: "media",
  image: "media",
  includes: "technical",
  installationEnvironments: "technical",
  keywords: "seo",
  legacyGalleryPaths: "restricted",
  legacyImagePath: "restricted",
  loadingMethods: "technical",
  maxLoadKg: "technical",
  modelName: "technical",
  noIndex: "seo",
  ogImage: "seo",
  operationMode: "technical",
  overallDimensions: "technical",
  pageMode: "pricing",
  priceFrom: "pricing",
  priceLabel: "pricing",
  priceMode: "pricing",
  priceTo: "pricing",
  referenceUrl: "restricted",
  seoDescription: "seo",
  seoTitle: "seo",
  shortTitle: "content",
  sku: "content",
  slug: "content",
  sortOrder: "publishing",
  specs: "technical",
  storageMaterials: "technical",
  subcategory: "content",
  summary: "content",
  title: "content",
  warrantyMonths: "technical"
};

export function canUpdateProductField(
  user: unknown,
  area: ProductFieldArea
): boolean {
  const role = getCmsRole(user);
  if (role === "admin" || role === "editor") return true;
  if (role === "engineer") {
    return area === "pricing" || area === "technical";
  }
  if (role === "seo_marketer") {
    return (
      area === "content" ||
      area === "media" ||
      area === "publishing" ||
      area === "seo"
    );
  }
  return false;
}

const productFieldUpdateAccess =
  (area: ProductFieldArea): FieldAccess =>
  ({ req }) =>
    canUpdateProductField(req.user, area);

function applyProductRoleAccess(fields: Field[]): Field[] {
  return fields.map((field) => {
    if (field.type === "ui") return field;

    if ("name" in field && typeof field.name === "string") {
      if (field.access?.update) return field;

      return {
        ...field,
        access: {
          ...field.access,
          update: productFieldUpdateAccess(
            productFieldAreas[field.name] ?? "restricted"
          )
        }
      } as Field;
    }

    if (field.type === "tabs") {
      return {
        ...field,
        tabs: field.tabs.map((tab) => ({
          ...tab,
          fields: applyProductRoleAccess(tab.fields)
        }))
      };
    }

    if ("fields" in field && Array.isArray(field.fields)) {
      return {
        ...field,
        fields: applyProductRoleAccess(field.fields)
      } as Field;
    }

    return field;
  });
}

const protectProductPublishingFromEngineer: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req
}) => {
  if (
    operation !== "update" ||
    getCmsRole(req.user) !== "engineer" ||
    !data
  ) {
    return data;
  }

  if (
    "_status" in data &&
    data._status !== undefined &&
    data._status !== originalDoc?._status
  ) {
    delete data._status;
  }

  return data;
};

function help(
  text: string,
  width?: string,
  booleanStatus?: BooleanStatusLabels
) {
  return {
    ...(width ? { width } : {}),
    components: {
      Label: HELP_LABEL,
      ...(booleanStatus ? { Cell: BOOLEAN_STATUS_CELL } : {})
    },
    custom: {
      helpText: text,
      ...(booleanStatus ? { booleanStatus } : {})
    }
  };
}

const createUniqueProductSlug: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req
}) => {
  if (!data) return data;

  const originalSlug =
    originalDoc && typeof originalDoc.slug === "string" ? originalDoc.slug.trim() : "";
  const submittedSlug = typeof data.slug === "string" ? data.slug.trim() : "";
  const title = typeof data.title === "string" ? data.title.trim() : "";

  if (!data.shortTitle && title) {
    data.shortTitle = title.length > 72 ? `${title.slice(0, 69).trim()}…` : title;
  }

  if (operation === "update" && originalSlug) {
    data.slug = originalSlug;
    return data;
  }

  if (submittedSlug) {
    data.slug = submittedSlug;
    return data;
  }

  const baseSlug = createProductSlug(title);
  if (!baseSlug) return data;

  let candidate = baseSlug;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const existing = await req.payload.find({
      collection: "products",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { slug: { equals: candidate } }
    });

    if (existing.docs.length === 0) {
      data.slug = candidate;
      return data;
    }

    candidate = `${baseSlug}-${suffix}`;
  }

  data.slug = `${baseSlug}-${Date.now().toString(36)}`;
  return data;
};

const documentsField: Field = {
  name: "documents",
  label: { ru: "Файлы для скачивания", en: "Downloads" },
  labels: {
    singular: { ru: "Документ", en: "Document" },
    plural: { ru: "Документы", en: "Documents" }
  },
  type: "array",
  admin: {
    description: {
      ru: "Загрузите паспорт, инструкцию, каталог или чертёж в PDF. На странице товара появится понятная кнопка скачивания.",
      en: "Upload product PDFs for visitors."
    },
    initCollapsed: true,
    components: {
      RowLabel: businessRowLabel({
        fallback: "Новый документ",
        primaryFields: ["title"]
      })
    }
  },
  fields: [
    {
      name: "title",
      label: { ru: "Название для клиента", en: "Public title" },
      type: "text",
      required: true,
      admin: {
        placeholder: "Паспорт оборудования",
        ...help("Так эта кнопка будет называться на странице товара. Пишите по-человечески: «Паспорт», «Инструкция», «Каталог PDF».")
      }
    },
    {
      name: "file",
      label: { ru: "Загрузить файл", en: "File" },
      type: "upload",
      relationTo: "media",
      required: true,
      filterOptions: {
        mimeType: { equals: "application/pdf" }
      },
      admin: help("Выберите готовый PDF из медиатеки или загрузите новый файл. Публичные документы не должны содержать конфиденциальные данные.")
    },
    {
      name: "href",
      label: { ru: "Старая ссылка", en: "Legacy URL" },
      type: "text",
      admin: { hidden: true }
    }
  ]
};

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: { ru: "Товар", en: "Product" },
    plural: { ru: "Каталог: товары", en: "Products" }
  },
  admin: {
    group: adminGroups.catalog,
    components: {
      beforeList: [adminSectionHero("products")]
    },
    description: {
      ru: `${adminHints.catalog} Для новой карточки достаточно пройти пять понятных вкладок; адрес и технические поля сайт заполнит сам.`,
      en: "Concrete equipment models within categories."
    },
    useAsTitle: "title",
    defaultColumns: [
      "title",
      "category",
      "pageMode",
      "calculatorProfile",
      "_status"
    ],
    listSearchableFields: ["title", "shortTitle", "slug", "sku", "summary"],
    pagination: { defaultLimit: 20, limits: [10, 20, 50] }
  },
  hooks: {
    afterChange: [revalidateProductAfterChange],
    afterDelete: [revalidateProductAfterDelete],
    beforeChange: [protectProductPublishingFromEngineer, stampUpdatedBy],
    beforeValidate: [createUniqueProductSlug, normalizeProductGallery]
  },
  versions: { drafts: true },
  fields: applyProductRoleAccess([
    updatedByField(),
    ...updatedBySnapshotFields(),
    {
      name: "productEditorGuide",
      type: "ui",
      admin: {
        components: {
          Field: {
            path: "@/app/(payload)/components/ProductEditorGuide",
            exportName: "ProductEditorGuide"
          }
        }
      }
    },
    {
      name: "productLivePreview",
      type: "ui",
      admin: {
        components: {
          Field: {
            path: "@/app/(payload)/components/ProductLivePreview",
            exportName: "ProductLivePreview"
          }
        }
      }
    },
    {
      name: "slug",
      label: { ru: "Адрес товара в URL", en: "URL slug" },
      type: "text",
      required: true,
      unique: true,
      admin: {
        hidden: true,
        description: {
          ru: "Создаётся автоматически из названия и не меняется после публикации.",
          en: "Generated from the title and preserved after publication."
        }
      }
    },
    {
      type: "tabs",
      tabs: [
        {
          label: { ru: "1. Описание", en: "1. Description" },
          description: {
            ru: "Название, место в каталоге и понятное описание для клиента.",
            en: "Core product information."
          },
          fields: [
            {
              name: "title",
              label: { ru: "Название товара", en: "Title" },
              type: "text",
              required: true,
              admin: {
                placeholder: "Автоматизированная система хранения листового металла Compact",
                ...help("Полное коммерческое название. Оно станет главным заголовком страницы; адрес страницы сайт создаст автоматически.")
              }
            },
            {
              type: "row",
              fields: [
                {
                  name: "shortTitle",
                  label: { ru: "Короткое название", en: "Short title" },
                  type: "text",
                  admin: {
                    placeholder: "Compact 3000×1500",
                    ...help("Используется в компактных карточках и списках. Если оставить пустым, сайт возьмёт полное название.", "50%")
                  }
                },
                {
                  name: "sku",
                  label: { ru: "Артикул (если используется)", en: "SKU" },
                  type: "text",
                  admin: {
                    placeholder: "KBP-SHM-COMPACT",
                    ...help("Внутренний код модели для менеджеров и документов. Можно оставить пустым, если артикулов пока нет.", "50%")
                  }
                }
              ]
            },
            {
              type: "row",
              fields: [
                {
                  name: "category",
                  label: { ru: "Раздел каталога", en: "Category" },
                  type: "relationship",
                  relationTo: "categories",
                  required: true,
                  admin: help("Где товар будет показан на сайте. Например: «Консольные стеллажи».", "50%")
                },
                {
                  name: "subcategory",
                  label: { ru: "Подраздел (необязательно)", en: "Subcategory" },
                  type: "relationship",
                  relationTo: "subcategories",
                  admin: help("Используйте, только если внутри выбранного раздела уже есть дополнительное деление. В остальных случаях оставьте пустым.", "50%")
                }
              ]
            },
            {
              name: "badge",
              label: { ru: "Короткая метка на карточке", en: "Badge" },
              type: "text",
              admin: {
                placeholder: "Под погрузчик",
                ...help("Небольшая подпись над названием: «Автоматизированный», «Двусторонний», «До 5 тонн». Не повторяйте название товара.")
              }
            },
            {
              name: "summary",
              label: { ru: "Кратко: польза товара", en: "Summary" },
              type: "textarea",
              required: true,
              maxLength: 260,
              admin: {
                placeholder: "Компактно хранит листовой металл и быстро подаёт нужную кассету в рабочую зону.",
                ...help("Одно–два предложения для карточки каталога. Сначала результат для клиента, затем важное отличие модели.")
              }
            },
            {
              name: "description",
              label: { ru: "Подробное описание", en: "Description" },
              type: "textarea",
              required: true,
              admin: {
                rows: 7,
                placeholder: "Опишите задачу, принцип работы и кому подходит система…",
                ...help("Расскажите простым языком: какую проблему решает система, как работает и в каких условиях особенно полезна.")
              }
            }
          ]
        },
        {
          label: { ru: "2. Фото и файлы", en: "2. Media" },
          description: {
            ru: "Главное фото, галерея с разными ракурсами и документы для скачивания.",
            en: "Product media and downloads."
          },
          fields: [
            {
              name: "image",
              label: { ru: "Главное фото товара", en: "Primary product image" },
              type: "upload",
              relationTo: "media",
              required: true,
              filterOptions: {
                mimeType: { contains: "image/" }
              },
              admin: {
                description: {
                  ru: "Первое изображение в каталоге и на странице товара. Можно загрузить обычный JPG, PNG, WebP или AVIF — система сама уменьшит слишком большой оригинал и создаст быстрые WebP-версии для телефона, планшета и компьютера.",
                  en: "Primary product image."
                },
                ...help("Лучший вариант: чистый общий ракурс оборудования без текста и чужих логотипов, горизонтальный кадр не меньше 1600×1000.")
              }
            },
            {
              name: "gallery",
              label: { ru: "Галерея товара", en: "Product gallery" },
              labels: {
                singular: { ru: "Фотография", en: "Photo" },
                plural: { ru: "Фотографии", en: "Photos" }
              },
              type: "array",
              maxRows: 12,
              admin: {
                description: {
                  ru: "Здесь находятся дополнительные фото: другие ракурсы, важные узлы и оборудование в работе. Не добавляйте сюда обложку категории и не повторяйте главное фото. Все изображения сразу видны миниатюрами в предпросмотре; порядок можно менять перетаскиванием.",
                  en: "Additional product images."
                },
                initCollapsed: true,
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Дополнительное фото"
                  })
                }
              },
              fields: [
                {
                  name: "image",
                  label: { ru: "Выбрать или загрузить фото", en: "Image" },
                  type: "upload",
                  relationTo: "media",
                  required: true,
                  filterOptions: {
                    mimeType: { contains: "image/" }
                  },
                  admin: help("Не дублируйте главное фото. Лучше показать другой ракурс, узел конструкции, загрузку металла или работу оператора.")
                }
              ]
            },
            documentsField,
            {
              name: "legacyImagePath",
              label: { ru: "Служебный путь к фото", en: "Legacy image path" },
              type: "text",
              admin: { hidden: true }
            },
            {
              name: "legacyGalleryPaths",
              label: { ru: "Служебные пути галереи", en: "Legacy gallery paths" },
              labels: {
                singular: { ru: "Служебный путь фото", en: "Legacy photo path" },
                plural: { ru: "Служебные пути фото", en: "Legacy photo paths" }
              },
              type: "array",
              admin: {
                hidden: true,
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Служебный путь фото",
                    primaryFields: ["path"]
                  })
                }
              },
              fields: [{ name: "path", type: "text", required: true }]
            }
          ]
        },
        {
          label: { ru: "3. Цена и калькулятор", en: "3. Price" },
          description: {
            ru: "Как показывать стоимость и нужен ли на странице конфигуратор.",
            en: "Pricing and configurator."
          },
          fields: [
            {
              name: "priceMode",
              label: { ru: "Как показывать цену", en: "Price mode" },
              type: "select",
              options: [
                { label: { ru: "По запросу — менеджер уточнит параметры", en: "Request" }, value: "request" },
                { label: { ru: "Показывать ориентир «от … ₽»", en: "Fixed" }, value: "fixed" }
              ],
              defaultValue: "request",
              required: true,
              admin: help("Если точная стоимость зависит от проекта, оставьте «По запросу». Цену «от» ставьте только после подтверждения руководителем.")
            },
            {
              type: "row",
              fields: [
                {
                  name: "priceFrom",
                  label: { ru: "Стоимость от, ₽", en: "Price from" },
                  type: "number",
                  admin: {
                    condition: (data) => data?.priceMode === "fixed",
                    ...help("Минимальный реалистичный бюджет базовой комплектации без разделителей и пробелов.", "50%")
                  }
                },
                {
                  name: "priceTo",
                  label: { ru: "Стоимость до, ₽ (необязательно)", en: "Price to" },
                  type: "number",
                  admin: {
                    condition: (data) => data?.priceMode === "fixed",
                    ...help("Заполняйте только если нужен честный диапазон «от — до».", "50%")
                  }
                }
              ]
            },
            {
              name: "priceLabel",
              label: { ru: "Свой текст вместо цены (редко)", en: "Custom price label" },
              type: "text",
              admin: {
                condition: (data) => data?.priceMode === "fixed",
                ...help("Необязательное исключение: например, «После инженерного расчёта». Обычно оставляйте пустым.")
              }
            },
            {
              name: "pageMode",
              label: { ru: "Что показать на странице товара", en: "Page mode" },
              type: "select",
              options: [
                { label: { ru: "Обычная заявка на расчёт", en: "Standard" }, value: "standard" },
                { label: { ru: "Калькулятор с предварительной стоимостью", en: "Configurator" }, value: "configurator" }
              ],
              defaultValue: "standard",
              required: true,
              admin: help("Калькулятор включайте только для моделей, для которых уже создан и проверен профиль расчёта.")
            },
            {
              name: "calculatorProfile",
              label: {
                ru: "Калькулятор на странице товара",
                en: "Product calculator"
              },
              type: "relationship",
              relationTo: "calculator-profiles",
              validate: (
                value: unknown,
                { siblingData }: { siblingData?: Record<string, unknown> }
              ) => {
                const pageMode = (siblingData as { pageMode?: unknown } | undefined)
                  ?.pageMode;
                if (pageMode === "configurator" && !value) {
                  return "Выберите калькулятор, который должен открываться на странице этого товара.";
                }
                return true;
              },
              admin: {
                condition: (data) => data?.pageMode === "configurator",
                components: {
                  Label: HELP_LABEL,
                  Cell: {
                    path: "@/app/(payload)/components/ProductCalculatorProfileCell",
                    exportName: "ProductCalculatorProfileCell"
                  }
                },
                custom: {
                  helpText: "Выберите профиль с ценами и коэффициентами именно для этой модели. После выбора обязательно проверьте тестовый расчёт."
                }
              }
            },
            {
              name: "calculatorBindingStatus",
              type: "ui",
              admin: {
                components: {
                  Field: {
                    path: "@/app/(payload)/components/ProductCalculatorBindingStatus",
                    exportName: "ProductCalculatorBindingStatus"
                  }
                }
              }
            }
          ]
        },
        {
          label: { ru: "4. Характеристики", en: "4. Specifications" },
          description: {
            ru: "Где применяется, основные параметры и что проверит инженер.",
            en: "Structured product facts."
          },
          fields: [
            {
              type: "collapsible",
              label: { ru: "Основные параметры товара", en: "Core attributes" },
              admin: {
                initCollapsed: false,
                description: {
                  ru: "Поля как в сильных товарных кабинетах: помогают клиенту сравнивать оборудование и искать его по фильтрам.",
                  en: "Structured comparison attributes."
                }
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "modelName",
                      label: { ru: "Модель / серия", en: "Model" },
                      type: "text",
                      admin: {
                        placeholder: "Compact 3000×1500",
                        ...help("Короткое обозначение модели без повторения полного названия.", "50%")
                      }
                    },
                    {
                      name: "operationMode",
                      label: { ru: "Принцип работы", en: "Operation mode" },
                      type: "select",
                      options: [
                        { label: { ru: "Ручной", en: "Manual" }, value: "manual" },
                        { label: { ru: "Механизированный", en: "Mechanized" }, value: "mechanized" },
                        { label: { ru: "Автоматизированный", en: "Automated" }, value: "automated" }
                      ],
                      admin: help("Выберите, как материал выдаётся из системы в обычной работе.", "50%")
                    }
                  ]
                },
                {
                  name: "storageMaterials",
                  label: { ru: "Что можно хранить", en: "Stored materials" },
                  type: "select",
                  hasMany: true,
                  options: [
                    { label: { ru: "Листовой металл", en: "Sheet metal" }, value: "sheet-metal" },
                    { label: { ru: "Трубы", en: "Pipes" }, value: "pipes" },
                    { label: { ru: "Профиль и сортовой прокат", en: "Profiles" }, value: "profiles" },
                    { label: { ru: "Паллеты и тарные места", en: "Pallets" }, value: "pallets" },
                    { label: { ru: "Оснастка и штампы", en: "Tooling" }, value: "tooling" },
                    { label: { ru: "Инструмент и комплектующие", en: "Parts" }, value: "parts" },
                    { label: { ru: "Кабель и барабаны", en: "Cable" }, value: "cable" },
                    { label: { ru: "Смешанная номенклатура", en: "Mixed" }, value: "mixed" }
                  ],
                  admin: help("Можно выбрать несколько вариантов. Эти значения будут использоваться для сравнения и будущих фильтров каталога.")
                },
                {
                  name: "loadingMethods",
                  label: { ru: "Как загружается и обслуживается", en: "Loading methods" },
                  type: "select",
                  hasMany: true,
                  options: [
                    { label: { ru: "Вручную", en: "Manual" }, value: "manual" },
                    { label: { ru: "Погрузчиком", en: "Forklift" }, value: "forklift" },
                    { label: { ru: "Штабелером / ричтраком", en: "Stacker" }, value: "stacker" },
                    { label: { ru: "Кран-балкой", en: "Crane" }, value: "crane" },
                    { label: { ru: "Вакуумным захватом", en: "Vacuum lifter" }, value: "vacuum" },
                    { label: { ru: "Автоматическим экстрактором", en: "Extractor" }, value: "extractor" }
                  ],
                  admin: help("Выберите реальные способы загрузки. Не отмечайте варианты, которые требуют отдельной, отсутствующей комплектации.")
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "maxLoadKg",
                      label: { ru: "Максимальная рабочая нагрузка, кг", en: "Max load" },
                      type: "number",
                      min: 0,
                      admin: {
                        placeholder: "3000",
                        ...help("Укажите подтверждённую нагрузку на полку, кассету или уровень. Если значение зависит от проекта — оставьте пустым.", "50%")
                      }
                    },
                    {
                      name: "warrantyMonths",
                      label: { ru: "Гарантия, месяцев", en: "Warranty months" },
                      type: "number",
                      min: 0,
                      admin: {
                        placeholder: "12",
                        ...help("Заполняйте только по фактическим условиям договора или коммерческого предложения.", "50%")
                      }
                    }
                  ]
                },
                {
                  name: "overallDimensions",
                  label: { ru: "Габарит системы, мм (если типовой)", en: "Overall dimensions" },
                  type: "group",
                  admin: {
                    description: {
                      ru: "Для проектного оборудования можно оставить пустым и указать диапазоны ниже в характеристиках.",
                      en: "Leave empty for engineered-to-order systems."
                    }
                  },
                  fields: [
                    {
                      type: "row",
                      fields: [
                        { name: "lengthMm", label: { ru: "Длина", en: "Length" }, type: "number", min: 0, admin: { width: "33%" } },
                        { name: "widthMm", label: { ru: "Ширина", en: "Width" }, type: "number", min: 0, admin: { width: "33%" } },
                        { name: "heightMm", label: { ru: "Высота", en: "Height" }, type: "number", min: 0, admin: { width: "34%" } }
                      ]
                    }
                  ]
                },
                {
                  name: "installationEnvironments",
                  label: { ru: "Где устанавливается", en: "Installation environments" },
                  type: "select",
                  hasMany: true,
                  options: [
                    { label: { ru: "Производственный цех", en: "Workshop" }, value: "workshop" },
                    { label: { ru: "Закрытый склад", en: "Warehouse" }, value: "warehouse" },
                    { label: { ru: "Уличное исполнение под навесом", en: "Covered outdoor" }, value: "covered-outdoor" },
                    { label: { ru: "Уличное исполнение", en: "Outdoor" }, value: "outdoor" }
                  ],
                  admin: help("Отмечайте уличное исполнение только если конструкция и покрытие действительно рассчитаны на эти условия.")
                }
              ]
            },
            {
              name: "applications",
              label: { ru: "Где применяется", en: "Applications" },
              labels: {
                singular: { ru: "Сценарий применения", en: "Application" },
                plural: { ru: "Сценарии применения", en: "Applications" }
              },
              type: "array",
              admin: {
                description: { ru: "Один сценарий в каждой строке.", en: "One use case per row." },
                initCollapsed: true,
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новый сценарий применения",
                    primaryFields: ["value"]
                  })
                }
              },
              fields: [
                {
                  name: "value",
                  label: { ru: "Сценарий", en: "Use case" },
                  type: "text",
                  required: true,
                  admin: {
                    placeholder: "Участки лазерной и плазменной резки",
                    ...help("Пишите конкретное место или процесс, где система полезна. Не используйте общие фразы вроде «для бизнеса».")
                  }
                }
              ]
            },
            {
              name: "specs",
              label: { ru: "Технические характеристики", en: "Specifications" },
              labels: {
                singular: { ru: "Характеристика", en: "Specification" },
                plural: { ru: "Характеристики", en: "Specifications" }
              },
              type: "array",
              admin: {
                description: {
                  ru: "Слева — название параметра, справа — значение с единицей измерения.",
                  en: "Parameter and value pairs."
                },
                initCollapsed: true,
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новая характеристика",
                    primaryFields: ["label"],
                    secondaryFields: ["value"]
                  })
                }
              },
              fields: [
                {
                  name: "label",
                  label: { ru: "Параметр", en: "Parameter" },
                  type: "text",
                  required: true,
                  admin: { placeholder: "Нагрузка на полку или кассету", ...help("Короткое и понятное название без двоеточия.") }
                },
                {
                  name: "value",
                  label: { ru: "Значение", en: "Value" },
                  type: "text",
                  required: true,
                  admin: { placeholder: "до 3 000 кг", ...help("Обязательно укажите единицу измерения и слово «до», если это предельное значение.") }
                }
              ]
            },
            {
              name: "includes",
              label: { ru: "Что входит в подбор", en: "Included checks" },
              labels: {
                singular: { ru: "Пункт подбора", en: "Included item" },
                plural: { ru: "Пункты подбора", en: "Included items" }
              },
              type: "array",
              admin: {
                description: {
                  ru: "Что клиент получит или что инженер проверит перед предложением.",
                  en: "Deliverables and checks."
                },
                initCollapsed: true,
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новый пункт подбора",
                    primaryFields: ["value"]
                  })
                }
              },
              fields: [
                {
                  name: "value",
                  label: { ru: "Пункт", en: "Item" },
                  type: "text",
                  required: true,
                  admin: {
                    placeholder: "Проверка нагрузки на пол и опоры",
                    ...help("Начните с результата или действия: «расчёт», «проверка», «подбор», «схема».")
                  }
                }
              ]
            },
            {
              name: "referenceUrl",
              label: { ru: "Служебный источник", en: "Reference URL" },
              type: "text",
              admin: { hidden: true }
            }
          ]
        },
        {
          label: { ru: "5. Поиск и публикация", en: "5. SEO and publishing" },
          description: {
            ru: "Предпросмотр поисковой выдачи, видимость страницы и приоритет в каталоге.",
            en: "Search and publication settings."
          },
          fields: [
            {
              name: "seoPreview",
              type: "ui",
              admin: {
                components: {
                  Field: {
                    path: "@/app/(payload)/components/ProductSeoPreview",
                    exportName: "ProductSeoPreview"
                  }
                }
              }
            },
            {
              name: "seoTitle",
              label: { ru: "Заголовок в поиске (необязательно)", en: "SEO title" },
              type: "text",
              maxLength: 68,
              admin: {
                placeholder: "Консольные стеллажи для металла | КБ Парус",
                ...help("Оставьте пустым, чтобы использовать название товара. Если заполняете — укажите товар и основную потребность, до 60–68 символов.")
              }
            },
            {
              name: "seoDescription",
              label: { ru: "Описание в поиске (необязательно)", en: "SEO description" },
              type: "textarea",
              maxLength: 160,
              admin: {
                placeholder: "Проектирование и производство системы под вашу нагрузку, помещение и способ загрузки.",
                ...help("Одно полезное обещание: что это, для кого и какой следующий шаг. Не перечисляйте ключевые слова через запятую.")
              }
            },
            {
              name: "ogImage",
              label: { ru: "Фото для мессенджеров и соцсетей", en: "Social image" },
              type: "upload",
              relationTo: "media",
              filterOptions: {
                mimeType: { contains: "image/" }
              },
              admin: help("Картинка появится при отправке ссылки в Telegram и других сервисах. Если не выбрать, используется главное фото.")
            },
            {
              name: "keywords",
              label: { ru: "Поисковые темы для редакции", en: "Keywords" },
              labels: {
                singular: { ru: "Поисковая тема", en: "Keyword" },
                plural: { ru: "Поисковые темы", en: "Keywords" }
              },
              type: "array",
              admin: {
                description: {
                  ru: "Не влияют на ранжирование напрямую; помогают планировать текст страницы.",
                  en: "Editorial search themes."
                },
                initCollapsed: true,
                components: {
                  RowLabel: businessRowLabel({
                    fallback: "Новая поисковая тема",
                    primaryFields: ["value"]
                  })
                }
              },
              fields: [
                {
                  name: "value",
                  label: { ru: "Запрос или тема", en: "Keyword" },
                  type: "text",
                  required: true,
                  admin: {
                    placeholder: "стеллаж для листового металла",
                    ...help("Добавляйте одну естественную фразу в строке — так, как её мог бы искать клиент.")
                  }
                }
              ]
            },
            {
              name: "featuredGuide",
              type: "ui",
              admin: {
                components: {
                  Field: {
                    path: "@/app/(payload)/components/FeaturedPlacementGuide",
                    exportName: "FeaturedPlacementGuide"
                  }
                }
              }
            },
            {
              type: "row",
              fields: [
                {
                  name: "featured",
                  label: { ru: "Показывать первым в своей категории", en: "Featured" },
                  type: "checkbox",
                  defaultValue: false,
                  admin: help(
                    "Включённый товар поднимается выше обычных. Не отмечайте все товары: приоритет должен помогать клиенту выбрать.",
                    undefined,
                    {
                      trueLabel: "Показывается первым",
                      falseLabel: "Обычный порядок",
                      trueTone: "accent",
                      falseTone: "neutral"
                    }
                  )
                },
                {
                  name: "sortOrder",
                  label: { ru: "Порядок среди обычных товаров", en: "Sort order" },
                  type: "number",
                  defaultValue: 0,
                  admin: help("Меньшее число показывается раньше: 0, затем 10, затем 20. Если порядок не важен, оставьте 0.", "50%")
                }
              ]
            },
            {
              name: "noIndex",
              label: { ru: "Временно скрыть страницу от поисковиков", en: "No index" },
              type: "checkbox",
              defaultValue: false,
              admin: help(
                "Используйте для незавершённой или служебной страницы. Обычный опубликованный товар должен оставаться доступным поиску.",
                undefined,
                {
                  trueLabel: "Скрыта от поиска",
                  falseLabel: "Доступна поиску",
                  trueTone: "warning",
                  falseTone: "positive"
                }
              )
            },
            {
              name: "draft",
              label: { ru: "Устаревший признак черновика", en: "Legacy draft flag" },
              type: "checkbox",
              defaultValue: false,
              admin: { hidden: true }
            }
          ]
        }
      ]
    }
  ]),
  access: {
    admin: productsAdminUi,
    create: productCreatorsOnly,
    delete: productCreatorsOnly,
    read: publicReadProducts,
    readVersions: ({ req }) => canReadProductDrafts(req.user),
    update: productEditorsOnly
  }
};
