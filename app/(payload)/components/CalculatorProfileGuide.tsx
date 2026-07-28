import { CircleAlert, FileSpreadsheet, Send, ShieldCheck } from "lucide-react";

export function CalculatorProfileGuide() {
  return (
    <section className="kb-calculator-guide" aria-label="Как работают настройки калькулятора">
      <div className="kb-calculator-guide__head">
        <span><FileSpreadsheet size={18} aria-hidden /></span>
        <div>
          <strong>Единый профиль расчёта</strong>
          <p>Сохранённые цены, коэффициенты и опции используются на сайте, в серверной проверке заявки и в Telegram-уведомлении.</p>
        </div>
      </div>
      <div className="kb-calculator-guide__flow">
        <span><ShieldCheck size={15} aria-hidden /> Проверка значений</span>
        <span>Калькулятор на сайте</span>
        <span><Send size={15} aria-hidden /> Заявка менеджеру</span>
      </div>
      <div className="kb-calculator-guide__notice">
        <CircleAlert size={16} aria-hidden />
        <span>Меняйте только подтверждённые руководителем значения. Формула расчёта и допустимые наборы полок/башен защищены в коде; спорные формулы исходного Excel не импортируются автоматически.</span>
      </div>
    </section>
  );
}