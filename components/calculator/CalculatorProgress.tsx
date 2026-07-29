"use client";

import { Check } from "lucide-react";

export function CalculatorProgress({
  currentStep,
  steps,
  summaries,
  price,
  onStepChange
}: {
  currentStep: number;
  steps: readonly string[];
  summaries: readonly string[];
  price: string;
  onStepChange: (step: number) => void;
}) {
  return (
    <nav className="calc-progress" aria-label="Этапы подбора">
      <div className="calc-steps">
        {steps.map((item, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;

          return (
            <button
              aria-current={isActive ? "step" : undefined}
              className={[
                isActive ? "is-active" : "",
                isComplete ? "is-complete" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              key={item}
              type="button"
              onClick={() => onStepChange(index)}
            >
              <span className="calc-step-marker" aria-hidden="true">
                {isComplete ? <Check size={15} /> : index + 1}
              </span>
              <span className="calc-step-copy">
                <strong>{item}</strong>
                <small>
                  {isComplete
                    ? summaries[index]
                    : isActive
                      ? "Сейчас"
                      : "Далее"}
                </small>
              </span>
            </button>
          );
        })}
      </div>
      <div className="calc-progress-quote" aria-label={`Ориентир по цене: от ${price} рублей`}>
        <small>Ориентир</small>
        <strong>от {price} ₽</strong>
        <span>обновляется сразу</span>
      </div>
      <div className="calc-progress-line" aria-hidden="true">
        <span style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
      </div>
    </nav>
  );
}
