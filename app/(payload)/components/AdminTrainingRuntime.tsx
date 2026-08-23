"use client";

import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
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
  Sparkles,
  X
} from "lucide-react";

import type { CmsRole } from "@/payload/access/rbac";
import {
  getTrainingConnectorGeometry,
  getTrainingPopoverPosition,
  type TrainingPopoverPosition,
  type TrainingRect,
  type TrainingSize
} from "./adminTrainingGeometry";
import {
  adminTrainingRoleMeta,
  getAdminTrainingJourney,
  getAdminTrainingStorageKey,
  isTrainingRoute
} from "./adminTrainingJourney";

const POPOVER_WIDTH = 390;
const POPOVER_HEIGHT = 310;
const SPOTLIGHT_GAP = 8;

type StoredTrainingProgress = {
  completed: boolean;
  moduleId: string;
  started: boolean;
  stepIndex: number;
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

function firstTarget(selectors: string[]): Element | null {
  for (const selector of selectors) {
    try {
      const target = document.querySelector(selector);
      if (target) return target;
    } catch {
      // An invalid optional selector must not break the rest of the tour.
    }
  }
  return null;
}

function safeReadProgress(
  storageKey: string
): StoredTrainingProgress | null {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(storageKey) || "null"
    ) as Partial<StoredTrainingProgress> | null;

    if (
      !parsed ||
      typeof parsed.moduleId !== "string" ||
      typeof parsed.stepIndex !== "number"
    ) {
      return null;
    }

    return {
      completed: parsed.completed === true,
      moduleId: parsed.moduleId,
      started: parsed.started === true,
      stepIndex: Math.max(0, Math.floor(parsed.stepIndex))
    };
  } catch {
    return null;
  }
}

export function AdminTrainingRuntime({
  role,
  userId
}: {
  role: CmsRole;
  userId: number | string;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/admin";
  const journey = useMemo(() => getAdminTrainingJourney(role), [role]);
  const meta = adminTrainingRoleMeta[role];
  const storageKey = getAdminTrainingStorageKey(role, userId);
  const dismissedKey = `${storageKey}:dismissed`;
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TrainingRect | null>(null);
  const [position, setPosition] =
    useState<TrainingPopoverPosition | null>(null);
  const [popoverSize, setPopoverSize] = useState<TrainingSize>({
    width: POPOVER_WIDTH,
    height: POPOVER_HEIGHT
  });
  const overlayRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pendingRouteRef = useRef<string | null>(null);

  const activeModule = journey[moduleIndex] || journey[0];
  const activeStep = activeModule?.steps[stepIndex] || activeModule?.steps[0];
  const routeReady = Boolean(
    activeModule && isTrainingRoute(pathname, activeModule.route)
  );
  const visible = isMounted && isOpen && routeReady && Boolean(activeStep);
  const rendered = visible && position !== null;
  const progress = activeModule
    ? Math.round(((stepIndex + 1) / activeModule.steps.length) * 100)
    : 0;

  const writeProgress = useCallback(
    (
      nextModuleIndex: number,
      nextStepIndex: number,
      completed = false
    ) => {
      const module = journey[nextModuleIndex] || journey[0];
      if (!module) return;

      const next: StoredTrainingProgress = {
        completed,
        moduleId: module.id,
        started: true,
        stepIndex: nextStepIndex
      };
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent("kb-admin-tour:state", {
          detail: { completed }
        })
      );
    },
    [journey, storageKey]
  );

  const openModule = useCallback(
    (nextModuleIndex: number, nextStepIndex = 0) => {
      const safeModuleIndex = Math.min(
        Math.max(nextModuleIndex, 0),
        Math.max(journey.length - 1, 0)
      );
      const module = journey[safeModuleIndex];
      if (!module) return;
      const safeStepIndex = Math.min(
        Math.max(nextStepIndex, 0),
        Math.max(module.steps.length - 1, 0)
      );

      setModuleIndex(safeModuleIndex);
      setStepIndex(safeStepIndex);
      setTargetRect(null);
      setPosition(null);
      setIsOpen(true);
      writeProgress(safeModuleIndex, safeStepIndex);

      if (!isTrainingRoute(window.location.pathname, module.route)) {
        pendingRouteRef.current = module.route;
        router.push(module.route);
      }
    },
    [journey, router, writeProgress]
  );

  const start = useCallback(() => {
    window.sessionStorage.removeItem(dismissedKey);
    openModule(0, 0);
  }, [dismissedKey, openModule]);

  const close = useCallback(() => {
    window.sessionStorage.setItem(dismissedKey, "true");
    setIsOpen(false);
  }, [dismissedKey]);

  const finish = useCallback(() => {
    const openProfileForm = activeModule?.id === "profile";
    writeProgress(moduleIndex, stepIndex, true);
    setIsOpen(false);
    if (openProfileForm) {
      window.setTimeout(() => {
        const profileForm = document.querySelector("main form");
        const firstEditableField =
          profileForm?.querySelector<HTMLElement>(
            'input:not([disabled]):not([readonly]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]):not([readonly])'
          );
        firstEditableField?.focus();
      }, 80);
    }
  }, [activeModule?.id, moduleIndex, stepIndex, writeProgress]);

  const next = useCallback(() => {
    if (!activeModule) return;
    if (stepIndex < activeModule.steps.length - 1) {
      const nextStepIndex = stepIndex + 1;
      setStepIndex(nextStepIndex);
      writeProgress(moduleIndex, nextStepIndex);
      return;
    }

    if (moduleIndex < journey.length - 1) {
      openModule(moduleIndex + 1, 0);
      return;
    }

    finish();
  }, [
    activeModule,
    finish,
    journey.length,
    moduleIndex,
    openModule,
    stepIndex,
    writeProgress
  ]);

  const previous = useCallback(() => {
    if (!activeModule) return;
    if (stepIndex > 0) {
      const previousStepIndex = stepIndex - 1;
      setStepIndex(previousStepIndex);
      writeProgress(moduleIndex, previousStepIndex);
      return;
    }

    if (moduleIndex > 0) {
      const previousModule = journey[moduleIndex - 1];
      openModule(moduleIndex - 1, previousModule.steps.length - 1);
    }
  }, [
    activeModule,
    journey,
    moduleIndex,
    openModule,
    stepIndex,
    writeProgress
  ]);

  useEffect(() => {
    setIsMounted(true);
    const requested =
      new URLSearchParams(window.location.search).get("tour") === "1";
    const dismissed =
      window.sessionStorage.getItem(dismissedKey) === "true";
    const stored = safeReadProgress(storageKey);
    const storedModuleIndex = stored
      ? journey.findIndex((module) => module.id === stored.moduleId)
      : -1;

    if (requested) {
      const params = new URLSearchParams(window.location.search);
      params.delete("tour");
      const query = params.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`
      );
      const timer = window.setTimeout(start, 250);
      return () => window.clearTimeout(timer);
    }

    if (!stored?.completed && !dismissed) {
      const timer = window.setTimeout(() => {
        if (stored?.started && storedModuleIndex >= 0) {
          openModule(storedModuleIndex, stored.stepIndex);
        } else {
          start();
        }
      }, stored?.started ? 350 : 900);
      return () => window.clearTimeout(timer);
    }
  }, [dismissedKey, journey, openModule, start, storageKey]);

  useEffect(() => {
    const handleStart = () => start();
    window.addEventListener("kb-admin-tour:start", handleStart);
    return () =>
      window.removeEventListener("kb-admin-tour:start", handleStart);
  }, [start]);

  useEffect(() => {
    if (!isOpen || !activeModule) return;

    const pending = pendingRouteRef.current;
    if (pending && isTrainingRoute(pathname, pending)) {
      pendingRouteRef.current = null;
      return;
    }
    if (pending) return;
    if (isTrainingRoute(pathname, activeModule.route)) return;

    const routeModuleIndex = journey.findIndex((module) =>
      isTrainingRoute(pathname, module.route)
    );
    if (routeModuleIndex >= 0) {
      setModuleIndex(routeModuleIndex);
      setStepIndex(0);
      writeProgress(routeModuleIndex, 0);
      return;
    }

    pendingRouteRef.current = activeModule.route;
    router.push(activeModule.route);
  }, [
    activeModule,
    isOpen,
    journey,
    pathname,
    router,
    writeProgress
  ]);

  useLayoutEffect(() => {
    if (!rendered || !popoverRef.current) return;

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
  }, [moduleIndex, rendered, stepIndex]);

  useEffect(() => {
    if (!visible || !activeStep) return;

    const target = firstTarget(activeStep.targets);
    if (!target) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    target.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
      inline: "nearest"
    });
  }, [activeStep, visible]);

  useEffect(() => {
    if (!visible || !activeStep) return;

    const update = () => {
      const target = firstTarget(activeStep.targets);
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
        getTrainingPopoverPosition(
          rect,
          activeStep.placement,
          popoverSize,
          {
            width: window.innerWidth,
            height: window.innerHeight
          }
        )
      );
    };

    const targetAvailable = Boolean(firstTarget(activeStep.targets));
    update();
    const timer = window.setTimeout(update, 360);
    let observer: MutationObserver | null = null;
    let observerTimer: number | null = null;
    if (!targetAvailable) {
      observer = new MutationObserver(() => {
        if (!firstTarget(activeStep.targets)) return;
        update();
        observer?.disconnect();
        observer = null;
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      observerTimer = window.setTimeout(() => {
        observer?.disconnect();
        observer = null;
      }, 5_000);
    }
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearTimeout(timer);
      if (observerTimer !== null) {
        window.clearTimeout(observerTimer);
      }
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [activeStep, popoverSize, visible]);

  useEffect(() => {
    if (!rendered || !overlayRef.current) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overlay = overlayRef.current;
    const locked = Array.from(document.body.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== overlay
    );
    const snapshots = locked.map((element) => ({
      ariaHidden: element.getAttribute("aria-hidden"),
      element,
      inert: element.inert
    }));
    const previousOverflow = document.body.style.overflow;

    for (const element of locked) {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "hidden";
    window.setTimeout(() => popoverRef.current?.focus(), 0);

    return () => {
      for (const snapshot of snapshots) {
        snapshot.element.inert = snapshot.inert;
        if (snapshot.ariaHidden === null) {
          snapshot.element.removeAttribute("aria-hidden");
        } else {
          snapshot.element.setAttribute("aria-hidden", snapshot.ariaHidden);
        }
      }
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [rendered]);

  const connector =
    visible && targetRect && position
      ? getTrainingConnectorGeometry(targetRect, position, popoverSize, {
          width: window.innerWidth,
          height: window.innerHeight
        })
      : null;

  if (!rendered || !activeModule || !activeStep || !position) {
    return null;
  }

  const firstStep = moduleIndex === 0 && stepIndex === 0;
  const lastStep =
    moduleIndex === journey.length - 1 &&
    stepIndex === activeModule.steps.length - 1;
  const nextModule = journey[moduleIndex + 1];
  const primaryLabel = lastStep
    ? activeModule.id === "profile"
      ? "Заполнить профиль"
      : "Завершить обучение"
    : stepIndex === activeModule.steps.length - 1
      ? nextModule?.id === "profile"
        ? "Заполнить профиль"
        : "Следующий раздел"
      : "Далее";

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
      return;
    }
    if (event.key === "ArrowLeft" && !firstStep) {
      event.preventDefault();
      previous();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className="kb-admin-training-overlay"
      data-centered={!targetRect || undefined}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Обучение: ${meta.label}, ${activeModule.label}`}
    >
      <button
        aria-label="Закрыть обучение"
        className="kb-admin-training-overlay__backdrop"
        type="button"
        onClick={close}
      />

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
          {connector ? (
            <svg
              className="kb-admin-training-arrow"
              aria-hidden
              viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
            >
              <defs>
                <filter
                  id="kb-tour-glow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <marker
                  id="kb-tour-arrowhead"
                  markerHeight="11"
                  markerUnits="userSpaceOnUse"
                  markerWidth="11"
                  orient="auto"
                  refX="9.5"
                  refY="5.5"
                >
                  <path d="M 0 0 L 10 5.5 L 0 11 z" fill="#fc5413" />
                </marker>
              </defs>
              <path
                d={connector.path}
                fill="none"
                filter="url(#kb-tour-glow)"
                markerEnd="url(#kb-tour-arrowhead)"
                stroke="#fc5413"
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
          ) : null}
        </>
      ) : null}

      <div
        className="kb-admin-training-popover"
        data-placement={position.placement}
        onKeyDown={trapFocus}
        ref={popoverRef}
        style={{ top: position.top, left: position.left }}
        tabIndex={-1}
      >
        <button
          className="kb-admin-training-popover__close"
          type="button"
          onClick={close}
          aria-label="Закрыть обучение"
        >
          <X size={17} aria-hidden />
        </button>
        <div className="kb-admin-training-popover__top">
          <span>
            <Sparkles size={15} aria-hidden />
            {activeModule.label} · {moduleIndex + 1}/{journey.length}
          </span>
          <span>
            Шаг {stepIndex + 1} из {activeModule.steps.length}
          </span>
        </div>
        <h2>{activeStep.title}</h2>
        <p>{activeStep.text}</p>
        <div
          className="kb-admin-training-popover__progress"
          aria-label={`Прогресс раздела ${progress}%`}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="kb-admin-training-popover__controls">
          <button
            className="kb-admin-training-popover__skip"
            type="button"
            onClick={close}
          >
            Продолжить позже
          </button>
          <div>
            <button
              type="button"
              className="kb-admin-training-popover__ghost"
              disabled={firstStep}
              onClick={previous}
              aria-label="Предыдущий шаг"
            >
              <ArrowLeft size={16} aria-hidden />
            </button>
            <button
              type="button"
              className="kb-admin-training-popover__primary"
              onClick={lastStep ? finish : next}
            >
              {lastStep ? <Check size={16} aria-hidden /> : null}
              {primaryLabel}
              {!lastStep ? <ArrowRight size={16} aria-hidden /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
