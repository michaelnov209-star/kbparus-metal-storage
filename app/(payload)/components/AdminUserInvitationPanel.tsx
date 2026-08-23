"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MailPlus, RefreshCw, UserPlus, X } from "lucide-react";
import type {
  DefaultCellComponentProps,
  SelectFieldClient
} from "payload";

import {
  cmsRoleOptions,
  type CmsRole
} from "@/payload/access/rbac";
import type { UserInvitationStatus } from "@/lib/admin/user-invitations";

const invitationStyles = `
.kb-user-invite{margin:0 0 24px;overflow:hidden;border:1px solid #d9e0e6;border-radius:16px;background:#fff;box-shadow:0 14px 36px #1a1a1a12}
.kb-user-invite__intro{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;padding:18px 20px}
.kb-user-invite__intro h3,.kb-user-invite__intro p{margin:0}.kb-user-invite__intro h3{color:#1a1a1a;font-size:16px}.kb-user-invite__intro p{margin-top:4px;color:#59636f;font-size:13px;line-height:1.45}
.kb-user-invite__icon{display:grid;width:40px;height:40px;place-items:center;border:1px solid #fc54134d;border-radius:12px;background:#fc541312;color:#fc5413}
.kb-user-invite__toggle,.kb-user-invite__submit{display:inline-flex;min-height:42px;align-items:center;justify-content:center;gap:8px;border:0;border-radius:10px;font-weight:700;cursor:pointer}
.kb-user-invite__toggle{padding:0 16px;background:#1c2731;color:#fff}
.kb-user-invite__form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;padding:18px 20px 20px;border-top:1px solid #e6eaee;background:#f8fafb}
.kb-user-invite__form label{display:grid;gap:7px;min-width:0;color:#1a1a1a;font-size:12px;font-weight:700}
.kb-user-invite__form input,.kb-user-invite__form select{width:100%;min-height:44px;padding:0 12px;border:1px solid #ccd5dd;border-radius:10px;background:#fff;color:#1a1a1a;font:inherit;font-weight:500}
.kb-user-invite__form input:focus-visible,.kb-user-invite__form select:focus-visible{border-color:#fc5413;outline:3px solid #fc541326}
.kb-user-invite__role{grid-column:span 2}.kb-user-invite__submit{align-self:end;padding:0 18px;background:#fc5413;color:#fff}.kb-user-invite__submit:disabled{cursor:wait;opacity:.68}
.kb-user-invite__feedback{grid-column:span 2;align-self:center;color:#257045;font-size:13px;font-weight:700}.kb-user-invite__feedback[data-error=true]{color:#b62f2f}
.kb-invitation-status{display:inline-flex;align-items:center;gap:6px}.kb-invitation-status__badge{display:inline-flex;min-height:28px;align-items:center;gap:7px;padding:4px 9px;border:1px solid #d4dce3;border-radius:999px;background:#f4f6f8;color:#3d4852;font-size:12px;font-weight:700;white-space:nowrap}
.kb-invitation-status__badge i{width:7px;height:7px;border-radius:50%;background:currentColor}.kb-invitation-status__badge[data-tone=positive]{border-color:#b9e4ca;background:#edf9f2;color:#187342}.kb-invitation-status__badge[data-tone=warning]{border-color:#f1d39b;background:#fff8e8;color:#8a5a00}.kb-invitation-status__badge[data-tone=negative]{border-color:#efc0c0;background:#fff2f2;color:#ad2929}
.kb-invitation-status button{display:grid;width:30px;height:30px;place-items:center;border:1px solid #d4dce3;border-radius:9px;background:#fff;color:#34404a;cursor:pointer}.kb-invitation-status button:hover{border-color:#fc5413;color:#fc5413}
.is-spinning{animation:kb-invitation-spin .8s linear infinite}@keyframes kb-invitation-spin{to{transform:rotate(360deg)}}
@media(max-width:900px){.kb-user-invite__intro{grid-template-columns:auto minmax(0,1fr)}.kb-user-invite__toggle{grid-column:1/-1}.kb-user-invite__form{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.kb-user-invite__form{grid-template-columns:1fr}.kb-user-invite__feedback,.kb-user-invite__role{grid-column:auto}}
@media(prefers-reduced-motion:reduce){.is-spinning{animation:none}}
`;

type InvitationResponse = {
  error?: string;
  ok?: boolean;
};

const statusMeta: Record<
  UserInvitationStatus,
  { label: string; tone: string }
> = {
  active: { label: "Активен", tone: "positive" },
  delivery_failed: { label: "Письмо не доставлено", tone: "negative" },
  pending: { label: "Ожидает принятия", tone: "warning" },
  revoked: { label: "Доступ отозван", tone: "neutral" }
};

async function sendInvitationRequest(
  body: Record<string, unknown>
): Promise<InvitationResponse> {
  const response = await fetch("/api/admin/users/invitations", {
    body: JSON.stringify(body),
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    method: "POST"
  });
  const result = (await response.json().catch(() => ({}))) as InvitationResponse;
  if (!response.ok) {
    throw new Error(result.error || "Не удалось отправить приглашение.");
  }
  return result;
}

export function AdminUserInvitationPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState<CmsRole>("editor");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError("");
    setMessage("");

    try {
      await sendInvitationRequest({
        action: "create",
        email: data.get("email"),
        firstName: data.get("firstName"),
        lastName: data.get("lastName"),
        position: data.get("position"),
        role
      });
      form.reset();
      setRole("editor");
      setMessage("Приглашение отправлено. Сотрудник сам задаст пароль.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось отправить приглашение."
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className="kb-user-invite"
      aria-labelledby="kb-user-invite-title"
      data-tour="user-invite"
    >
      <style>{invitationStyles}</style>
      <div className="kb-user-invite__intro">
        <span className="kb-user-invite__icon" aria-hidden>
          <UserPlus size={19} />
        </span>
        <div>
          <h3 id="kb-user-invite-title">Безопасно добавить сотрудника</h3>
          <p>
            Вы задаёте роль, имя и должность. Пароль сотрудник создаёт сам по
            одноразовой ссылке из письма.
          </p>
        </div>
        <button
          className="kb-user-invite__toggle"
          onClick={() => {
            setOpen((value) => !value);
            setError("");
            setMessage("");
          }}
          type="button"
        >
          {open ? <X size={16} aria-hidden /> : <MailPlus size={16} aria-hidden />}
          {open ? "Закрыть" : "Пригласить сотрудника"}
        </button>
      </div>

      {open ? (
        <form className="kb-user-invite__form" onSubmit={submit}>
          <label>
            <span>Имя</span>
            <input
              autoComplete="given-name"
              maxLength={80}
              name="firstName"
              placeholder="Иван"
              required
            />
          </label>
          <label>
            <span>Фамилия</span>
            <input
              autoComplete="family-name"
              maxLength={80}
              name="lastName"
              placeholder="Петров"
              required
            />
          </label>
          <label>
            <span>Должность</span>
            <input
              autoComplete="organization-title"
              maxLength={120}
              name="position"
              placeholder="Менеджер отдела продаж"
              required
            />
          </label>
          <label>
            <span>Email для входа</span>
            <input
              autoComplete="email"
              maxLength={254}
              name="email"
              placeholder="employee@company.ru"
              required
              type="email"
            />
          </label>
          <label className="kb-user-invite__role">
            <span>Роль и права</span>
            <select
              name="role"
              onChange={(event) => setRole(event.target.value as CmsRole)}
              value={role}
            >
              {cmsRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label.ru}
                </option>
              ))}
            </select>
          </label>
          <button
            className="kb-user-invite__submit"
            disabled={pending}
            type="submit"
          >
            {pending ? <RefreshCw className="is-spinning" size={16} aria-hidden /> : <MailPlus size={16} aria-hidden />}
            {pending ? "Отправляем…" : "Отправить приглашение"}
          </button>
          <div
            aria-live="polite"
            className="kb-user-invite__feedback"
            data-error={error ? "true" : undefined}
          >
            {error || message}
          </div>
        </form>
      ) : null}
    </section>
  );
}

export function InvitationStatusCell({
  cellData,
  rowData
}: DefaultCellComponentProps<SelectFieldClient>) {
  const router = useRouter();
  const status =
    typeof cellData === "string" && cellData in statusMeta
      ? (cellData as UserInvitationStatus)
      : "active";
  const expiresAt =
    typeof rowData.invitationExpiresAt === "string"
      ? Date.parse(rowData.invitationExpiresAt)
      : Number.NaN;
  const expired =
    status === "pending" &&
    Number.isFinite(expiresAt) &&
    expiresAt <= Date.now();
  const meta = expired
    ? { label: "Ссылка истекла", tone: "negative" }
    : statusMeta[status];
  const canResend =
    status === "pending" || status === "delivery_failed";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function resend() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await sendInvitationRequest({
        action: "resend",
        userId: rowData.id
      });
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось отправить письмо."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="kb-invitation-status">
      <span
        className="kb-invitation-status__badge"
        data-tone={meta.tone}
        title={error || meta.label}
      >
        <i aria-hidden />
        {meta.label}
      </span>
      {canResend ? (
        <button
          aria-label="Отправить приглашение повторно"
          disabled={pending}
          onClick={resend}
          title={error || "Отправить приглашение повторно"}
          type="button"
        >
          <RefreshCw
            className={pending ? "is-spinning" : undefined}
            size={14}
            aria-hidden
          />
        </button>
      ) : null}
    </span>
  );
}
