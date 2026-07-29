import { describe, expect, it, vi } from "vitest";

import { calculatorProfileSeeds } from "@/lib/calculator/profile-seed";
import {
  countMissingPublishedCalculatorProfiles,
  mapPublishedCalculatorProfileIds,
  readCalculatorProfileSyncState,
  syncCalculatorProfilesMissingOnly
} from "@/lib/calculator/profile-sync-service";

function profileDoc(
  seed: (typeof calculatorProfileSeeds)[number],
  id: number | string,
  status: "draft" | "published"
) {
  return {
    ...seed,
    id,
    _status: status,
    createdAt: "2026-07-29T08:00:00.000Z",
    updatedAt: "2026-07-29T09:00:00.000Z"
  };
}

describe("calculator profile sync service", () => {
  it("queries only canonical profiles without an arbitrary collection limit", async () => {
    const cms = {
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [], hasNextPage: false })
        .mockResolvedValueOnce({ docs: [], hasNextPage: false })
    };

    await readCalculatorProfileSyncState(cms as never);

    expect(cms.find).toHaveBeenCalledTimes(2);
    for (const call of cms.find.mock.calls) {
      expect(call[0]).toMatchObject({
        collection: "calculator-profiles",
        pagination: false,
        where: {
          slug: {
            in: calculatorProfileSeeds.map((seed) => seed.slug)
          }
        }
      });
      expect(call[0]).not.toHaveProperty("limit");
    }
  });

  it("counts draft-only profiles as missing from the published site", () => {
    const draftOnly = profileDoc(calculatorProfileSeeds[0], "draft-1", "draft");

    expect(
      countMissingPublishedCalculatorProfiles({
        latest: [draftOnly],
        published: []
      })
    ).toBe(calculatorProfileSeeds.length);
  });

  it("skips published, publishes draft-only, and creates only missing profiles", async () => {
    const publishedDoc = profileDoc(
      calculatorProfileSeeds[0],
      "published-1",
      "published"
    );
    const draftOnly = {
      ...profileDoc(calculatorProfileSeeds[1], 202, "draft"),
      title: "Проверенное значение редактора"
    };
    const cms = {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        ...data,
        id: `created-${String(data.slug)}`
      })),
      update: vi.fn(async ({ data, id }: { data: Record<string, unknown>; id: number | string }) => ({
        ...data,
        id
      }))
    };

    const result = await syncCalculatorProfilesMissingOnly(cms as never, {
      latest: [publishedDoc, draftOnly],
      published: [publishedDoc]
    });

    expect(result).toMatchObject({
      created: calculatorProfileSeeds.length - 2,
      existing: 1,
      published: 1,
      total: calculatorProfileSeeds.length
    });
    expect(cms.update).toHaveBeenCalledTimes(1);
    expect(cms.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 202,
        data: expect.objectContaining({
          _status: "published",
          title: "Проверенное значение редактора"
        }),
        draft: false
      })
    );
    expect(cms.update.mock.calls[0]?.[0]?.data).not.toHaveProperty("id");
    expect(cms.create).toHaveBeenCalledTimes(calculatorProfileSeeds.length - 2);
    expect(mapPublishedCalculatorProfileIds(result.publishedDocs).size).toBe(
      calculatorProfileSeeds.length
    );
  });

  it("is idempotent after the first successful run", async () => {
    const cms = {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        ...data,
        id: `created-${String(data.slug)}`
      })),
      update: vi.fn()
    };
    const first = await syncCalculatorProfilesMissingOnly(cms as never, {
      latest: [],
      published: []
    });
    const createCallsAfterFirstRun = cms.create.mock.calls.length;

    const second = await syncCalculatorProfilesMissingOnly(cms as never, {
      latest: first.publishedDocs,
      published: first.publishedDocs
    });

    expect(second).toMatchObject({
      created: 0,
      existing: calculatorProfileSeeds.length,
      published: 0
    });
    expect(cms.create).toHaveBeenCalledTimes(createCallsAfterFirstRun);
    expect(cms.update).not.toHaveBeenCalled();
  });
});
