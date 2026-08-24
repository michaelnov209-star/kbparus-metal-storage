"use client";

import { Info } from "lucide-react";
import { useId } from "react";
import styles from "./CalculatorV4.module.css";

export function CalculatorV4ChoiceField({
  title,
  hint,
  unit,
  values,
  active,
  layout = "standard",
  onSelect
}: {
  title: string;
  hint: string;
  unit: string;
  values: readonly number[];
  active: number;
  layout?: "standard" | "dimension";
  onSelect: (value: number) => void;
}) {
  const hintId = useId();

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

      <div
        className={styles.choiceGrid}
        data-count={values.length}
        data-layout={layout}
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
    </fieldset>
  );
}
