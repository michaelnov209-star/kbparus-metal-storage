import { describe, expect, it } from "vitest";

import {
  enforceUserPasswordPolicy,
  USER_PASSWORD_MIN_LENGTH
} from "@/payload/hooks/userPasswordPolicy";

function operationArgs(
  operation: "create" | "resetPassword" | "update",
  password?: unknown
) {
  return {
    args: {
      data:
        password === undefined
          ? {}
          : { password }
    },
    collection: {} as never,
    operation,
    req: {} as never
  } as never;
}

describe("admin user password policy", () => {
  it("rejects short passwords on invite acceptance and account creation", async () => {
    for (const operation of ["create", "resetPassword", "update"] as const) {
      await expect(
        Promise.resolve().then(() =>
          enforceUserPasswordPolicy(operationArgs(operation, "short"))
        )
      ).rejects.toMatchObject({ status: 400 });
    }
  });

  it("accepts a long passphrase and permits updates without a password change", async () => {
    const passphrase = "Склад-Металла-2026";
    expect(passphrase.length).toBeGreaterThanOrEqual(USER_PASSWORD_MIN_LENGTH);

    await expect(
      Promise.resolve(
        enforceUserPasswordPolicy(
          operationArgs("resetPassword", passphrase)
        )
      )
    ).resolves.toBeTruthy();
    await expect(
      Promise.resolve(
        enforceUserPasswordPolicy(operationArgs("update"))
      )
    ).resolves.toBeTruthy();
  });
});
