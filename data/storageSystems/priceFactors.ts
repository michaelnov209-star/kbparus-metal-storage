export const priceFactors = {
  height: [
    { value: 70, factor: 1 },
    { value: 100, factor: 1.1 },
    { value: 120, factor: 1.15 },
    { value: 150, factor: 1.15 },
    { value: 200, factor: 1.15 },
    { value: 250, factor: 1.2 },
    { value: 300, factor: 1.25 },
    { value: 600, factor: 1 },
    { value: 800, factor: 1.1 },
    { value: 1000, factor: 1.15 }
  ],
  width: [
    { value: 600, factor: 1 },
    { value: 800, factor: 1.1 },
    { value: 1000, factor: 1.15 },
    { value: 1300, factor: 1 },
    { value: 1600, factor: 1.1 },
    { value: 2100, factor: 1.2 }
  ],
  length: [
    { value: 2600, factor: 1 },
    { value: 3100, factor: 1.1 },
    { value: 6100, factor: 2.2 }
  ],
  load: [
    { value: 1500, factor: 1 },
    { value: 2000, factor: 1.2 },
    { value: 2500, factor: 1.5 },
    { value: 3000, factor: 1.8 },
    { value: 4000, factor: 2 },
    { value: 5000, factor: 2.5 }
  ],
  rolloutLoad: [
    { value: 1500, factor: 1 },
    { value: 2000, factor: 1.1 },
    { value: 2500, factor: 1.2 },
    { value: 3000, factor: 1.3 },
    { value: 4000, factor: 1.4 },
    { value: 5000, factor: 1.5 }
  ],
  shelvesPerTower: [
    { value: 5, factor: 1 },
    { value: 10, factor: 1 },
    { value: 15, factor: 1.2 },
    { value: 20, factor: 1.3 },
    { value: 25, factor: 1.5 }
  ],
  basePrices: {
    automaticShelf: 75000,
    automaticTower: 1500000,
    automaticConsole: 1800000,
    forkliftShelf: 25000,
    forkliftTower: 100000,
    rolloutShelf: 45000,
    rolloutTower: 100000,
    gate: 80000,
    mounting: 180000,
    deliveryBase: 95000,
    painting: 120000,
    outdoorExecution: 160000,
    integration: 450000
  },
  longShelfFactor: {
    thresholdMm: 3100,
    factor: 1.2
  },
  range: {
    low: 0.84,
    high: 1.18
  }
} as const;
