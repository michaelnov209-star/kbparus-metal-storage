import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeValidateHook } from "payload";

import { isAdminUser } from "../access/rbac";

const SELF_EDITABLE_FIELDS = new Set([
  "avatarPreset",
  "firstName",
  "lastName",
  "position"
]);

function equalValue(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === undefined && right === null) return true;
  if (left === null && right === undefined) return true;

  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const protectUserProfileUpdate: CollectionBeforeValidateHook = ({
  data,
  operation,
  originalDoc,
  req
}) => {
  if (
    operation !== "update" ||
    !data ||
    !req.user ||
    isAdminUser(req.user)
  ) {
    return data;
  }

  for (const [key, value] of Object.entries(data)) {
    if (SELF_EDITABLE_FIELDS.has(key)) continue;

    // Payload includes the empty password input in some account-form states.
    // A non-empty password is a real credential mutation and is intentionally
    // outside this profile editor.
    if (key === "password" && !text(value)) continue;

    if (!equalValue(value, originalDoc?.[key])) {
      throw new APIError(
        "В профиле можно менять только имя, фамилию, должность и аватар.",
        403
      );
    }
  }

  return data;
};

export const deriveUserDisplayName: CollectionBeforeChangeHook = ({
  data,
  originalDoc
}) => {
  const firstName = text(data.firstName ?? originalDoc?.firstName);
  const lastName = text(data.lastName ?? originalDoc?.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return {
    ...data,
    displayName:
      fullName ||
      text(data.displayName ?? originalDoc?.displayName) ||
      text(data.name ?? originalDoc?.name) ||
      text(data.email ?? originalDoc?.email)
  };
};
