import type { CollectionBeforeChangeHook, PayloadRequest } from "payload";

const RAW_CLIENT_BLOB_CONTEXT_KEY =
  "_responsiveVercelBlobRawClientUpload";

export type RawClientBlobUpload = {
  filename: string;
  prefix?: string;
};

/**
 * Sharp can return SharedArrayBuffer-backed Buffers in Node.js 24 serverless
 * runtimes. Vercel Blob intentionally rejects those buffers when it builds the
 * request body. Copy the final Payload/Sharp output into ordinary ArrayBuffers
 * immediately before the cloud-storage hook captures it.
 */
export function copyToRegularBuffer(source: Uint8Array): Buffer {
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);
  return Buffer.from(copy.buffer);
}

export function normalizeUploadBuffers(req: PayloadRequest): void {
  if (req.file?.data) {
    req.file.data = copyToRegularBuffer(req.file.data);
  }

  if (req.payloadUploadSizes) {
    for (const [name, buffer] of Object.entries(req.payloadUploadSizes)) {
      req.payloadUploadSizes[name] = copyToRegularBuffer(buffer);
    }
  }
}

function clientUploadPrefix(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("prefix" in value)) {
    return undefined;
  }
  const prefix = (value as { prefix?: unknown }).prefix;
  return typeof prefix === "string" ? prefix : undefined;
}

/**
 * Payload downloads a direct client image, then Sharp changes its bytes and
 * creates responsive sizes. Clearing only the transformed request file's
 * marker makes cloud-storage upload the optimized original as well as sizes.
 */
export function prepareDirectClientImageForCloudStorage(
  req: PayloadRequest
): void {
  if (
    !req.file?.clientUploadContext ||
    !req.payloadUploadSizes ||
    Object.keys(req.payloadUploadSizes).length === 0
  ) {
    return;
  }

  req.context = req.context || {};
  req.context[RAW_CLIENT_BLOB_CONTEXT_KEY] = {
    filename: req.file.name,
    prefix: clientUploadPrefix(req.file.clientUploadContext)
  } satisfies RawClientBlobUpload;
  req.file.clientUploadContext = undefined;
}

export function consumeRawClientBlobUpload(
  req: PayloadRequest
): RawClientBlobUpload | undefined {
  const value = req.context?.[RAW_CLIENT_BLOB_CONTEXT_KEY];
  if (!value || typeof value !== "object" || !("filename" in value)) {
    return undefined;
  }
  delete req.context?.[RAW_CLIENT_BLOB_CONTEXT_KEY];
  const filename = (value as { filename?: unknown }).filename;
  const prefix = (value as { prefix?: unknown }).prefix;

  if (typeof filename !== "string") return undefined;
  return {
    filename,
    prefix: typeof prefix === "string" ? prefix : undefined
  };
}

export const normalizeUploadBuffersBeforeCloudStorage: CollectionBeforeChangeHook =
  ({ data, req }) => {
    normalizeUploadBuffers(req);
    prepareDirectClientImageForCloudStorage(req);
    return data;
  };
