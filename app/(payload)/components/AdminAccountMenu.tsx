"use client";

import { useAuth } from "@payloadcms/ui";
import dynamic from "next/dynamic";
import {
  useEffect,
  useRef,
  useState
} from "react";

import type { AvatarPreset } from "@/payload/admin/avatar-presets";
import { AdminUserAvatar } from "./AdminUserAvatar";
import "./admin-account-menu.scss";

export type AccountUser = {
  avatarPreset?: AvatarPreset | null;
  displayName?: string | null;
  email?: string | null;
  firstName?: string | null;
  id: number | string;
  lastName?: string | null;
  name?: string | null;
  position?: string | null;
  role?: "admin" | "editor" | "photographer" | null;
};

const roleLabels: Record<NonNullable<AccountUser["role"]>, string> = {
  admin: "Администратор",
  editor: "Редактор контента",
  photographer: "Медиа-менеджер"
};

const AdminAccountPopover = dynamic(
  () =>
    import("./AdminAccountPopover").then(
      (module) => module.AdminAccountPopover
    ),
  { ssr: false }
);

function accountName(user: AccountUser): string {
  const fullName = [user.firstName, user.lastName]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");

  return (
    fullName ||
    user.displayName?.trim() ||
    user.name?.trim() ||
    user.email?.trim() ||
    "Профиль сотрудника"
  );
}

export function AdminAccountMenu() {
  const { user } = useAuth<AccountUser>();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinnedOpenRef = useRef(false);

  const name = user ? accountName(user) : "Профиль сотрудника";
  const role = user?.role ? roleLabels[user.role] : "Сотрудник";
  const position = user?.position?.trim();

  useEffect(() => {
    if (!user?.role) return;
    document.documentElement.dataset.kbCmsRole = user.role;

    return () => {
      if (document.documentElement.dataset.kbCmsRole === user.role) {
        delete document.documentElement.dataset.kbCmsRole;
      }
    };
  }, [user?.role]);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        pinnedOpenRef.current = false;
        setOpen(false);
      }
    }

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || !open) return;
      event.preventDefault();
      pinnedOpenRef.current = false;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    },
    []
  );

  function scheduleHoverState(nextOpen: boolean, pointerType: string) {
    if (
      pointerType !== "mouse" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(
      () => {
        if (nextOpen || !pinnedOpenRef.current) setOpen(nextOpen);
      },
      nextOpen ? 110 : 170
    );
  }

  function togglePinnedMenu() {
    if (open && !pinnedOpenRef.current) {
      pinnedOpenRef.current = true;
      return;
    }

    pinnedOpenRef.current = !open;
    setOpen(!open);
  }

  function closeMenu() {
    pinnedOpenRef.current = false;
    setOpen(false);
  }

  if (!user) return null;

  return (
    <div
      className="kb-account-menu"
      onPointerEnter={(event) =>
        scheduleHoverState(true, event.pointerType)
      }
      onPointerLeave={(event) =>
        scheduleHoverState(false, event.pointerType)
      }
      ref={wrapperRef}
    >
      <button
        aria-controls="kb-account-popover"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Профиль: ${name}, ${role}`}
        className="kb-account-menu__trigger"
        data-open={open || undefined}
        onClick={togglePinnedMenu}
        ref={triggerRef}
        type="button"
      >
        <AdminUserAvatar preset={user.avatarPreset} size={52} />
        <span className="kb-account-menu__identity">
          <strong>{name}</strong>
          <small>{position || role}</small>
        </span>
        <span aria-hidden className="kb-account-menu__chevron">⌄</span>
      </button>

      {open ? (
        <AdminAccountPopover
          name={name}
          onClose={closeMenu}
          position={position}
          role={role}
          user={user}
        />
      ) : null}
    </div>
  );
}
