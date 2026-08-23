import { describe, expect, it, vi } from "vitest";
import {
  prepareCalculatorProfile,
  validatePublishedCalculatorProfile
} from "@/lib/calculator/profile-admin-validation";
import { calculatorProfileSeeds } from "@/lib/calculator/profile-seed";

const clone = <T>(value: T): T => structuredClone(value);

const hookArgs = (
  data: Record<string, unknown>,
  overrides: Record<string, unknown> = {}
) =>
  ({
    collection: null,
    context: {},
    data,
    operation: "create",
    originalDoc: undefined,
    req: {
      payload: {
        find: vi.fn().mockResolvedValue({ docs: [] })
      }
    },
    ...overrides
  }) as never;

describe("calculator profile admin validation", () => {
  it("accepts every verified built-in seed as a published profile", () => {
    for (const seed of calculatorProfileSeeds) {
      expect(
        validatePublishedCalculatorProfile(
          clone(seed) as unknown as Record<string, unknown>
        ),
        seed.slug
      ).toEqual([]);
    }
  });

  it("accepts a complete custom profile based on a verified formula", () => {
    const custom = clone(calculatorProfileSeeds[0]) as unknown as Record<
      string,
      unknown
    >;
    custom.slug = "custom-sheet-storage";
    custom.title = "Новая система хранения листа";
    custom.shortTitle = "Новая система";

    expect(validatePublishedCalculatorProfile(custom)).toEqual([]);
  });

  it("blocks duplicate choices and defaults that are not selectable", () => {
    const invalid = clone(calculatorProfileSeeds[0]) as unknown as Record<
      string,
      unknown
    >;
    invalid.heightOptions = [
      { value: 100, factor: 1 },
      { value: 100, factor: 1.2 }
    ];
    invalid.defaultValues = {
      ...(invalid.defaultValues as Record<string, unknown>),
      heightMm: 999
    };

    const errors = validatePublishedCalculatorProfile(invalid);

    expect(errors.some((error) => error.path === "heightOptions")).toBe(true);
    expect(
      errors.some((error) => error.path === "defaultValues.heightMm")
    ).toBe(true);
  });

  it("creates a stable unique slug and option keys automatically", async () => {
    const result = await prepareCalculatorProfile(
      hookArgs({
        _status: "draft",
        title: "Новая кассетная система",
        options: [
          { title: "Вакуумный захват", price: 10_000 },
          { title: "Вакуумный захват", price: 20_000 }
        ]
      })
    );

    expect(result?.slug).toBe("novaya-kassetnaya-sistema");
    expect(result?.options).toMatchObject([
      { optionId: "vakuumnyy-zahvat" },
      { optionId: "vakuumnyy-zahvat-2" }
    ]);

    const updated = await prepareCalculatorProfile(
      hookArgs(
        {
          _status: "draft",
          slug: "attempted-change",
          title: "Переименованная система"
        },
        {
          operation: "update",
          originalDoc: { id: 7, slug: "stable-system-key" }
        }
      )
    );

    expect(updated?.slug).toBe("stable-system-key");
  });

  it("allows an incomplete draft but blocks its publication", async () => {
    const draft = {
      _status: "draft",
      title: "Черновик системы"
    };

    await expect(
      prepareCalculatorProfile(hookArgs(clone(draft)))
    ).resolves.toBeTruthy();

    await expect(
      prepareCalculatorProfile(
        hookArgs({ ...draft, _status: "published" })
      )
    ).rejects.toThrow();
  });
});
