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
      onClick={openTraining}
      onFocus={() => router.prefetch("/admin")}
      onMouseEnter={() => router.prefetch("/admin")}
      onPointerDown={() => router.prefetch("/admin")}
    >
      <GraduationCap size={17} aria-hidden />
      <span>Обучение по админке</span>
    </button>
  );
}
