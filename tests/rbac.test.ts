import { describe, expect, it } from "vitest";
import {
  adminOnly,
  calculatorManagersOnly,
  calculatorReadersOnly,
  canManageIntegrations,
  canManageLeads,
  canReadCatalog,
  canReadLeads,
  canReadSeo,
  canReadSystem,
  canViewProductsAdmin,
  canEditContent,
  canManageMedia,
  contentManagersOnly,
  getCmsRole,
  mediaManagersOnly,
  mediaInternalFieldRead,
  publicReadAvailableMedia,
  publicReadCatalog,
  publicReadProducts,
  publicReadPublished
} from "@/payload/access/rbac";
import { canUpdateProductField } from "@/payload/collections/Products";

function accessArgs(role?: unknown) {
  return {
    req: {
      user:
        role === undefined
          ? null
          : { invitationStatus: "active", role }
    }
  } as Parameters<typeof adminOnly>[0];
}

function activeUser(role: string) {
  return { invitationStatus: "active", role };
}

describe("Payload RBAC", () => {
  it("rejects missing and unknown roles by default", async () => {
    expect(getCmsRole(null)).toBeNull();
    expect(getCmsRole(activeUser("sales"))).toBeNull();
    expect(getCmsRole({ invitationStatus: "revoked", role: "admin" })).toBeNull();
    expect(getCmsRole({ invitationStatus: "pending", role: "admin" })).toBeNull();
    expect(await adminOnly(accessArgs())).toBe(false);
    expect(await contentManagersOnly(accessArgs("sales"))).toBe(false);
    expect(await mediaManagersOnly(accessArgs("sales"))).toBe(false);
  });

  it("keeps privileged operations inside their role boundaries", async () => {
    expect(await adminOnly(accessArgs("admin"))).toBe(true);
    expect(await adminOnly(accessArgs("editor"))).toBe(false);
    expect(canEditContent(activeUser("editor"))).toBe(true);
    expect(canEditContent(activeUser("photographer"))).toBe(false);
    expect(canManageMedia(activeUser("photographer"))).toBe(true);
  });

  it("assigns each business role only its agreed workspace", async () => {
    const director = activeUser("director");
    expect(canReadSeo(director)).toBe(true);
    expect(canReadSystem(director)).toBe(true);
    expect(canReadLeads(director)).toBe(true);
    expect(canManageLeads(director)).toBe(false);
    expect(canEditContent(director)).toBe(false);
    expect(canManageIntegrations(director)).toBe(false);

    const generalDirector = activeUser("general_director");
    expect(canReadCatalog(generalDirector)).toBe(true);
    expect(canViewProductsAdmin(generalDirector)).toBe(true);
    expect(await calculatorReadersOnly(accessArgs("general_director"))).toBe(true);
    expect(await calculatorManagersOnly(accessArgs("general_director"))).toBe(false);
    expect(canReadLeads(generalDirector)).toBe(true);
    expect(canManageLeads(generalDirector)).toBe(false);
    expect(canReadSeo(generalDirector)).toBe(true);
    expect(canReadSystem(generalDirector)).toBe(true);
    expect(canEditContent(generalDirector)).toBe(false);
    expect(canManageMedia(generalDirector)).toBe(false);
    expect(canManageIntegrations(generalDirector)).toBe(false);

    const sales = activeUser("sales_manager");
    expect(canReadLeads(sales)).toBe(true);
    expect(canManageLeads(sales)).toBe(true);
    expect(await calculatorReadersOnly(accessArgs("sales_manager"))).toBe(true);
    expect(await calculatorManagersOnly(accessArgs("sales_manager"))).toBe(false);
    expect(canViewProductsAdmin(sales)).toBe(true);
    expect(canReadSystem(sales)).toBe(false);
    expect(canReadSeo(sales)).toBe(false);

    const engineer = activeUser("engineer");
    expect(await calculatorManagersOnly(accessArgs("engineer"))).toBe(true);
    expect(canViewProductsAdmin(engineer)).toBe(true);
    expect(canReadLeads(engineer)).toBe(false);
    expect(canManageIntegrations(engineer)).toBe(false);

    const seo = activeUser("seo_marketer");
    expect(canEditContent(seo)).toBe(true);
    expect(canManageMedia(seo)).toBe(true);
    expect(canReadSeo(seo)).toBe(true);
    expect(canReadLeads(seo)).toBe(false);
    expect(canReadSystem(seo)).toBe(false);
  });

  it("enforces product field boundaries for engineer and SEO roles", () => {
    expect(canUpdateProductField(activeUser("engineer"), "pricing")).toBe(true);
    expect(canUpdateProductField(activeUser("engineer"), "technical")).toBe(true);
    expect(canUpdateProductField(activeUser("engineer"), "content")).toBe(false);
    expect(canUpdateProductField(activeUser("engineer"), "publishing")).toBe(false);

    expect(canUpdateProductField(activeUser("seo_marketer"), "content")).toBe(true);
    expect(canUpdateProductField(activeUser("seo_marketer"), "seo")).toBe(true);
    expect(canUpdateProductField(activeUser("seo_marketer"), "pricing")).toBe(false);
    expect(canUpdateProductField(activeUser("seo_marketer"), "technical")).toBe(false);
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
    expect(await publicReadCatalog(accessArgs("general_director"))).toBe(true);
    expect(await publicReadProducts(accessArgs("engineer"))).toBe(true);
    expect(await publicReadProducts(accessArgs("seo_marketer"))).toBe(true);
    expect(await publicReadProducts(accessArgs("sales_manager"))).toEqual(
      publishedFilter
    );
  });

  it("hides private media and internal notes from anonymous API readers", async () => {
    expect(await publicReadAvailableMedia(accessArgs())).toEqual({
      publiclyAvailable: {
        equals: true
      }
    });
    expect(await publicReadAvailableMedia(accessArgs("photographer"))).toBe(true);
    expect(await mediaInternalFieldRead(accessArgs())).toBe(false);
    expect(await mediaInternalFieldRead(accessArgs("editor"))).toBe(true);
  });
});
