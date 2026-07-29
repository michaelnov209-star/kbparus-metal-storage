import type { CollectionBeforeChangeHook, PayloadRequest } from "payload";

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

export const normalizeUploadBuffersBeforeCloudStorage: CollectionBeforeChangeHook =
  ({ data, req }) => {
    normalizeUploadBuffers(req);
    return data;
  };
