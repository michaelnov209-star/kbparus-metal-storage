import type { Payload } from "payload";

import { getCmsClient } from "@/lib/cms/client";
import {
  getCmsRole,
  type CmsRole
} from "@/payload/access/rbac";

export { isTrustedAdminMutationRequest } from "@/lib/admin/mutation-origin";

type AuthenticatedCmsRequest = {
  cms: Payload;
  ok: true;
  role: CmsRole;
  user: NonNullable<Awaited<ReturnType<Payload["auth"]>>["user"]>;
};

type RejectedCmsRequest = {
  code: "admin-required" | "authentication-required" | "cms-unavailable";
  ok: false;
  status: 401 | 403 | 503;
};

export type CmsRequestAuthentication =
  | AuthenticatedCmsRequest
  | RejectedCmsRequest;

export async function authenticateCmsRequest(
  request: Request,
  allowedRoles: readonly CmsRole[]
): Promise<CmsRequestAuthentication> {
  const cms = await getCmsClient();
  if (!cms) {
    return { code: "cms-unavailable", ok: false, status: 503 };
  }

  try {
    const auth = await cms.auth({ headers: request.headers });
    if (!auth.user) {
      return { code: "authentication-required", ok: false, status: 401 };
    }

    const role = getCmsRole(auth.user);
    if (!role || !allowedRoles.includes(role)) {
      return { code: "admin-required", ok: false, status: 403 };
    }

    return { cms, ok: true, role, user: auth.user };
  } catch {
    return { code: "authentication-required", ok: false, status: 401 };
  }
}
