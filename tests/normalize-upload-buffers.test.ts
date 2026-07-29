import { describe, expect, it } from "vitest";

import {
  copyToRegularBuffer,
  normalizeUploadBuffers
} from "@/lib/storage/normalize-upload-buffers";

describe("normalize upload buffers", () => {
  it("copies bytes into an ordinary ArrayBuffer", () => {
    const shared = new SharedArrayBuffer(4);
    const source = new Uint8Array(shared);
    source.set([11, 22, 33, 44]);

    const result = copyToRegularBuffer(source);

    expect([...result]).toEqual([11, 22, 33, 44]);
    expect(result.buffer).toBeInstanceOf(ArrayBuffer);
    expect(Object.prototype.toString.call(result.buffer)).toBe(
      "[object ArrayBuffer]"
    );
  });

  it("normalizes the original file and every generated image size", () => {
    const request = {
      file: {
        data: Buffer.from([1, 2, 3]),
        mimetype: "image/webp",
        name: "source.webp",
        size: 3
      },
      payloadUploadSizes: {
        thumb: Buffer.from([4, 5]),
        large: Buffer.from([6, 7, 8])
      }
    };

    const originalFile = request.file.data;
    const originalThumb = request.payloadUploadSizes.thumb;

    normalizeUploadBuffers(request as never);

    expect([...request.file.data]).toEqual([1, 2, 3]);
    expect([...request.payloadUploadSizes.thumb]).toEqual([4, 5]);
    expect([...request.payloadUploadSizes.large]).toEqual([6, 7, 8]);
    expect(request.file.data).not.toBe(originalFile);
    expect(request.payloadUploadSizes.thumb).not.toBe(originalThumb);
    expect(request.file.data.buffer).toBeInstanceOf(ArrayBuffer);
    expect(request.payloadUploadSizes.thumb.buffer).toBeInstanceOf(ArrayBuffer);
  });
});
