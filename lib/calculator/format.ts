export function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatRoundedRub(value: number) {
  const rounded = Math.round(value / 1_000) * 1_000;

  return formatRub(rounded);
}
