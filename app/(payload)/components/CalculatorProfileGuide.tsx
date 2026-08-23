import {
  CircleAlert,
  FileSpreadsheet,
  PencilRuler,
  Rocket,
  ShieldCheck
} from "lucide-react";

import "./calculator-profile-editor.scss";

export function CalculatorProfileGuide() {
  return (
    <section className="kb-calculator-guide" aria-label="Как работают настройки калькулятора">
      <div className="kb-calculator-guide__head">
        <span><FileSpreadsheet size={18} aria-hidden /></span>
        <div>
          <strong>Система хранения для калькулятора</strong>
          <p>Каждая карточка содержит собственные размеры, нагрузки, цены и опции. Изменение одной системы не затрагивает остальные.</p>
        </div>
      </div>
      <div className="kb-calculator-guide__flow">
        <span><FileSpreadsheet size={15} aria-hidden /> 1. Основа и модель</span>
        <span><PencilRuler size={15} aria-hidden /> 2. Размеры и цены</span>
        <span><ShieldCheck size={15} aria-hidden /> 3. Проверка расчёта</span>
        <span><Rocket size={15} aria-hidden /> 4. Публикация</span>
      </div>
      <div className="kb-calculator-guide__notice">
        <CircleAlert size={16} aria-hidden />
        <span>Публикация доступна только после полной проверки параметров. Черновик не меняет расчёт на сайте и не попадает в заявки.</span>
      </div>
    </section>
  );
}
