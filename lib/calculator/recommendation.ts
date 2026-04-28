import type { CalculatorInput, RecommendedConfig } from "./types";

export function recommendStorageSystem(input: CalculatorInput): RecommendedConfig {
  if (input.execution === "automatic") {
    const isSheet = input.material === "sheet";
    return {
      productType: "automated",
      title: isSheet ? "Автоматизированный склад листового металла" : "Автоматизированный склад сортового проката",
      rationale: [
        "Вы выбрали автоматическую систему, поэтому важны контроль остатков, безопасность и скорость выдачи.",
        input.loadingMethod === "crane" ? "Кран-балка хорошо сочетается с башенной системой и зоной выдачи." : "Система проектируется под механизированную загрузку."
      ],
      keyParameters: [
        `Длина материала: ${input.materialLengthMm} мм`,
        `Нагрузка: ${input.loadKg} кг`,
        `Башни: ${input.towerCount}`,
        `Полки: ${input.shelfCount}`
      ],
      engineerQuestions: [
        "Нужна ли интеграция с лазером, плазмой, гильотиной или учётом 1С?",
        "Какие ограничения по высоте пролёта и зоне обслуживания?",
        "Какой фактический список артикулов и оборачиваемость?"
      ]
    };
  }

  if (input.needsRolloutCassettes || input.cassetteCount > 0) {
    return {
      productType: input.material === "mixed" ? "hybrid" : "rollout",
      title: input.material === "mixed" ? "Гибридный стеллаж с выкатными кассетами" : "Стеллаж с выкатными кассетами",
      rationale: [
        "Выкатные кассеты дают прямой доступ к каждой партии без лишней перекладки.",
        "Подходит для цеха, где важна скорость выбора листа и безопасность загрузки."
      ],
      keyParameters: [
        `Кассеты: ${Math.max(input.cassetteCount, 1)}`,
        `Полки: ${input.shelfCount}`,
        `Габарит поля: ${input.lengthMm} x ${input.widthMm} мм`,
        `Нагрузка: ${input.loadKg} кг`
      ],
      engineerQuestions: [
        "Нужно ли двустороннее исполнение?",
        "Какая техника обслуживает кассеты?",
        "Нужны ли фиксаторы, ограничители и маркировка ячеек?"
      ]
    };
  }

  if (input.material === "sheet") {
    return {
      productType: input.loadingMethod === "forklift" ? "cassette" : "vertical",
      title: input.loadingMethod === "forklift" ? "Кассетный стеллаж под погрузчик" : "Вертикальная система хранения листа",
      rationale: [
        "Листовой металл требует защиты от повреждений и понятного доступа к партиям.",
        input.loadingMethod === "forklift" ? "Погрузчик позволяет обслуживать кассеты без сложной автоматики." : "Вертикальное хранение экономит площадь и ускоряет визуальный выбор."
      ],
      keyParameters: [`Ширина листа: ${input.sheetWidthMm} мм`, `Объём хранения: ${input.totalStorageWeightKg} кг`, `Помещение: ${input.facility}`],
      engineerQuestions: ["Какой максимальный формат листа?", "Есть ли ограничения по проходам?", "Как часто меняются партии?"]
    };
  }

  if (input.material === "pipe" || input.material === "profile" || input.material === "longProduct") {
    return {
      productType: "cantilever",
      title: "Консольный стеллаж для длинномерного металла",
      rationale: [
        "Трубы, профиль и сортовой прокат удобнее хранить на консолях или в ячеистой структуре.",
        "Конструкция подбирается по длине, нагрузке на ярус и способу загрузки."
      ],
      keyParameters: [`Длина: ${input.materialLengthMm} мм`, `Нагрузка: ${input.loadKg} кг`, `Способ загрузки: ${input.loadingMethod}`],
      engineerQuestions: ["Нужно одностороннее или двухстороннее исполнение?", "Какая максимальная связка по весу?", "Нужны ли разделители по номенклатуре?"]
    };
  }

  return {
    productType: "custom",
    title: "Индивидуальная система хранения металла",
    rationale: [
      "Для смешанной номенклатуры нужна комбинированная схема: кассеты, консоли и адресные зоны.",
      "Инженер уточнит поток материалов и предложит конфигурацию под помещение."
    ],
    keyParameters: [`Объём: ${input.totalStorageWeightKg} кг`, `Вместимость: ${input.desiredCapacity}`, `Город: ${input.city || "уточняется"}`],
    engineerQuestions: ["Какие группы металла самые частые?", "Какая техника уже есть на площадке?", "Нужен ли учёт остатков?"]
  };
}
