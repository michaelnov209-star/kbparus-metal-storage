import { randomBytes } from "node:crypto";
import type { PayloadRequest } from "payload";

import {
  cmsRoles,
  type CmsRole
} from "@/payload/access/rbac";

export const USER_INVITATION_EXPIRATION_MS = 24 * 60 * 60 * 1000;

export const userInvitationStatuses = [
  "active",
  "pending",
  "delivery_failed",
  "revoked"
] as const;

export type UserInvitationStatus =
  (typeof userInvitationStatuses)[number];

export type UserInvitationInput = {
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  role: CmsRole;
};

type ParseResult =
  | { error: string; ok: false }
  | { ok: true; value: UserInvitationInput };

function text(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, maxLength)
    : "";
}

export function parseUserInvitationInput(input: unknown): ParseResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Некорректные данные приглашения.", ok: false };
  }

  const data = input as Record<string, unknown>;
  const email = text(data.email, 254).toLowerCase();
  const firstName = text(data.firstName, 80);
  const lastName = text(data.lastName, 80);
  const position = text(data.position, 120);
  const role =
    typeof data.role === "string" &&
    cmsRoles.includes(data.role as CmsRole)
      ? (data.role as CmsRole)
      : null;

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ||
    email.includes("..")
  ) {
    return { error: "Укажите корректный email сотрудника.", ok: false };
  }
  if (!firstName) {
    return { error: "Укажите имя сотрудника.", ok: false };
  }
  if (!lastName) {
    return { error: "Укажите фамилию сотрудника.", ok: false };
  }
  if (!position) {
    return { error: "Укажите должность сотрудника.", ok: false };
  }
  if (!role) {
    return { error: "Выберите роль сотрудника.", ok: false };
  }

  return {
    ok: true,
    value: { email, firstName, lastName, position, role }
  };
}

export function createTemporaryInvitationPassword(): string {
  // The value is never returned or logged. It only satisfies Payload's local
  // auth record creation and is replaced when the one-time link is accepted.
  return randomBytes(48).toString("base64url");
}

export function invitationExpiresAt(now = Date.now()): string {
  return new Date(now + USER_INVITATION_EXPIRATION_MS).toISOString();
}

export function isPendingInvitation(status: unknown): boolean {
  return status === "pending" || status === "delivery_failed";
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function adminResetUrl(req: PayloadRequest, token: string): string {
  const serverURL = req.payload.config.serverURL.replace(/\/+$/u, "");
  const adminRoute = req.payload.config.routes.admin.replace(/^\/|\/$/gu, "");
  const resetRoute = req.payload.config.admin.routes.reset.replace(
    /^\/|\/$/gu,
    ""
  );
  return `${serverURL}/${adminRoute}/${resetRoute}/${encodeURIComponent(token)}`;
}

type InvitationEmailUser = {
  displayName?: unknown;
  email?: unknown;
  firstName?: unknown;
  invitationStatus?: unknown;
};

export function userAccessEmailSubject(user: InvitationEmailUser): string {
  return isPendingInvitation(user.invitationStatus)
    ? "Приглашение в центр управления КБ Парус"
    : "Сброс пароля — центр управления КБ Парус";
}

export function userAccessEmailHtml({
  req,
  token,
  user
}: {
  req: PayloadRequest;
  token: string;
  user: InvitationEmailUser;
}): string {
  const invitation = isPendingInvitation(user.invitationStatus);
  const name =
    text(user.firstName, 80) ||
    text(user.displayName, 160) ||
    "Коллега";
  const actionUrl = adminResetUrl(req, token);
  const title = invitation
    ? "Вас пригласили в центр управления сайтом"
    : "Создайте новый пароль";
  const intro = invitation
    ? "Администратор добавил для вас рабочий аккаунт. Перейдите по защищённой ссылке и задайте собственный пароль."
    : "Мы получили запрос на смену пароля вашего рабочего аккаунта.";
  const button = invitation ? "Принять приглашение" : "Задать новый пароль";

  return `<!doctype html>
<html lang="ru">
  <body style="margin:0;background:#f3f5f7;color:#1a1a1a;font-family:Arial,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e1e6eb;border-radius:18px">
            <tr>
              <td style="padding:32px">
                <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fc5413">КБ Парус · центр управления</div>
                <h1 style="margin:14px 0 12px;font-size:26px;line-height:1.2">${escapeHtml(title)}</h1>
                <p style="margin:0 0 12px;font-size:16px;line-height:1.55">Здравствуйте, ${escapeHtml(name)}.</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.55;color:#3d3d3d">${escapeHtml(intro)}</p>
                <a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:14px 20px;border-radius:10px;background:#fc5413;color:#fff;font-weight:700;text-decoration:none">${escapeHtml(button)}</a>
                <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#68727d">Ссылка действует 24 часа и становится недействительной после использования. Если вы не ожидали это письмо, просто проигнорируйте его.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
