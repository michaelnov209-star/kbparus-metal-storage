"use client";

import { GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminTrainingNavButton() {
  const router = useRouter();

  const openTraining = () => {
    if (window.location.pathname === "/admin" || window.location.pathname === "/admin/") {
      window.dispatchEvent(new CustomEvent("kb-admin-tour:start"));
      return;
    }

    router.push("/admin?tour=1");
  };

  return (
    <button
      className="kb-admin-workspace-nav__tour"
      type="button"
      title="Обучение по админке"
      onClick={openTraining}
      onFocus={() => router.prefetch("/admin")}
      onMouseEnter={() => router.prefetch("/admin")}
      onPointerDown={() => router.prefetch("/admin")}
    >
      <span className="kb-admin-workspace-nav__section-icon">
        <GraduationCap size={17} aria-hidden />
      </span>
      <span>Обучение по админке</span>
    </button>
  );
}
