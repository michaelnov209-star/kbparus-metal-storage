import type { ProductType } from "./types";

export type CalculatorProfileId =
  | "auto-sheet-metal"
  | "auto-sort-metal"
  | "rollout-cassette-rack"
  | "forklift-cassette-rack"
  | "two-side-rollout-rack"
  | "hybrid-rollout-rack";

export interface FactorOption {
  value: number;
  factor: number;
  label?: string;
}

export interface PriceOption {
  value: number;
  price: number;
  label?: string;
}

export interface CalculatorOption {
  id: string;
  title: string;
  price: number;
  defaultSelected?: boolean;
}

export interface CalculatorProfile {
  id: CalculatorProfileId;
  title: string;
  shortTitle: string;
  sourceSheet: string;
  productType: ProductType;
  description: string;
  heightOptions: readonly FactorOption[];
  widthOptions: readonly FactorOption[];
  lengthOptions: readonly FactorOption[];
  loadOptions: readonly PriceOption[];
  shelfCountOptions: readonly number[];
  rolloutShelfCountOptions?: readonly number[];
  towerCountOptions: readonly number[];
  defaultValues: {
    heightMm: number;
    widthMm: number;
    lengthMm: number;
    loadKg: number;
    shelfCount: number;
    rolloutShelfCount?: number;
    towerCount: number;
    rolloutSide?: "one" | "two";
  };
  pricing:
    | {
        kind: "automatic";
        towerPricesByShelfCount: Readonly<Record<number, number>>;
        consoleBasePrice: number;
        consoleLongFactor: number;
      }
    | {
        kind: "forkliftCassette";
        towerBasePrice: number;
        towerBaseShelfCount: number;
        towerExtraShelfFactor: number;
      }
    | {
        kind: "rollout";
        towerBasePrice: number;
        gateBasePrice: number;
        baseShelfCount: number;
        extraShelfFactor: number;
        sides?: readonly { value: "one" | "two"; label: string }[];
      }
    | {
        kind: "hybrid";
        forkliftLoadOptions: readonly PriceOption[];
        rolloutLoadOptions: readonly PriceOption[];
        fixedTowerAndGatePrice: number;
      };
  options: readonly CalculatorOption[];
}

const sheetGeometry = {
  heightOptions: [
    { value: 70, factor: 1 },
    { value: 100, factor: 1.1 },
    { value: 120, factor: 1.15 },
    { value: 150, factor: 1.15 },
    { value: 200, factor: 1.15 },
    { value: 250, factor: 1.2 },
    { value: 300, factor: 1.25 }
  ],
  widthOptions: [
    { value: 1300, factor: 1 },
    { value: 1600, factor: 1.1 },
    { value: 2100, factor: 1.2 }
  ],
  lengthOptions: [
    { value: 2600, factor: 1 },
    { value: 3100, factor: 1.1 },
    { value: 6100, factor: 2.2 }
  ]
} as const;

const automaticLoadOptions = [
  { value: 1500, price: 75000 },
  { value: 2000, price: 90000 },
  { value: 2500, price: 112500 },
  { value: 3000, price: 135000 },
  { value: 4000, price: 150000 },
  { value: 5000, price: 187500 }
] as const;

const rolloutLoadOptions = [
  { value: 1500, price: 45000 },
  { value: 2000, price: 49500 },
  { value: 2500, price: 54000 },
  { value: 3000, price: 58500 },
  { value: 4000, price: 63000 },
  { value: 5000, price: 67500 }
] as const;

const forkliftLoadOptions = [
  { value: 1500, price: 25000 },
  { value: 2000, price: 30000 },
  { value: 2500, price: 37500 },
  { value: 3000, price: 45000 },
  { value: 4000, price: 50000 },
  { value: 5000, price: 62500 }
] as const;

const automaticTowerPrices = {
  8: 1500000,
  10: 1500000,
  15: 1800000,
  20: 1950000,
  25: 2250000
} as const;

const automaticOptions = [
  { id: "scale", title: "Весы на распалетчик", price: 3 },
  { id: "infrared-safety", title: "Инфракрасные ограждения", price: 80000 },
  { id: "vacuum-grip", title: "Вакуумный захват", price: 450000 },
  { id: "swing-crane", title: "Консольно-поворотный кран", price: 500000 },
  { id: "warehouse-accounting", title: "Интеграция со складским учётом", price: 350000 }
] satisfies CalculatorOption[];

const rolloutOptions = [
  { id: "scale", title: "Весы на распалетчик", price: 3 },
  { id: "vacuum-grip", title: "Вакуумный захват", price: 450000 },
  { id: "swing-crane", title: "Консольно-поворотный кран", price: 500000 }
] satisfies CalculatorOption[];

export const calculatorProfiles: CalculatorProfile[] = [
  {
    id: "auto-sheet-metal",
    title: "Автоматизированный склад листового металла",
    shortTitle: "Автоматический склад листа",
    sourceSheet: "Авт.скл. лист. металл",
    productType: "automated",
    description: "Башенная система для листового металла с подъёмным модулем, опциями безопасности и выдачи.",
    ...sheetGeometry,
    loadOptions: automaticLoadOptions,
    shelfCountOptions: [10, 15, 20, 25],
    towerCountOptions: [1, 2, 3, 4, 5, 6],
    defaultValues: {
      heightMm: 70,
      widthMm: 1600,
      lengthMm: 3100,
      loadKg: 2000,
      shelfCount: 20,
      towerCount: 1
    },
    pricing: {
      kind: "automatic",
      towerPricesByShelfCount: automaticTowerPrices,
      consoleBasePrice: 1800000,
      consoleLongFactor: 1.2
    },
    options: automaticOptions.map((option) => ({
      ...option,
      defaultSelected: ["scale", "infrared-safety", "vacuum-grip", "swing-crane"].includes(option.id)
    }))
  },
  {
    id: "auto-sort-metal",
    title: "Автоматизированный склад сортового и трубного металлопроката",
    shortTitle: "Автоматический склад сортового металла",
    sourceSheet: "Авт.скл.сорт мет.",
    productType: "automated",
    description: "Автоматизированная система для длинномера, труб, профиля и сортового проката.",
    heightOptions: [
      { value: 300, factor: 1 },
      { value: 400, factor: 1.1 },
      { value: 600, factor: 1.15 },
      { value: 800, factor: 1.15 },
      { value: 1000, factor: 1.15 }
    ],
    widthOptions: [
      { value: 300, factor: 1 },
      { value: 400, factor: 1.1 },
      { value: 600, factor: 1.2 },
      { value: 800, factor: 1.2 },
      { value: 1000, factor: 1.2 }
    ],
    lengthOptions: [
      { value: 2600, factor: 1 },
      { value: 3100, factor: 1.1 },
      { value: 6100, factor: 2.2 },
      { value: 12100, factor: 2.2 }
    ],
    loadOptions: automaticLoadOptions,
    shelfCountOptions: [8, 15, 20, 25],
    towerCountOptions: [1, 2, 3, 4, 5, 6],
    defaultValues: {
      heightMm: 400,
      widthMm: 400,
      lengthMm: 6100,
      loadKg: 3000,
      shelfCount: 8,
      towerCount: 4
    },
    pricing: {
      kind: "automatic",
      towerPricesByShelfCount: automaticTowerPrices,
      consoleBasePrice: 1800000,
      consoleLongFactor: 1.2
    },
    options: automaticOptions
  },
  {
    id: "rollout-cassette-rack",
    title: "Стеллаж с выкатными кассетами",
    shortTitle: "Выкатные кассеты",
    sourceSheet: "Стеллаж с выкатными кассетами",
    productType: "rollout",
    description: "Система для листа и пачек, где каждая кассета выдвигается для прямого доступа.",
    ...sheetGeometry,
    loadOptions: rolloutLoadOptions,
    shelfCountOptions: [5, 6, 7, 8, 9, 10],
    towerCountOptions: [1, 2, 3, 4, 5, 6],
    defaultValues: {
      heightMm: 150,
      widthMm: 1600,
      lengthMm: 3100,
      loadKg: 3000,
      shelfCount: 7,
      towerCount: 1
    },
    pricing: {
      kind: "rollout",
      towerBasePrice: 100000,
      gateBasePrice: 120000,
      baseShelfCount: 5,
      extraShelfFactor: 0.1
    },
    options: rolloutOptions.map((option) => ({
      ...option,
      defaultSelected: ["vacuum-grip", "swing-crane"].includes(option.id)
    }))
  },
  {
    id: "forklift-cassette-rack",
    title: "Кассетный стеллаж под погрузчик",
    shortTitle: "Кассеты под погрузчик",
    sourceSheet: "Касетный под погрузчик",
    productType: "cassette",
    description: "Кассетное хранение листа с обслуживанием погрузчиком без сложной автоматики.",
    ...sheetGeometry,
    loadOptions: forkliftLoadOptions,
    shelfCountOptions: [5, 10, 15, 20, 25],
    towerCountOptions: [1, 2, 3, 4, 5, 6],
    defaultValues: {
      heightMm: 200,
      widthMm: 1600,
      lengthMm: 3100,
      loadKg: 2000,
      shelfCount: 10,
      towerCount: 1
    },
    pricing: {
      kind: "forkliftCassette",
      towerBasePrice: 100000,
      towerBaseShelfCount: 5,
      towerExtraShelfFactor: 0.1
    },
    options: rolloutOptions
  },
  {
    id: "two-side-rollout-rack",
    title: "Двухсторонний стеллаж с выкатными кассетами",
    shortTitle: "Двухсторонние кассеты",
    sourceSheet: "Двухсторонний стеллаж с вык. к.",
    productType: "rollout",
    description: "Выкатные кассеты с обслуживанием с одной или двух сторон склада.",
    ...sheetGeometry,
    loadOptions: rolloutLoadOptions,
    shelfCountOptions: [5, 6, 7, 8, 9, 10],
    towerCountOptions: [1, 2, 3, 4, 5, 6],
    defaultValues: {
      heightMm: 150,
      widthMm: 1600,
      lengthMm: 3100,
      loadKg: 2000,
      shelfCount: 7,
      towerCount: 1,
      rolloutSide: "two"
    },
    pricing: {
      kind: "rollout",
      towerBasePrice: 100000,
      gateBasePrice: 120000,
      baseShelfCount: 5,
      extraShelfFactor: 0.1,
      sides: [
        { value: "one", label: "Выкат с одной стороны" },
        { value: "two", label: "Выкат с двух сторон" }
      ]
    },
    options: rolloutOptions
  },
  {
    id: "hybrid-rollout-rack",
    title: "Гибридный стеллаж с выкатными кассетами",
    shortTitle: "Гибридный стеллаж",
    sourceSheet: "Гибридный стеллаж",
    productType: "hybrid",
    description: "Комбинация полок под погрузчик и выкатных кассет в одной системе.",
    ...sheetGeometry,
    loadOptions: forkliftLoadOptions,
    shelfCountOptions: [1, 3, 5, 7, 10, 15, 20],
    rolloutShelfCountOptions: [5, 6, 7, 8, 9, 10],
    towerCountOptions: [1, 2, 3, 4, 5, 6],
    defaultValues: {
      heightMm: 150,
      widthMm: 1600,
      lengthMm: 3100,
      loadKg: 2500,
      shelfCount: 7,
      rolloutShelfCount: 10,
      towerCount: 1
    },
    pricing: {
      kind: "hybrid",
      forkliftLoadOptions,
      rolloutLoadOptions,
      fixedTowerAndGatePrice: 400000
    },
    options: rolloutOptions
  }
];

export const defaultCalculatorProfileId: CalculatorProfileId = "auto-sheet-metal";

export function getCalculatorProfile(id?: string) {
  return calculatorProfiles.find((profile) => profile.id === id) ?? calculatorProfiles[0];
}
