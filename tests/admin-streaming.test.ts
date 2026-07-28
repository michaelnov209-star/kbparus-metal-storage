import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function source(relativePath: string): string {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("admin streaming boundaries", () => {
  it("streams system health data behind Suspense without awaiting it in the root view", () => {
    const view = source("app/(payload)/components/AdminSystemView.tsx");
    const rootView = view.slice(view.indexOf("export async function AdminSystemView"));

    expect(view).toContain('import { Suspense } from "react"');
    expect(view).toContain("async function readSystemData");
    expect(view).toContain("const [history, profileResult, leadDelivery] = await Promise.all");
    expect(view).toContain("<SystemScore dataPromise={dataPromise}");
    expect(view).toContain("<SystemPanels dataPromise={dataPromise}");
    expect(view).toContain("<SystemScoreSkeleton");
    expect(view).toContain("<SystemPanelsSkeleton");
    expect(rootView).not.toContain("await readSystemData");
    expect(rootView).not.toContain("await readVersionHistory");
    expect(rootView).not.toContain("await readLeadDelivery");
  });

  it("streams delivery history behind the integrations grid fallback", () => {
    const view = source("app/(payload)/components/AdminIntegrationsView.tsx");
    const rootView = view.slice(view.indexOf("export async function AdminIntegrationsView"));

    expect(view).toContain('import { Suspense } from "react"');
    expect(view).toContain("async function IntegrationGrid");
    expect(view).toContain("const deliveries = await dataPromise");
    expect(view).toContain("<IntegrationGridSkeleton");
    expect(view).toContain("<IntegrationGrid");
    expect(rootView).not.toContain("await readLatestDeliveries");
  });
});
