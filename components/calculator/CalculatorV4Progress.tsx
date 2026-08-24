"use client";

import { Check } from "lucide-react";
import styles from "./CalculatorV4.module.css";

export function CalculatorV4Progress({
  currentStep,
  steps,
  price,
  onStepChange
}: {
  currentStep: number;
  steps: readonly string[];
  price: string;
  onStepChange: (step: number) => void;
}) {
  const safePrice = price.replace(/\s/g, "\u00a0");

  return (
    <nav className={styles.progress} aria-label="Этапы подбора">
      <div className={styles.stepList} data-count={steps.length}>
        {steps.map((label, index) => {
          const isActive = currentStep === index;
          const isComplete = index < currentStep;

          return (
            <button
              aria-current={isActive ? "step" : undefined}
              className={[
                styles.stepButton,
                isActive ? styles.isActive : "",
                isComplete ? styles.isComplete : ""
              ]
                .filter(Boolean)
                .join(" ")}
              key={label}
              type="button"
              onClick={() => onStepChange(index)}
            >
              <span className={styles.stepMarker} aria-hidden="true">
                {isComplete ? <Check size={14} /> : index + 1}
              </span>
              <span className={styles.stepLabel}>{label}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.progressPrice} aria-label={`Ориентир по цене: от ${price} рублей`}>
        <span>Ориентир</span>
        <strong>{`от\u00a0${safePrice}\u00a0₽`}</strong>
      </div>

      <div className={styles.progressLine} aria-hidden="true">
        <span style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
      </div>
    </nav>
  );
}
