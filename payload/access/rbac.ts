import type { Access, FieldAccess, PayloadRequest, Where } from "payload";

export const cmsRoles = ["admin", "editor", "photographer"] as const;

export type CmsRole = (typeof cmsRoles)[number];

type UserWithRole = {
  role?: unknown;
};

export function getCmsRole(user: unknown): CmsRole | null {
  if (!user || typeof user !== "object") return null;

  const role = (user as UserWithRole).role;
  return typeof role === "string" && cmsRoles.includes(role as CmsRole) ? (role as CmsRole) : null;
}

export function hasCmsRole(user: unknown, allowedRoles: readonly CmsRole[]): boolean {
  const role = getCmsRole(user);
  return role !== null && allowedRoles.includes(role);
}

export function isAdminUser(user: unknown): boolean {
  return hasCmsRole(user, ["admin"]);
}

export function canEditContent(user: unknown): boolean {
  return hasCmsRole(user, ["admin", "editor"]);
}

export function canManageMedia(user: unknown): boolean {
  return hasCmsRole(user, ["admin", "editor", "photographer"]);
}

export const denyAccess: Access = () => false;
export const publicRead: Access = () => true;

export const adminOnly: Access = ({ req }) => isAdminUser(req.user);
export const contentManagersOnly: Access = ({ req }) => canEditContent(req.user);
export const mediaManagersOnly: Access = ({ req }) => canManageMedia(req.user);

const publishedOnly: Where = {
  _status: {
    equals: "published"
  }
};

const publiclyAvailableMediaOnly: Where = {
  publiclyAvailable: {
    equals: true
  }
};

export const publicReadPublished: Access = ({ req }) =>
  canEditContent(req.user) ? true : publishedOnly;

export const publicReadAvailableMedia: Access = ({ req }) =>
  canManageMedia(req.user) ? true : publiclyAvailableMediaOnly;

export const mediaInternalFieldRead: FieldAccess = ({ req }) =>
  canManageMedia(req.user);

export function adminUiOnly({ req }: { req: PayloadRequest }): boolean {
  return isAdminUser(req.user);
}

export function contentAdminUi({ req }: { req: PayloadRequest }): boolean {
  return canEditContent(req.user);
}

export function mediaAdminUi({ req }: { req: PayloadRequest }): boolean {
  return canManageMedia(req.user);
}
