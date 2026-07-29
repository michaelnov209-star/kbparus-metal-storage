import { describe, expect, it } from "vitest";
import { getGoogleServiceAccountEmailForAdmin } from "@/lib/seo-reporting/admin-connection";

describe("Google Search Console admin connection details", () => {
  const env = {
    GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL:
      "seo-reader@kbparus-storage.iam.gserviceaccount.com",
    GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY: "must-never-be-returned"
  };

  it("returns only the service-account email to an administrator", () => {
    expect(getGoogleServiceAccountEmailForAdmin("admin", env)).toBe(
      "seo-reader@kbparus-storage.iam.gserviceaccount.com"
    );
  });

  it("does not expose the email to editors or users without an admin role", () => {
    expect(getGoogleServiceAccountEmailForAdmin("editor", env)).toBeNull();
  });

  it("rejects a malformed client email instead of displaying arbitrary configuration", () => {
    expect(
      getGoogleServiceAccountEmailForAdmin("admin", {
        GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL: "not-a-service-account"
      })
    ).toBeNull();
  });
});
