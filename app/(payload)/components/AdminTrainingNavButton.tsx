"use client";

import { GraduationCap } from "lucide-react";

export function AdminTrainingNavButton() {
  const openTraining = () => {
    window.dispatchEvent(new CustomEvent("kb-admin-tour:start"));
  };

  return (
    <button
      className="kb-admin-workspace-nav__tour"
      type="button"
      title="Обучение по админке"
      onClick={openTraining}
    >
      <span className="kb-admin-workspace-nav__section-icon">
        <GraduationCap size={17} aria-hidden />
      </span>
      <span>Обучение по админке</span>
    </button>
  );
}
