import { describe, expect, it, vi } from "vitest";

import { getCachedAdminValue } from "@/lib/admin/server-cache";

describe("admin summary cache", () => {
  it("deduplicates concurrent reads and reuses a warm value", async () => {
    const loader = vi.fn(async () => ({ total: 6 }));
    const key = `test-${crypto.randomUUID()}`;

    const [first, second] = await Promise.all([
      getCachedAdminValue(key, 30_000, loader),
      getCachedAdminValue(key, 30_000, loader)
    ]);
    const third = await getCachedAdminValue(key, 30_000, loader);

    expect(first).toEqual({ total: 6 });
    expect(second).toEqual({ total: 6 });
    expect(third).toEqual({ total: 6 });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("does not retain a rejected load", async () => {
    const key = `test-${crypto.randomUUID()}`;
    const failure = vi.fn().mockRejectedValueOnce(new Error("temporary"));

    await expect(getCachedAdminValue(key, 30_000, failure)).rejects.toThrow("temporary");
    await expect(
      getCachedAdminValue(key, 30_000, async () => "recovered")
    ).resolves.toBe("recovered");
  });
});
