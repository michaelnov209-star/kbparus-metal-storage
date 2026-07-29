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

function revalidatePublicCatalog() {
  const targets = [
    { path: "/catalog", type: "layout" as const },
    { path: "/sitemap.xml" }
  ];

  for (const target of targets) {
    try {
      if (target.type) {
        revalidatePath(target.path, target.type);
      } else {
        revalidatePath(target.path);
      }
    } catch (error) {
      // Payload also runs collection hooks from build-time Local API scripts,
      // where Next has no request cache store to invalidate.
      console.warn(
        `[products] Revalidation of ${target.path} was deferred:`,
        error instanceof Error
          ? error.message
          : "Next cache context is unavailable"
      );
    }
  }
}

/**
 * Product pages are revalidated only when their public state can change.
 * Draft-only saves stay fast and do not flush the public catalog cache.
 */
export const revalidateProductAfterChange: CollectionAfterChangeHook = ({
  doc,
  previousDoc
}) => {
  if (isPublished(doc) || isPublished(previousDoc)) {
    revalidatePublicCatalog();
  }

  return doc;
};

export const revalidateProductAfterDelete: CollectionAfterDeleteHook = ({
  doc
}) => {
  if (isPublished(doc)) {
    revalidatePublicCatalog();
  }
};
