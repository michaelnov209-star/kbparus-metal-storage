"use client";

import { Info } from "lucide-react";
import { type CSSProperties, useId } from "react";
import styles from "./CalculatorV4.module.css";

export function CalculatorV4ChoiceField({
  title,
  hint,
  unit,
  values,
  active,
  ruler = false,
  onSelect
}: {
  title: string;
  hint: string;
  unit: string;
  values: readonly number[];
  active: number;
  ruler?: boolean;
  onSelect: (value: number) => void;
}) {
  const useSelect = values.length > 8;
  const hintId = useId();
  const activeIndex = Math.max(0, values.indexOf(active));
  const progress =
    values.length > 1 ? (activeIndex / (values.length - 1)) * 100 : 0;
  const rangeClassName = ruler
    ? `${styles.rangeControl} ${styles.rulerRange}`
    : styles.rangeControl;

  return (
    <fieldset className={styles.choiceField}>
      <legend className={styles.visuallyHidden}>{title}</legend>
      <div className={styles.fieldHeading}>
        <div className={styles.fieldHeadingRow}>
          <strong>{title}</strong>
          <span className={styles.fieldHelp}>
            <button
              aria-describedby={hintId}
              aria-label={`Подсказка: ${title}`}
              className={styles.fieldHelpButton}
              type="button"
            >
              <Info aria-hidden="true" size={14} />
            </button>
            <span
              className={styles.fieldHelpPanel}
              id={hintId}
              role="tooltip"
            >
              {hint}
            </span>
          </span>
        </div>
      </div>

      {useSelect ? (
        <label className={styles.valueSelect}>
          <span>Выберите значение</span>
          <select
            aria-label={title}
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
      ) : (
        <div
          className={styles.choiceGrid}
          data-count={values.length}
          role="group"
          aria-label={title}
        >
          {values.map((value) => (
            <button
              aria-pressed={active === value}
              className={
                active === value
                  ? `${styles.choiceButton} ${styles.isActive}`
                  : styles.choiceButton
              }
              key={value}
              type="button"
              onClick={() => onSelect(value)}
            >
              <strong>{value.toLocaleString("ru-RU")}</strong>
              <span>{unit}</span>
            </button>
          ))}
        </div>
      )}

      {values.length > 1 && (
        <label className={rangeClassName}>
          <span className={styles.visuallyHidden}>{title}</span>
          <input
            aria-label={`${title}: ${active.toLocaleString("ru-RU")} ${unit}`}
            aria-valuetext={`${active.toLocaleString("ru-RU")} ${unit}`}
            max={values.length - 1}
            min={0}
            step={1}
            style={
              {
                "--range-progress": `${progress}%`
              } as CSSProperties
            }
            type="range"
            value={activeIndex}
            onChange={(event) =>
              onSelect(
                values[Number(event.target.value)] ?? values[0] ?? active
              )
            }
          />
          {ruler && (
            <span className={styles.rulerScale} aria-hidden="true">
              {values.map((value, index) => {
                const isEdge = index === 0 || index === values.length - 1;
                const isActive = value === active;
                const tickLeft =
                  values.length > 1 ? (index / (values.length - 1)) * 100 : 0;

                return (
                  <span
                    className={styles.rulerTick}
                    data-active={isActive ? "true" : undefined}
                    data-label={isEdge || isActive ? "true" : undefined}
                    key={value}
                    style={
                      {
                        "--tick-left": `${tickLeft}%`
                      } as CSSProperties
                    }
                  >
                    <i />
                    {(isEdge || isActive) && (
                      <b>
                        {value.toLocaleString("ru-RU")} {unit}
                      </b>
                    )}
                  </span>
                );
              })}
            </span>
          )}
          {!ruler && (
            <span className={styles.rangeLegend} aria-hidden="true">
              <small>
                {values[0]?.toLocaleString("ru-RU")} {unit}
              </small>
              <output>
                {active.toLocaleString("ru-RU")} {unit}
              </output>
              <small>
                {values.at(-1)?.toLocaleString("ru-RU")} {unit}
              </small>
            </span>
          )}
        </label>
      )}
    </fieldset>
  );
}
