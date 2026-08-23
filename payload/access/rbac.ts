import type { Access, FieldAccess, PayloadRequest, Where } from "payload";

export const cmsRoles = [
  "admin",
  "editor",
  "photographer",
  "director",
  "general_director",
  "sales_manager",
  "engineer",
  "seo_marketer"
] as const;

export type CmsRole = (typeof cmsRoles)[number];

export type CmsPermission =
  | "calculator.manage"
  | "calculator.read"
  | "catalog.read"
  | "content.edit"
  | "integrations.manage"
  | "leads.manage"
  | "leads.read"
  | "media.manage"
  | "products.create"
  | "products.edit"
  | "products.readDrafts"
  | "seo.read"
  | "system.read"
  | "users.manage";

export const cmsRoleOptions = [
  {
    label: { ru: "Администратор: полный доступ", en: "Administrator" },
    value: "admin"
  },
  {
    label: { ru: "Редактор контента", en: "Content editor" },
    value: "editor"
  },
  {
    label: { ru: "Медиа-менеджер", en: "Media manager" },
    value: "photographer"
  },
  {
    label: { ru: "Руководитель: просмотр и контроль", en: "Director / observer" },
    value: "director"
  },
  {
    label: { ru: "Генеральный директор", en: "General director" },
    value: "general_director"
  },
  {
    label: { ru: "Менеджер по заявкам", en: "Sales manager" },
    value: "sales_manager"
  },
  {
    label: { ru: "Инженер-калькулятор", en: "Calculator engineer" },
    value: "engineer"
  },
  {
    label: { ru: "SEO-маркетолог", en: "SEO marketer" },
    value: "seo_marketer"
  }
] as const satisfies ReadonlyArray<{
  label: { en: string; ru: string };
  value: CmsRole;
}>;

export function getCmsRoleLabel(role: CmsRole | null): string {
  if (!role) return "Ограниченный доступ";
  return (
    cmsRoleOptions.find((option) => option.value === role)?.label.ru ??
    "Ограниченный доступ"
  );
}

const permissionsByRole = {
  admin: [
    "calculator.manage",
    "calculator.read",
    "catalog.read",
    "content.edit",
    "integrations.manage",
    "leads.manage",
    "leads.read",
    "media.manage",
    "products.create",
    "products.edit",
    "products.readDrafts",
    "seo.read",
    "system.read",
    "users.manage"
  ],
  director: ["leads.read", "seo.read", "system.read"],
  editor: [
    "calculator.read",
    "catalog.read",
    "content.edit",
    "media.manage",
    "products.create",
    "products.edit",
    "products.readDrafts",
    "seo.read"
  ],
  engineer: [
    "calculator.manage",
    "calculator.read",
    "products.edit",
    "products.readDrafts"
  ],
  photographer: ["media.manage"],
  general_director: [
    "calculator.read",
    "catalog.read",
    "leads.read",
    "products.readDrafts",
    "seo.read",
    "system.read"
  ],
  sales_manager: ["calculator.read", "leads.manage", "leads.read"],
  seo_marketer: [
    "catalog.read",
    "content.edit",
    "media.manage",
    "products.edit",
    "products.readDrafts",
    "seo.read"
  ]
} as const satisfies Record<CmsRole, readonly CmsPermission[]>;

type UserWithRole = {
  invitationStatus?: unknown;
  role?: unknown;
};

export function isActiveCmsUser(user: unknown): boolean {
  return (
    Boolean(user) &&
    typeof user === "object" &&
    (user as UserWithRole).invitationStatus === "active"
  );
}

export function getCmsRole(user: unknown): CmsRole | null {
  if (!isActiveCmsUser(user)) return null;

  const role = (user as UserWithRole).role;
  return typeof role === "string" && cmsRoles.includes(role as CmsRole) ? (role as CmsRole) : null;
}

export function hasCmsRole(user: unknown, allowedRoles: readonly CmsRole[]): boolean {
  const role = getCmsRole(user);
  return role !== null && allowedRoles.includes(role);
}

export function hasCmsPermission(
  user: unknown,
  permission: CmsPermission
): boolean {
  const role = getCmsRole(user);
  return (
    role !== null &&
    (permissionsByRole[role] as readonly CmsPermission[]).includes(permission)
  );
}

export function isAdminUser(user: unknown): boolean {
  return hasCmsPermission(user, "users.manage");
}

export function canEditContent(user: unknown): boolean {
  return hasCmsPermission(user, "content.edit");
}

export function canReadCatalog(user: unknown): boolean {
  return hasCmsPermission(user, "catalog.read");
}

export function canManageMedia(user: unknown): boolean {
  return hasCmsPermission(user, "media.manage");
}

export function canReadSeo(user: unknown): boolean {
  return hasCmsPermission(user, "seo.read");
}

export function canReadSystem(user: unknown): boolean {
  return hasCmsPermission(user, "system.read");
}

export function canManageIntegrations(user: unknown): boolean {
  return hasCmsPermission(user, "integrations.manage");
}

export function canReadLeads(user: unknown): boolean {
  return hasCmsPermission(user, "leads.read");
}

export function canManageLeads(user: unknown): boolean {
  return hasCmsPermission(user, "leads.manage");
}

export function canReadCalculatorProfiles(user: unknown): boolean {
  return hasCmsPermission(user, "calculator.read");
}

export function canManageCalculatorProfiles(user: unknown): boolean {
  return hasCmsPermission(user, "calculator.manage");
}

export function canCreateProducts(user: unknown): boolean {
  return hasCmsPermission(user, "products.create");
}

export function canEditProducts(user: unknown): boolean {
  return hasCmsPermission(user, "products.edit");
}

export function canReadProductDrafts(user: unknown): boolean {
  return hasCmsPermission(user, "products.readDrafts");
}

export function canViewProductsAdmin(user: unknown): boolean {
  return canReadProductDrafts(user) || canManageLeads(user);
}

export const denyAccess: Access = () => false;
export const publicRead: Access = () => true;

export const adminOnly: Access = ({ req }) => isAdminUser(req.user);
export const contentManagersOnly: Access = ({ req }) => canEditContent(req.user);
export const catalogReadersOnly: Access = ({ req }) => canReadCatalog(req.user);
export const mediaManagersOnly: Access = ({ req }) => canManageMedia(req.user);
export const seoReadersOnly: Access = ({ req }) => canReadSeo(req.user);
export const systemReadersOnly: Access = ({ req }) => canReadSystem(req.user);
export const leadReadersOnly: Access = ({ req }) => canReadLeads(req.user);
export const leadManagersOnly: Access = ({ req }) => canManageLeads(req.user);
export const calculatorReadersOnly: Access = ({ req }) =>
  canReadCalculatorProfiles(req.user);
export const calculatorManagersOnly: Access = ({ req }) =>
  canManageCalculatorProfiles(req.user);
export const productCreatorsOnly: Access = ({ req }) =>
  canCreateProducts(req.user);
export const productEditorsOnly: Access = ({ req }) =>
  canEditProducts(req.user);
export const ownUserOrAdmin: Access = ({ req }) => {
  if (isAdminUser(req.user)) return true;
  if (!req.user || getCmsRole(req.user) === null) return false;

  const id = (req.user as { id?: unknown }).id;
  if (typeof id !== "number" && typeof id !== "string") return false;

  return {
    id: {
      equals: id
    }
  };
};

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

export const publicReadCatalog: Access = ({ req }) =>
  canReadCatalog(req.user) ? true : publishedOnly;

export const publicReadProducts: Access = ({ req }) =>
  canReadProductDrafts(req.user) ? true : publishedOnly;

export const publicReadAvailableMedia: Access = ({ req }) =>
  canManageMedia(req.user) ? true : publiclyAvailableMediaOnly;

export const mediaInternalFieldRead: FieldAccess = ({ req }) =>
  canManageMedia(req.user);

export function adminUiOnly({ req }: { req: PayloadRequest }): boolean {
  return isAdminUser(req.user);
}

export function leadsAdminUi({ req }: { req: PayloadRequest }): boolean {
  return canReadLeads(req.user);
}

export function calculatorAdminUi({ req }: { req: PayloadRequest }): boolean {
  return canReadCalculatorProfiles(req.user);
}

export function productsAdminUi({ req }: { req: PayloadRequest }): boolean {
  return canViewProductsAdmin(req.user);
}

export function canAccessAdmin({ req }: { req: PayloadRequest }): boolean {
  return getCmsRole(req.user) !== null;
}

export function contentAdminUi({ req }: { req: PayloadRequest }): boolean {
  return canEditContent(req.user);
}

export function catalogAdminUi({ req }: { req: PayloadRequest }): boolean {
  return canReadCatalog(req.user);
}

export function mediaAdminUi({ req }: { req: PayloadRequest }): boolean {
  return canManageMedia(req.user);
}
