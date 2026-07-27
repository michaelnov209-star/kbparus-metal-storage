import { describe, expect, it } from "vitest";
import {
  getDirectPostgresConnectionString,
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

  it("prefers the pooled URL for serverless runtime queries", () => {
    expect(
      getPostgresConnectionString({
        DATABASE_URL: "postgresql://pooled/database?sslmode=require",
        DATABASE_URL_UNPOOLED:
          "postgresql://direct/database?sslmode=verify-ca"
      })
    ).toBe("postgresql://pooled/database?sslmode=verify-full");
  });

  it("uses the direct URL for controlled migrations", () => {
    expect(
      getDirectPostgresConnectionString({
        DATABASE_URL: "postgresql://pooled/database?sslmode=require",
        DATABASE_URL_UNPOOLED:
          "postgresql://direct/database?sslmode=verify-ca"
      })
    ).toBe("postgresql://direct/database?sslmode=verify-full");
  });

  it("fails closed instead of falling back to a pooled URL for migrations", () => {
    expect(() =>
      getDirectPostgresConnectionString({
        DATABASE_URL: "postgresql://pooled/database?sslmode=require"
      })
    ).toThrow(/direct PostgreSQL connection is required/i);
  });

  it("supports Vercel Postgres integration variable names", () => {
    expect(
      getPostgresConnectionString({
        DATABASE_POSTGRES_URL:
          "postgresql://integration-pool/database?sslmode=require"
      })
    ).toBe("postgresql://integration-pool/database?sslmode=verify-full");
  });

  it("returns an empty value when no database URL is configured", () => {
    expect(getPostgresConnectionString({})).toBe("");
  });
});
