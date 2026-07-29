"use client";

import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  GraduationCap,
  MousePointerClick,
  Sparkles,
  X
} from "lucide-react";

import type { CmsRole } from "@/payload/access/rbac";
import {
  getTrainingConnectorGeometry,
  getTrainingPopoverPosition,
  type TrainingPlacement,
  type TrainingPopoverPosition,
  type TrainingRect,
  type TrainingSize
} from "./adminTrainingGeometry";

type Step = {
  title: string;
  text: string;
  target: string;
  placement: TrainingPlacement;
};

type TourDefinition = {
  label: string;
  duration: string;
  intro: string;
  steps: Step[];
};

const TOUR_VERSION = "3";
const POPOVER_WIDTH = 390;
const POPOVER_HEIGHT = 310;
const SPOTLIGHT_GAP = 8;

const tours: Record<CmsRole, TourDefinition> = {
  admin: {
    label: "Администратор",
    duration: "4 минуты",
    intro: "Заявки, аналитика, интеграции и контроль состояния сайта — без обхода всех разделов вручную.",
    steps: [
      {
        title: "Ваш центр управления",
        text: "На этом экране собраны ежедневные действия, показатели сайта и состояние ключевых сервисов.",
        target: '[data-tour="dashboard-hero"]',
        placement: "bottom"
      },
      {
        title: "Действия без лишних переходов",
        text: "Отсюда можно сразу создать товар, загрузить файл или открыть новые обращения клиентов.",
        target: '[data-tour="quick-actions"]',
        placement: "bottom"
      },
      {
        title: "Все заявки в одном месте",
        text: "Счётчик ведёт в журнал заявок. В карточке видны источник, расчёт клиента и статус доставки в Telegram и почту.",
        target: '[data-tour="metric-leads"]',
        placement: "bottom"
      },
      {
        title: "Рабочие разделы",
        text: "Контент, каталог, калькулятор, заявки и контакты сгруппированы по задачам — не по внутреннему устройству CMS.",
        target: '[data-tour="workspace"]',
        placement: "top"
      },
      {
        title: "Здоровье сайта",
        text: "Здесь проверяются база, заявки, Telegram, почта и аналитика. История изменений помогает быстро найти причину сбоя.",
        target: '[data-tour="system-panel"]',
        placement: "left"
      },
      {
        title: "SEO и конверсии",
        text: "Отчёт показывает поисковые запросы, позиции, клики, цели и конверсии за выбранный период.",
        target: '[data-tour="nav-seo"]',
        placement: "right"
      },
      {
        title: "Интеграции",
        text: "В этом разделе можно проверить подключённые каналы и увидеть понятный статус каждого сервиса.",
        target: '[data-tour="nav-integrations"]',
        placement: "right"
      }
    ]
  },
  editor: {
    label: "Редактор контента",
    duration: "3 минуты",
    intro: "Главная страница, каталог и калькулятор — в порядке, который понятен редактору.",
    steps: [
      {
        title: "Рабочий обзор",
        text: "На главном экране видны только доступные вам разделы и безопасные быстрые действия.",
        target: '[data-tour="dashboard-hero"]',
        placement: "bottom"
      },
      {
        title: "Быстрая публикация",
        text: "Создайте товар или загрузите изображение прямо отсюда. Перед публикацией проверьте карточку на сайте.",
        target: '[data-tour="quick-actions"]',
        placement: "bottom"
      },
      {
        title: "Главная страница",
        text: "Здесь редактируются первый экран, преимущества, блок доверия, вопросы и призывы к действию.",
        target: '[data-tour="card-home"]',
        placement: "top"
      },
      {
        title: "Каталог и товары",
        text: "Сначала выберите категорию, затем заполните карточку товара, изображения, характеристики и режим цены.",
        target: '[data-tour="card-products"]',
        placement: "top"
      },
      {
        title: "Калькулятор",
        text: "Меняйте цены и коэффициенты только по согласованному расчёту. Тестовый пример покажет итог до публикации.",
        target: '[data-tour="card-calculator"]',
        placement: "top"
      },
      {
        title: "Поисковая видимость",
        text: "SEO-отчёт помогает увидеть, какие страницы и запросы уже приводят посетителей.",
        target: '[data-tour="nav-seo"]',
        placement: "right"
      }
    ]
  },
  photographer: {
    label: "Медиа-менеджер",
    duration: "2 минуты",
    intro: "Быстрая загрузка, понятные названия и изображения, которые не замедляют сайт.",
    steps: [
      {
        title: "Ваше рабочее пространство",
        text: "Для медиа-роли оставлены только нужные действия и разделы — без лишних настроек.",
        target: '[data-tour="dashboard-hero"]',
        placement: "bottom"
      },
      {
        title: "Загрузить изображение",
        text: "Добавьте понятное название, alt-текст и отметьте файл как доступный на публичном сайте.",
        target: '[data-tour="quick-actions"]',
        placement: "bottom"
      },
      {
        title: "Медиабиблиотека",
        text: "Здесь хранятся фото, видео и документы. Используйте один файл повторно, чтобы не создавать дубликаты.",
        target: '[data-tour="card-media"]',
        placement: "top"
      }
    ]
  }
};

function toViewportRect(rect: DOMRect): TrainingRect {
  const top = Math.max(rect.top - SPOTLIGHT_GAP, 8);
  const left = Math.max(rect.left - SPOTLIGHT_GAP, 8);
  const right = Math.min(rect.right + SPOTLIGHT_GAP, window.innerWidth - 8);
  const bottom = Math.min(rect.bottom + SPOTLIGHT_GAP, window.innerHeight - 8);

  return {
    top,
    left,
    right,
    bottom,
    width: Math.max(right - left, 0),
    height: Math.max(bottom - top, 0)
  };
}

export function AdminTraining({ role }: { role: CmsRole }) {
  const tour = tours[role];
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TrainingRect | null>(null);
  const [position, setPosition] = useState<TrainingPopoverPosition | null>(null);
  const [popoverSize, setPopoverSize] = useState<TrainingSize>({
    width: POPOVER_WIDTH,
    height: POPOVER_HEIGHT
  });
  const [completed, setCompleted] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const storageKey = `kb-admin-tour:${TOUR_VERSION}:${role}`;
  const step = tour.steps[stepIndex];
  const progress = useMemo(
    () => Math.round(((stepIndex + 1) / tour.steps.length) * 100),
    [stepIndex, tour.steps.length]
  );

  const close = useCallback(() => {
    window.sessionStorage.setItem(`${storageKey}:dismissed`, "true");
    setIsOpen(false);
  }, [storageKey]);

  const start = useCallback(() => {
    setStepIndex(0);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const wasCompleted = window.localStorage.getItem(storageKey) === "complete";
    const wasDismissed = window.sessionStorage.getItem(`${storageKey}:dismissed`) === "true";
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("tour") === "1";

    setCompleted(wasCompleted);
    if (requested) {
      params.delete("tour");
      const query = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
      window.setTimeout(start, 250);
    } else if (!wasCompleted && !wasDismissed) {
      window.setTimeout(start, 900);
    }

    const handleStart = () => start();
    window.addEventListener("kb-admin-tour:start", handleStart);
    return () => window.removeEventListener("kb-admin-tour:start", handleStart);
  }, [start, storageKey]);

  useLayoutEffect(() => {
    if (!isOpen || !popoverRef.current) return;

    const popover = popoverRef.current;
    const updateSize = () => {
      const rect = popover.getBoundingClientRect();
      const nextSize = {
        width: Math.min(rect.width || POPOVER_WIDTH, window.innerWidth - 24),
        height: rect.height || POPOVER_HEIGHT
      };

      setPopoverSize((current) =>
        Math.abs(current.width - nextSize.width) < 0.5 &&
        Math.abs(current.height - nextSize.height) < 0.5
          ? current
          : nextSize
      );
    };

    updateSize();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateSize);
    observer?.observe(popover);
    window.addEventListener("resize", updateSize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [isOpen, stepIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const target = document.querySelector(step.target);
    if (!target) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
      inline: "nearest"
    });
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) return;

    const update = () => {
      const target = document.querySelector(step.target);
      if (!target) {
        setTargetRect(null);
        setPosition({
          top: Math.max((window.innerHeight - popoverSize.height) / 2, 12),
          left: Math.max((window.innerWidth - popoverSize.width) / 2, 12),
          placement: "bottom"
        });
        return;
      }

      const rect = toViewportRect(target.getBoundingClientRect());
      setTargetRect(rect);
      setPosition(
        getTrainingPopoverPosition(rect, step.placement, popoverSize, {
          width: window.innerWidth,
          height: window.innerHeight
        })
      );
    };

    update();
    const updateTimer = window.setTimeout(update, 320);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearTimeout(updateTimer);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen, popoverSize, step]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight" && stepIndex < tour.steps.length - 1) {
        setStepIndex((value) => value + 1);
      }
      if (event.key === "ArrowLeft" && stepIndex > 0) {
        setStepIndex((value) => value - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => popoverRef.current?.focus(), 280);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close, isOpen, stepIndex, tour.steps.length]);

  const finish = () => {
    window.localStorage.setItem(storageKey, "complete");
    setCompleted(true);
    setIsOpen(false);
  };

  const connector =
    isMounted && targetRect && position
      ? getTrainingConnectorGeometry(targetRect, position, popoverSize, {
          width: window.innerWidth,
          height: window.innerHeight
        })
      : null;

  const overlay = isMounted && isOpen
    ? createPortal(
        <div className="kb-admin-training-overlay" role="dialog" aria-modal="true" aria-label={`Обучение: ${tour.label}`}>
          <button className="kb-admin-training-overlay__backdrop" type="button" onClick={close}>
            <span className="sr-only">Закрыть обучение</span>
          </button>

          {targetRect ? (
            <>
              <div
                className="kb-admin-training-spotlight"
                style={{
                  top: targetRect.top,
                  left: targetRect.left,
                  width: targetRect.width,
                  height: targetRect.height
                }}
              />
              {position && connector ? (
                <svg className="kb-admin-training-arrow" aria-hidden viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}>
                  <defs>
                    <filter id="kb-tour-glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <marker id="kb-tour-arrowhead" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#fc5413" />
                    </marker>
                  </defs>
                  <path
                    d={connector.path}
                    fill="none"
                    filter="url(#kb-tour-glow)"
                    markerEnd="url(#kb-tour-arrowhead)"
                    stroke="#fc5413"
                    strokeLinecap="round"
                    strokeWidth="4"
                  />
                </svg>
              ) : null}
            </>
          ) : null}

          <div
            className="kb-admin-training-popover"
            data-placement={position?.placement ?? "bottom"}
            ref={popoverRef}
            style={{ top: position?.top ?? 120, left: position?.left ?? 24 }}
            tabIndex={-1}
          >
            <button className="kb-admin-training-popover__close" type="button" onClick={close} aria-label="Закрыть обучение">
              <X size={17} aria-hidden />
            </button>
            <div className="kb-admin-training-popover__top">
              <span>
                <Sparkles size={15} aria-hidden />
                {tour.label}
              </span>
              <span>Шаг {stepIndex + 1} из {tour.steps.length}</span>
            </div>
            <h2>{step.title}</h2>
            <p>{step.text}</p>
            <div className="kb-admin-training-popover__progress" aria-label={`Прогресс обучения ${progress}%`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="kb-admin-training-popover__controls">
              <button className="kb-admin-training-popover__skip" type="button" onClick={close}>
                Пропустить
              </button>
              <div>
                <button
                  type="button"
                  className="kb-admin-training-popover__ghost"
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((value) => Math.max(value - 1, 0))}
                  aria-label="Предыдущий шаг"
                >
                  <ArrowLeft size={16} aria-hidden />
                </button>
                {stepIndex === tour.steps.length - 1 ? (
                  <button type="button" className="kb-admin-training-popover__primary" onClick={finish}>
                    <Check size={16} aria-hidden />
                    Готово
                  </button>
                ) : (
                  <button
                    type="button"
                    className="kb-admin-training-popover__primary"
                    onClick={() => setStepIndex((value) => Math.min(value + 1, tour.steps.length - 1))}
                  >
                    Далее
                    <ArrowRight size={16} aria-hidden />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <article className="kb-admin-training" data-tour="training-panel">
        <div className="kb-admin-training__icon">
          {completed ? <CheckCircle2 size={22} aria-hidden /> : <GraduationCap size={22} aria-hidden />}
        </div>
        <div className="kb-admin-training__copy">
          <span>{completed ? "Обучение пройдено" : `Обучение · ${tour.duration}`}</span>
          <h2>{tour.label}: быстрый старт</h2>
          <p>{tour.intro}</p>
        </div>
        <button className="kb-admin-training__button" type="button" onClick={start}>
          <MousePointerClick size={17} aria-hidden />
          {completed ? "Повторить тур" : "Начать тур"}
        </button>
      </article>
      {overlay}
    </>
  );
}
