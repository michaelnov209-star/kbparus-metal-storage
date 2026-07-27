import { describe, expect, it } from "vitest";
import {
  adminOnly,
  canEditContent,
  canManageMedia,
  contentManagersOnly,
  getCmsRole,
  mediaManagersOnly,
  publicReadPublished
} from "@/payload/access/rbac";

function accessArgs(role?: unknown) {
  return {
    req: {
      user: role === undefined ? null : { role }
    }
  } as Parameters<typeof adminOnly>[0];
}

describe("Payload RBAC", () => {
  it("rejects missing and unknown roles by default", async () => {
    expect(getCmsRole(null)).toBeNull();
    expect(getCmsRole({ role: "sales" })).toBeNull();
    expect(await adminOnly(accessArgs())).toBe(false);
    expect(await contentManagersOnly(accessArgs("sales"))).toBe(false);
    expect(await mediaManagersOnly(accessArgs("sales"))).toBe(false);
  });

  it("keeps privileged operations inside their role boundaries", async () => {
    expect(await adminOnly(accessArgs("admin"))).toBe(true);
    expect(await adminOnly(accessArgs("editor"))).toBe(false);
    expect(canEditContent({ role: "editor" })).toBe(true);
    expect(canEditContent({ role: "photographer" })).toBe(false);
    expect(canManageMedia({ role: "photographer" })).toBe(true);
  });

  it("only exposes published versioned content to public and media-only users", async () => {
    const publishedFilter = {
      _status: {
        equals: "published"
      }
    };

    expect(await publicReadPublished(accessArgs())).toEqual(publishedFilter);
    expect(await publicReadPublished(accessArgs("photographer"))).toEqual(publishedFilter);
    expect(await publicReadPublished(accessArgs("editor"))).toBe(true);
    expect(await publicReadPublished(accessArgs("admin"))).toBe(true);
  });
});
