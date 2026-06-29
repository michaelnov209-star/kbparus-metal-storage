"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, GraduationCap, MousePointerClick, X } from "lucide-react";

type Step = {
  title: string;
  text: string;
  target: string;
  placement: "top" | "right" | "bottom" | "left";
};

type PopoverPosition = {
  top: number;
  left: number;
  placement: Step["placement"];
};

const steps: Step[] = [
  {
    title: "Быстрые действия",
    text: "Начинайте отсюда: создать товар, загрузить фото, открыть заявки или быстро перейти к главной странице.",
    target: '[data-tour="quick-products"]',
    placement: "bottom"
  },
  {
    title: "Показатели сайта",
    text: "Карточки показывают объём каталога и заявок. По клику можно сразу перейти в нужный раздел.",
    target: '[data-tour="kpi-leads"]',
    placement: "bottom"
  },
  {
    title: "Главная страница",
    text: "Здесь редактируются блоки лендинга: hero, преимущества, кейсы, отзывы, партнёры и FAQ.",
    target: '[data-tour="card-home"]',
    placement: "right"
  },
  {
    title: "Каталог и товары",
    text: "Товарная карточка хранит фото, описание, режим цены и связь с конфигуратором, если он нужен.",
    target: '[data-tour="card-products"]',
    placement: "top"
  },
  {
    title: "Калькулятор",
    text: "Профили калькулятора отвечают за размеры, нагрузки, цены, коэффициенты и дополнительные опции.",
    target: '[data-tour="card-calculator"]',
    placement: "top"
  },
  {
    title: "Порядок публикации",
    text: "Сначала загрузите медиа, затем создайте товар, проверьте расчёт и только после этого публикуйте страницу.",
    target: '[data-tour="workflow"]',
    placement: "top"
  }
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPosition(target: Element, placement: Step["placement"]): PopoverPosition {
  const rect = target.getBoundingClientRect();
  const width = 360;
  const gap = 18;

  if (placement === "right") {
    return {
      top: clamp(rect.top + rect.height / 2 - 120, 18, window.innerHeight - 260),
      left: clamp(rect.right + gap, 18, window.innerWidth - width - 18),
      placement
    };
  }

  if (placement === "left") {
    return {
      top: clamp(rect.top + rect.height / 2 - 120, 18, window.innerHeight - 260),
      left: clamp(rect.left - width - gap, 18, window.innerWidth - width - 18),
      placement
    };
  }

  if (placement === "top") {
    return {
      top: clamp(rect.top - 246, 18, window.innerHeight - 260),
      left: clamp(rect.left + rect.width / 2 - width / 2, 18, window.innerWidth - width - 18),
      placement
    };
  }

  return {
    top: clamp(rect.bottom + gap, 18, window.innerHeight - 260),
    left: clamp(rect.left + rect.width / 2 - width / 2, 18, window.innerWidth - width - 18),
    placement
  };
}

export function AdminTraining() {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const [completed, setCompleted] = useState(false);

  const step = steps[stepIndex];
  const progress = useMemo(() => Math.round(((stepIndex + 1) / steps.length) * 100), [stepIndex]);

  useEffect(() => {
    setCompleted(window.localStorage.getItem("kb-admin-training-complete") === "true");
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const update = () => {
      const target = document.querySelector(step.target);
      document.querySelectorAll(".kb-admin-training-target").forEach((node) => {
        node.classList.remove("kb-admin-training-target");
      });

      if (!target) {
        setPosition({ top: 120, left: 24, placement: "bottom" });
        return;
      }

      target.classList.add("kb-admin-training-target");
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      window.setTimeout(() => setPosition(getPosition(target, step.placement)), 220);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      document.querySelectorAll(".kb-admin-training-target").forEach((node) => {
        node.classList.remove("kb-admin-training-target");
      });
    };
  }, [isOpen, step]);

  const start = () => {
    setStepIndex(0);
    setIsOpen(true);
  };

  const finish = () => {
    window.localStorage.setItem("kb-admin-training-complete", "true");
    setCompleted(true);
    setIsOpen(false);
  };

  return (
    <>
      <article className="kb-admin-training" data-tour="training-panel">
        <div className="kb-admin-dashboard__block-head">
          <span>
            <GraduationCap size={17} aria-hidden />
            Обучение
          </span>
          <strong>{completed ? "Пройдено" : "5 минут"}</strong>
        </div>
        <h3>Быстрый тур по админке</h3>
        <p>
          Покажет, где менять главную страницу, товары, медиа, заявки и настройки калькулятора. Подходит для первого
          входа менеджера.
        </p>
        <div className="kb-admin-training__actions">
          <button className="kb-admin-training__button" type="button" onClick={start}>
            <MousePointerClick size={16} aria-hidden />
            {completed ? "Повторить обучение" : "Начать обучение"}
          </button>
          <a className="kb-admin-training__link" href="/admin/collections/products">
            Открыть каталог
            <ArrowRight size={15} aria-hidden />
          </a>
        </div>
      </article>

      {isOpen && (
        <div className="kb-admin-training-overlay" role="dialog" aria-modal="true" aria-label="Обучение админке">
          <button className="kb-admin-training-overlay__backdrop" type="button" onClick={() => setIsOpen(false)}>
            <span>Закрыть обучение</span>
          </button>
          <div
            className="kb-admin-training-popover"
            data-placement={position?.placement ?? "bottom"}
            style={{
              top: position?.top ?? 120,
              left: position?.left ?? 24
            }}
          >
            <button className="kb-admin-training-popover__close" type="button" onClick={() => setIsOpen(false)}>
              <X size={16} aria-hidden />
              <span className="sr-only">Закрыть</span>
            </button>
            <div className="kb-admin-training-popover__top">
              <BookOpen size={18} aria-hidden />
              <span>
                Шаг {stepIndex + 1} из {steps.length}
              </span>
            </div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            <div className="kb-admin-training-popover__progress" aria-label={`Прогресс обучения ${progress}%`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="kb-admin-training-popover__controls">
              <button
                type="button"
                className="kb-admin-training-popover__ghost"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((value) => Math.max(value - 1, 0))}
              >
                <ArrowLeft size={15} aria-hidden />
                Назад
              </button>
              {stepIndex === steps.length - 1 ? (
                <button type="button" className="kb-admin-training-popover__primary" onClick={finish}>
                  <CheckCircle2 size={15} aria-hidden />
                  Завершить
                </button>
              ) : (
                <button
                  type="button"
                  className="kb-admin-training-popover__primary"
                  onClick={() => setStepIndex((value) => Math.min(value + 1, steps.length - 1))}
                >
                  Далее
                  <ArrowRight size={15} aria-hidden />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
