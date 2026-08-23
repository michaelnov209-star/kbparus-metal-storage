import { beforeEach, describe, expect, it, vi } from "vitest";

import { calculatorProfileSeeds } from "@/lib/calculator/profile-seed";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  find: vi.fn(),
  update: vi.fn()
}));

vi.mock("@/lib/cms/client", () => ({
  getCmsClient: vi.fn(async () => ({
    auth: mocks.auth,
    create: mocks.create,
    find: mocks.find,
    update: mocks.update
  }))
}));

import { POST } from "@/app/api/admin/calculator-profiles/sync/route";

function profileDoc(
  seed: (typeof calculatorProfileSeeds)[number],
  id: number,
  status: "draft" | "published"
) {
  return {
    ...seed,
    id,
    _status: status,
    createdAt: "2026-07-28T10:00:00.000Z",
    updatedAt: "2026-07-28T11:00:00.000Z"
  };
}

function syncRequest() {
  return new Request("https://example.test/api/admin/calculator-profiles/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "missing-only" })
  });
}

describe("calculator profile sync route", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.create.mockReset();
    mocks.find.mockReset();
    mocks.update.mockReset();
    mocks.auth.mockResolvedValue({
      user: { invitationStatus: "active", role: "admin" }
    });
  });

  it("publishes a draft-only base profile instead of skipping or duplicating it", async () => {
    const [draftSeed, ...publishedSeeds] = calculatorProfileSeeds;
    const publishedDocs = publishedSeeds.map((seed, index) =>
      profileDoc(seed, index + 2, "published")
    );
    const draftOnlyDoc = profileDoc(draftSeed, 101, "draft");

    mocks.find
      .mockResolvedValueOnce({ docs: publishedDocs })
      .mockResolvedValueOnce({ docs: [...publishedDocs, draftOnlyDoc] });
    mocks.update.mockResolvedValueOnce({ ...draftOnlyDoc, _status: "published" });

    const response = await POST(syncRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      created: 0,
      existing: publishedSeeds.length,
      published: 1,
      total: calculatorProfileSeeds.length
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith({
      collection: "calculator-profiles",
      id: draftOnlyDoc.id,
      data: expect.objectContaining({
        _status: "published",
        slug: draftSeed.slug,
        title: draftOnlyDoc.title
      }),
      draft: false,
      overrideAccess: true
    });
    const updateData = mocks.update.mock.calls[0]?.[0]?.data;
    expect(updateData).not.toHaveProperty("id");
    expect(updateData).not.toHaveProperty("createdAt");
    expect(updateData).not.toHaveProperty("updatedAt");
    expect(mocks.find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        draft: false,
        pagination: false,
        where: {
          slug: {
            in: calculatorProfileSeeds.map((seed) => seed.slug)
          }
        }
      })
    );
    expect(mocks.find.mock.calls[0]?.[0]).not.toHaveProperty("limit");
  });

  it("does not publish a newer draft when the base profile already has a published version", async () => {
    const publishedDocs = calculatorProfileSeeds.map((seed, index) =>
      profileDoc(seed, index + 1, "published")
    );
    const latestDocs = publishedDocs.map((doc) => ({
      ...doc,
      title: `${doc.title} — черновик`,
      _status: "draft" as const
    }));

    mocks.find
      .mockResolvedValueOnce({ docs: publishedDocs })
      .mockResolvedValueOnce({ docs: latestDocs });

    const response = await POST(syncRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      created: 0,
      existing: calculatorProfileSeeds.length,
      published: 0,
      total: calculatorProfileSeeds.length
    });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
