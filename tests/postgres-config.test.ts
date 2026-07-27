import { describe, expect, it } from "vitest";
import {
  getPostgresConnectionString,
  normalizePostgresConnectionString
} from "@/lib/config/postgres";

describe("Postgres runtime configuration", () => {
  it.each(["prefer", "require", "verify-ca"])(
    "normalizes sslmode=%s to explicit hostname verification",
    (mode) => {
      expect(
        normalizePostgresConnectionString(
          `postgresql://user:password@example.com/database?sslmode=${mode}&channel_binding=require`
        )
      ).toBe(
        "postgresql://user:password@example.com/database?sslmode=verify-full&channel_binding=require"
      );
    }
  );

  it("does not alter an already explicit or disabled SSL mode", () => {
    expect(
      normalizePostgresConnectionString(
        "postgresql://localhost/database?sslmode=verify-full"
      )
    ).toBe("postgresql://localhost/database?sslmode=verify-full");
    expect(
      normalizePostgresConnectionString(
        "postgresql://localhost/database?sslmode=disable"
      )
    ).toBe("postgresql://localhost/database?sslmode=disable");
  });

  it("keeps the existing connection priority while normalizing the selected URL", () => {
    expect(
      getPostgresConnectionString({
        DATABASE_URL: "postgresql://pooled/database?sslmode=require",
        DATABASE_URL_UNPOOLED:
          "postgresql://direct/database?sslmode=verify-ca"
      })
    ).toBe("postgresql://direct/database?sslmode=verify-full");
  });

  it("returns an empty value when no database URL is configured", () => {
    expect(getPostgresConnectionString({})).toBe("");
  });
});
