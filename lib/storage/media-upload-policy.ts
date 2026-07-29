export const MEDIA_UPLOAD_MAX_BYTES = 64 * 1024 * 1024;

export const MEDIA_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf"
] as const;

export function getBlobClientUploadPolicy(cacheControlMaxAge: number) {
  return {
    addRandomSuffix: true,
    allowedContentTypes: [...MEDIA_UPLOAD_MIME_TYPES],
    cacheControlMaxAge,
    maximumSizeInBytes: MEDIA_UPLOAD_MAX_BYTES
  };
}
