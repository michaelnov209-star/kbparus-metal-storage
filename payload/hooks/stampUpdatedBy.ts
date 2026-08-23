import type {
  CollectionBeforeChangeHook,
  Field,
  FieldAccess
} from "payload";

import { normalizeAvatarPreset } from "../admin/avatar-presets";
import { getCmsRole, type CmsRole } from "../access/rbac";

type AuthenticatedUser = {
  avatarPreset?: unknown;
  displayName?: unknown;
  email?: unknown;
  firstName?: unknown;
  id: number | string;
  lastName?: unknown;
  name?: unknown;
  position?: unknown;
  role: CmsRole;
};

function authenticatedUser(user: unknown): AuthenticatedUser | null {
  if (!user || typeof user !== "object" || getCmsRole(user) === null) {
    return null;
  }

  const id = (user as { id?: unknown }).id;
  if (typeof id !== "number" && typeof id !== "string") return null;

  return user as AuthenticatedUser;
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function actorName(user: AuthenticatedUser): string {
  const fullName = [cleanText(user.firstName), cleanText(user.lastName)]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    cleanText(user.displayName) ||
    cleanText(user.name) ||
    cleanText(user.email) ||
    "Сотрудник"
  );
}

export function updatedByField(): Field {
  return {
    name: "updatedBy",
    label: { ru: "Кто изменил", en: "Updated by" },
    type: "relationship",
    relationTo: "users",
    access: {
      create: () => false,
      read: ({ req }) => getCmsRole(req.user) !== null,
      update: () => false
    },
    admin: {
      hidden: true,
      description: {
        ru: "Служебное поле: автор фиксируется автоматически при сохранении.",
        en: "System field populated automatically on save."
      }
    }
  };
}

export function updatedBySnapshotFields(): Field[] {
  const commonAdmin = {
    hidden: true,
    disableListColumn: true,
    disableListFilter: true
  } as const;
  const readAccess: FieldAccess = ({ req }) => getCmsRole(req.user) !== null;

  return [
    {
      name: "updatedByName",
      label: { ru: "Имя автора на момент изменения", en: "Author name snapshot" },
      type: "text",
      access: { create: () => false, read: readAccess, update: () => false },
      admin: commonAdmin
    },
    {
      name: "updatedByRole",
      label: { ru: "Роль автора на момент изменения", en: "Author role snapshot" },
      type: "text",
      access: { create: () => false, read: readAccess, update: () => false },
      admin: commonAdmin
    },
    {
      name: "updatedByAvatarPreset",
      label: { ru: "Аватар автора на момент изменения", en: "Author avatar snapshot" },
      type: "text",
      access: { create: () => false, read: readAccess, update: () => false },
      admin: commonAdmin
    }
  ];
}

export const stampUpdatedBy: CollectionBeforeChangeHook = ({
  data,
  req
}) => {
  const user = authenticatedUser(req.user);
  if (user === null) {
    return {
      ...data,
      updatedBy: null,
      updatedByAvatarPreset: null,
      updatedByName: null,
      updatedByRole: null
    };
  }

  return {
    ...data,
    updatedBy: user.id,
    updatedByAvatarPreset: normalizeAvatarPreset(user.avatarPreset),
    updatedByName: actorName(user),
    updatedByRole: user.role
  };
};
