"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  GraduationCap,
  MousePointerClick
} from "lucide-react";

import type { CmsRole } from "@/payload/access/rbac";
import {
  adminTrainingRoleMeta,
  getAdminTrainingStorageKey
} from "./adminTrainingMeta";

type TrainingStateEvent = CustomEvent<{ completed?: boolean }>;

export function AdminTraining({
  role,
  userId
}: {
  role: CmsRole;
  userId: number | string;
}) {
  const meta = adminTrainingRoleMeta[role];
  const storageKey = getAdminTrainingStorageKey(role, userId);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(storageKey) || "null"
      ) as { completed?: boolean } | null;
      setCompleted(stored?.completed === true);
    } catch {
      setCompleted(false);
    }

    const update = (event: Event) => {
      const detail = (event as TrainingStateEvent).detail;
      if (typeof detail?.completed === "boolean") {
        setCompleted(detail.completed);
      }
    };

    window.addEventListener("kb-admin-tour:state", update);
    return () => window.removeEventListener("kb-admin-tour:state", update);
  }, [storageKey]);

  const start = () => {
    window.dispatchEvent(new CustomEvent("kb-admin-tour:start"));
  };

  return (
    <article className="kb-admin-training" data-tour="training-panel">
      <div className="kb-admin-training__icon">
        {completed ? (
          <CheckCircle2 size={22} aria-hidden />
        ) : (
          <GraduationCap size={22} aria-hidden />
        )}
      </div>
      <div className="kb-admin-training__copy">
        <span>
          {completed ? "Обучение пройдено" : `Обучение · ${meta.duration}`}
        </span>
        <h2>{meta.label}: быстрый старт</h2>
        <p>{meta.intro}</p>
      </div>
      <button
        className="kb-admin-training__button"
        type="button"
        onClick={start}
      >
        <MousePointerClick size={17} aria-hidden />
        {completed ? "Повторить обучение" : "Начать обучение"}
      </button>
    </article>
  );
}
