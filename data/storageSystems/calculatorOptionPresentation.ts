export interface CalculatorOptionPresentation {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

export const calculatorOptionPresentation: Readonly<
  Record<string, CalculatorOptionPresentation>
> = {
  scale: {
    title: "Контроль веса на загрузочной станции",
    description:
      "Система фиксирует массу пачки при загрузке и помогает не превысить расчётную нагрузку на полку.",
    image: "/assets/images/calculator/options/loading-station-scale.webp",
    imageAlt:
      "Взвешивание пачки листового металла на загрузочной станции автоматического стеллажа"
  },
  "infrared-safety": {
    title: "Световой защитный барьер",
    description:
      "Световая завеса контролирует вход в рабочую зону и останавливает движение при пересечении лучей.",
    image: "/assets/images/calculator/options/safety-light-barrier.webp",
    imageAlt:
      "Световой защитный барьер перед загрузочной зоной автоматического стеллажа"
  },
  "vacuum-grip": {
    title: "Вакуумный захват листа",
    description:
      "Траверса с вакуумными присосками переносит отдельные листы без ручной строповки и повреждения поверхности.",
    image: "/assets/images/calculator/options/vacuum-sheet-lifter.webp",
    imageAlt: "Вакуумная траверса для подъёма листового металла"
  },
  "swing-crane": {
    title: "Консольно-поворотный кран",
    description:
      "Кран обслуживает загрузочную зону и помогает перемещать листы, захват или оснастку рядом со стеллажом.",
    image: "/assets/images/calculator/options/slewing-jib-crane.webp",
    imageAlt: "Консольно-поворотный кран с электрической талью"
  },
  "warehouse-accounting": {
    title: "Интеграция со складским учётом",
    description:
      "Остатки, ячейки и задания можно передавать в 1С, ERP или WMS, чтобы оператор видел актуальные данные.",
    image: "/assets/images/calculator/options/warehouse-system-integration.webp",
    imageAlt:
      "Русскоязычная система складского учёта рядом с автоматическим стеллажом листового металла"
  }
};
