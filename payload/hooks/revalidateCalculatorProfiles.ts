import { revalidatePath } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook
} from "payload";

type PublicationState = {
  _status?: unknown;
};

function isPublished(value: unknown) {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    (value as PublicationState)._status === "published"
  );
}

function revalidateCalculatorPages() {
  for (const path of ["/", "/sitemap.xml"]) {
    try {
      revalidatePath(path);
    } catch (error) {
      // Local API seed/build commands do not have a Next cache store.
      console.warn(
        `[calculator-profiles] Revalidation of ${path} was deferred:`,
        error instanceof Error
          ? error.message
          : "Next cache context is unavailable"
      );
    }
  }
}

export const revalidateCalculatorProfileAfterChange: CollectionAfterChangeHook =
  ({ doc, previousDoc }) => {
    if (isPublished(doc) || isPublished(previousDoc)) {
      revalidateCalculatorPages();
    }
    return doc;
  };

export const revalidateCalculatorProfileAfterDelete: CollectionAfterDeleteHook =
  ({ doc }) => {
    if (isPublished(doc)) {
      revalidateCalculatorPages();
    }
  };
