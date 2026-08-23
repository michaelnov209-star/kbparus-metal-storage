import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function source(relativePath: string): string {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("admin streaming boundaries", () => {
  it("streams the fast system summary independently from slower version history", () => {
    const view = source("app/(payload)/components/AdminSystemView.tsx");
    const rootView = view.slice(view.indexOf("export async function AdminSystemView"));

    expect(view).toContain('import { Suspense } from "react"');
    expect(view).toContain("async function readSystemSummary");
    expect(view).toContain("async function readSystemHistory");
    expect(view).toContain("const [profileResult, leadDelivery] = await Promise.all");
    expect(view).toMatch(
      /<SystemScore\s[\s\S]*?summaryPromise=\{summaryPromise\}[\s\S]*?\/>/
    );
    expect(view).toMatch(
      /<SystemHealth\s[\s\S]*?summaryPromise=\{summaryPromise\}[\s\S]*?\/>/
    );
    expect(view).toContain("<SystemHistory historyPromise={historyPromise}");
    expect(view).toContain("<SystemCalculator summaryPromise={summaryPromise}");
    expect(view).toContain("<SystemScoreSkeleton");
    expect(view).toContain("<SystemHealthSkeleton");
    expect(view).toContain("<SystemHistorySkeleton");
    expect(view).toContain("<SystemCalculatorSkeleton");
    expect(rootView).not.toContain("await readSystemSummary");
    expect(rootView).not.toContain("await readSystemHistory");
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
