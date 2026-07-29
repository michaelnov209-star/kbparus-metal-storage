"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useLayoutEffect, useState } from "react";

const STORAGE_KEY = "kb-admin-nav-mode";
const COMPACT_VALUE = "compact";
const EXPANDED_VALUE = "expanded";

function applyMode(compact: boolean) {
  document.documentElement.dataset.kbAdminNav =
    compact ? COMPACT_VALUE : EXPANDED_VALUE;
}

function readStoredMode() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === COMPACT_VALUE;
  } catch {
    return false;
  }
}

function storeMode(compact: boolean) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      compact ? COMPACT_VALUE : EXPANDED_VALUE
    );
  } catch {
    // The visual mode still works for the current page when storage is blocked.
  }
}

export function AdminNavModeToggle() {
  const [compact, setCompact] = useState(false);

  useLayoutEffect(() => {
    const storedCompact = readStoredMode();
    setCompact(storedCompact);
    applyMode(storedCompact);

    const syncMode = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const nextCompact = event.newValue === COMPACT_VALUE;
      setCompact(nextCompact);
      applyMode(nextCompact);
    };

    window.addEventListener("storage", syncMode);
    return () => window.removeEventListener("storage", syncMode);
  }, []);

  const toggle = () => {
    setCompact((currentCompact) => {
      const nextCompact = !currentCompact;
      applyMode(nextCompact);
      storeMode(nextCompact);
      return nextCompact;
    });
  };

  return (
    <button
      aria-label={compact ? "Развернуть боковое меню" : "Свернуть боковое меню"}
      aria-pressed={compact}
      className="kb-admin-workspace-nav__mode-toggle"
      onClick={toggle}
      title={compact ? "Развернуть меню" : "Свернуть до иконок"}
      type="button"
    >
      {compact ? (
        <PanelLeftOpen aria-hidden size={17} strokeWidth={2} />
      ) : (
        <PanelLeftClose aria-hidden size={17} strokeWidth={2} />
      )}
    </button>
  );
}
