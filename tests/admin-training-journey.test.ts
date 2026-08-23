import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { CmsRole } from "../payload/access/rbac";
import {
  adminTrainingModules,
  getAdminTrainingJourney,
  getAdminTrainingStorageKey,
  isTrainingRoute
} from "../app/(payload)/components/adminTrainingJourney";

const roles = [
  "admin",
  "editor",
  "photographer",
  "director",
  "general_director",
  "sales_manager",
  "engineer",
  "seo_marketer"
] as CmsRole[];

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("route-aware admin training", () => {
  it("keeps every page module short and finishes with profile setup", () => {
    for (const role of roles) {
      const journey = getAdminTrainingJourney(role);

      expect(journey.length).toBeGreaterThanOrEqual(3);
      expect(journey[0]?.route).toBe("/admin");
      expect(journey.at(-1)?.route).toBe("/admin/account");
      expect(journey.at(-1)?.id).toBe("profile");
      expect(
        journey.every(
          (module) => module.steps.length >= 1 && module.steps.length <= 3
        )
      ).toBe(true);
    }
  });

  it("stores progress independently for every employee and role", () => {
    expect(getAdminTrainingStorageKey("admin", 10)).not.toBe(
      getAdminTrainingStorageKey("admin", 11)
    );
    expect(getAdminTrainingStorageKey("admin", 10)).not.toBe(
      getAdminTrainingStorageKey("editor", 10)
    );
  });

  it("uses exact normalized routes instead of ambiguous prefixes", () => {
    expect(isTrainingRoute("/admin/seo/", "/admin/seo")).toBe(true);
    expect(isTrainingRoute("/admin/seo?period=30", "/admin/seo")).toBe(true);
    expect(isTrainingRoute("/admin/seo-old", "/admin/seo")).toBe(false);
  });

  it("does not duplicate module ids and gives every step a fallback target", () => {
    expect(new Set(adminTrainingModules.map((module) => module.id)).size).toBe(
      adminTrainingModules.length
    );
    expect(
      adminTrainingModules.every((module) =>
        module.steps.every((step) => step.targets.length > 0)
      )
    ).toBe(true);
  });

  it("navigates between pages and isolates the modal from background controls", () => {
    const runtime = source(
      "app/(payload)/components/AdminTrainingRuntime.tsx"
    );
    const provider = source(
      "app/(payload)/components/AdminTrainingProvider.tsx"
    );

    expect(runtime).toContain("router.push(module.route)");
    expect(runtime).toContain("element.inert = true");
    expect(runtime).toContain('event.key !== "Tab"');
    expect(runtime).toContain("previousFocusRef.current?.focus()");
    expect(runtime).toContain("Заполнить профиль");
    expect(provider).toContain("<AdminTrainingRuntime");
  });
});
