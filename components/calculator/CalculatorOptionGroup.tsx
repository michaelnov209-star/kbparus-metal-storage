"use client";

import { useId, useMemo } from "react";
import { Info } from "lucide-react";

function getFeaturedValues(values: readonly number[], active: number) {
  if (values.length <= 6) return values;

  const candidates = [
    values[0],
    values[Math.floor((values.length - 1) * 0.33)],
    values[Math.floor((values.length - 1) * 0.66)],
    values.at(-1),
    active
  ].filter((value): value is number => typeof value === "number");

  return values.filter((value) => new Set(candidates).has(value));
}

export function CalculatorOptionGroup({
  title,
  hint,
  unit,
  values,
  active,
  onSelect
}: {
  title: string;
  hint: string;
  unit: string;
  values: readonly number[];
  active: number;
  onSelect: (value: number) => void;
}) {
  const selectId = useId();
  const featuredValues = useMemo(
    () => getFeaturedValues(values, active),
    [active, values]
  );
  const hasExactSelect = values.length > featuredValues.length;

  return (
    <fieldset className="calc-option-group">
      <legend>{title}</legend>
      <p className="calc-option-hint">
        <Info aria-hidden="true" size={14} />
        {hint}
      </p>
      <div className="calc-chip-row">
        {featuredValues.map((value) => (
          <button
            aria-pressed={active === value}
            className={active === value ? "calc-chip is-active" : "calc-chip"}
            key={value}
            type="button"
            onClick={() => onSelect(value)}
          >
            {value.toLocaleString("ru-RU")} <em>{unit}</em>
          </button>
        ))}
      </div>
      {hasExactSelect && (
        <label className="calc-exact-select" htmlFor={selectId}>
          <span>Точное значение</span>
          <select
            id={selectId}
            value={active}
            onChange={(event) => onSelect(Number(event.target.value))}
          >
            {values.map((value) => (
              <option key={value} value={value}>
                {value.toLocaleString("ru-RU")} {unit}
              </option>
            ))}
          </select>
        </label>
      )}
    </fieldset>
  );
}
