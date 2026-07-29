export type CmsMediaSize =
  | "thumb"
  | "medium"
  | "large"
  | "cardSm"
  | "cardMd"
  | "cardLg";

type CmsMediaLike = {
  url?: unknown;
  filename?: unknown;
  alt?: unknown;
  sizes?: Record<string, { url?: unknown; filename?: unknown } | undefined> | null;
};

interface ResolveCmsMediaUrlOptions {
  size?: CmsMediaSize;
  fallback?: string;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function mediaFileUrl(filename: string) {
  return `/api/media/file/${filename}`;
}

export function isLocalCmsMediaUrl(value: string) {
  if (value.startsWith("/api/media/file/")) return true;

  try {
    return new URL(value).pathname.startsWith("/api/media/file/");
  } catch {
    return false;
  }
}

/**
 * Current catalog records created before the Blob filename fix contain valid
 * originals but unusable generated-size paths. Keep their optimized, versioned
 * public fallback until those records are reprocessed. New editor uploads do
 * not have a legacy fallback and therefore use the CMS/Blob URL directly.
 */
export function resolveCmsMediaUrl(
  value: unknown,
  { size, fallback }: ResolveCmsMediaUrlOptions = {}
): string | undefined {
  if (!value || typeof value !== "object") return fallback;

  const media = value as CmsMediaLike;
  const sized = size ? media.sizes?.[size] : undefined;
  const candidate =
    asString(sized?.url) ??
    (asString(sized?.filename) ? mediaFileUrl(asString(sized?.filename)!) : undefined) ??
    asString(media.url) ??
    (asString(media.filename) ? mediaFileUrl(asString(media.filename)!) : undefined);

  if (!candidate) return fallback;
  if (fallback && isLocalCmsMediaUrl(candidate)) return fallback;
  return candidate;
}

export function resolveCmsMediaAlt(
  value: unknown,
  fallback?: string
): string | undefined {
  if (!value || typeof value !== "object") return fallback;
  return asString((value as CmsMediaLike).alt) ?? fallback;
}
