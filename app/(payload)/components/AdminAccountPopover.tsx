"use client";

import { useAuth } from "@payloadcms/ui";
import { Link } from "@payloadcms/ui/elements/Link";
import { useState } from "react";

import { AdminUserAvatar } from "./AdminUserAvatar";
import type { AccountUser } from "./AdminAccountMenu";
import "./admin-account-popover.scss";

export function AdminAccountPopover({
  name,
  onClose,
  position,
  role,
  user
}: {
  name: string;
  onClose: () => void;
  position?: string;
  role: string;
  user: AccountUser;
}) {
  const { logOut } = useAuth<AccountUser>();
  const [endingSession, setEndingSession] = useState(false);

  async function endSession() {
    if (endingSession) return;
    setEndingSession(true);

    try {
      await logOut();
    } finally {
      window.location.replace("/admin/login");
    }
  }

  return (
    <div
      aria-labelledby="kb-account-popover-title"
      className="kb-account-menu__popover"
      id="kb-account-popover"
      role="dialog"
    >
      <header className="kb-account-menu__profile">
        <AdminUserAvatar
          label={`Аватар: ${name}`}
          preset={user.avatarPreset}
          size={76}
        />
        <span>
          <strong id="kb-account-popover-title" title={name}>{name}</strong>
          <small>{position || role}</small>
          {position ? <em>{role}</em> : null}
        </span>
      </header>

      <Link href="/admin/account" onClick={onClose} prefetch={false}>
        <span aria-hidden className="kb-account-menu__item-mark">П</span>
        <span>
          <strong>Настроить профиль</strong>
          <small>Имя, должность и фирменный аватар</small>
        </span>
      </Link>

      <button
        aria-disabled="true"
        className="kb-account-menu__coming-soon"
        disabled
        type="button"
      >
        <span aria-hidden className="kb-account-menu__coming-icon">•••</span>
        <span>
          <strong>Соцсети и мессенджеры <b>MAX</b></strong>
          <small>В разработке — скоро подключим</small>
        </span>
      </button>

      <div aria-label="Управление сеансом" className="kb-account-menu__session-actions">
        <button disabled={endingSession} onClick={endSession} type="button">
          <span aria-hidden>↻</span>
          Сменить аккаунт
        </button>
        <button data-danger disabled={endingSession} onClick={endSession} type="button">
          <span aria-hidden>→</span>
          {endingSession ? "Завершаем…" : "Выйти"}
        </button>
      </div>
    </div>
  );
}
