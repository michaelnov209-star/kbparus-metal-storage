import { cloudStoragePlugin } from "@payloadcms/plugin-cloud-storage";
import type {
  Adapter,
  ClientUploadsConfig,
  CollectionOptions
} from "@payloadcms/plugin-cloud-storage/types";
import {
  getFileKey,
  getFilePrefix,
  initClientUploads
} from "@payloadcms/plugin-cloud-storage/utilities";
import { BlobNotFoundError, del, head, put } from "@vercel/blob";
import { handleUpload as handleClientUpload } from "@vercel/blob/client";
import { posix } from "node:path";
import {
  APIError,
  Forbidden,
  type PayloadRequest,
  type Plugin,
  type UploadCollectionSlug
} from "payload";
import { getRangeRequestInfo } from "payload/internal";
import { getBlobClientUploadPolicy } from "./media-upload-policy";
import { consumeRawClientBlobUpload } from "./normalize-upload-buffers";

type ResponsiveVercelBlobStorageOptions = {
  cacheControlMaxAge?: number;
  clientUploads?: ClientUploadsConfig;
  collections: Partial<
    Record<
      UploadCollectionSlug,
      Omit<CollectionOptions, "adapter"> | true
    >
  >;
  enabled?: boolean;
  token: string | undefined;
  useCompositePrefixes?: boolean;
};

type FileURLArgs = {
  baseUrl: string;
  collectionPrefix?: string;
  filename: string;
  prefix?: string;
  useCompositePrefixes?: boolean;
};

const DEFAULT_CACHE_AGE = 31_536_000;
const CLIENT_HANDLER =
  "@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler";

function generateURL({
  baseUrl,
  collectionPrefix = "",
  filename,
  prefix,
  useCompositePrefixes = false
}: FileURLArgs) {
  const { fileKey } = getFileKey({
    collectionPrefix,
    docPrefix: prefix,
    filename,
    useCompositePrefixes
  });
  const directory = posix.dirname(fileKey);
  const encodedFilename = encodeURIComponent(posix.basename(fileKey));
  const encodedKey =
    directory === "."
      ? encodedFilename
      : posix.join(directory, encodedFilename);

  return `${baseUrl}/${encodedKey}`;
}

/**
 * Originals must be immutable and collision-safe. Payload-generated image-size
 * filenames must remain unchanged so their database URLs stay addressable.
 */
export function shouldAddBlobRandomSuffix(
  fileFilename: string,
  documentFilename: unknown
) {
  return (
    typeof documentFilename === "string" &&
    fileFilename === documentFilename
  );
}

function createClientUploadRoute({
  access,
  cacheControlMaxAge,
  token
}: {
  access?: Exclude<ClientUploadsConfig, boolean>["access"];
  cacheControlMaxAge: number;
  token: string;
}) {
  const canUpload =
    access ??
    (({ req }: { req: PayloadRequest }) => Boolean(req.user));

  return async (req: PayloadRequest) => {
    const body = await req.json?.();

    try {
      const response = await handleClientUpload({
        body,
        onBeforeGenerateToken: async (_pathname, collectionSlug) => {
          if (!collectionSlug) {
            throw new APIError("No collection was provided");
          }
          if (
            !(await canUpload({
              collectionSlug: collectionSlug as UploadCollectionSlug,
              req
            }))
          ) {
            throw new Forbidden();
          }

          return getBlobClientUploadPolicy(cacheControlMaxAge);
        },
        onUploadCompleted: async () => {},
        request: req as unknown as Request,
        token
      });

      return Response.json(response);
    } catch (error) {
      req.payload.logger.error(error);
      throw new APIError("Vercel Blob client upload failed");
    }
  };
}

function createAdapter({
  baseUrl,
  cacheControlMaxAge,
  clientUploads,
  token,
  useCompositePrefixes
}: {
  baseUrl: string;
  cacheControlMaxAge: number;
  clientUploads?: ClientUploadsConfig;
  token: string;
  useCompositePrefixes: boolean;
}): Adapter {
  return ({ collection, prefix = "" }) => ({
    name: "vercel-blob-responsive",
    clientUploads,
    generateURL: ({ filename, prefix: documentPrefix = "" }) =>
      generateURL({
        baseUrl,
        collectionPrefix: prefix,
        filename,
        prefix: documentPrefix,
        useCompositePrefixes
      }),
    handleDelete: async ({ doc, filename }) => {
      await del(
        generateURL({
          baseUrl,
          collectionPrefix: prefix,
          filename,
          prefix: doc.prefix,
          useCompositePrefixes
        }),
        { token }
      );
    },
    handleUpload: async ({ data, file, req }) => {
      const { fileKey } = getFileKey({
        collectionPrefix: prefix,
        docPrefix: data.prefix,
        filename: file.filename,
        useCompositePrefixes
      });
      const isOriginal = shouldAddBlobRandomSuffix(
        file.filename,
        data.filename
      );
      const result = await put(fileKey, file.buffer, {
        access: "public",
        addRandomSuffix: isOriginal,
        cacheControlMaxAge,
        contentType: file.mimeType,
        token
      });

      if (!isOriginal) return {};

      const rawClientUpload = consumeRawClientBlobUpload(req);
      if (rawClientUpload) {
        try {
          await del(
            generateURL({
              baseUrl,
              collectionPrefix: prefix,
              filename: rawClientUpload.filename,
              prefix: rawClientUpload.prefix,
              useCompositePrefixes
            }),
            { token }
          );
        } catch (error) {
          req.payload.logger.warn({
            err: error,
            msg: "Optimized image is ready, but its raw client-upload copy could not be removed"
          });
        }
      }

      return {
        filename: decodeURIComponent(
          posix.basename(result.pathname.replace(/^\/+/, ""))
        )
      };
    },
    staticHandler: async (
      req,
      {
        headers: incomingHeaders,
        params: {
          clientUploadContext,
          filename,
          prefix: prefixQueryParam
        }
      }
    ) => {
      try {
        const documentPrefix = await getFilePrefix({
          clientUploadContext,
          collection,
          filename,
          prefixQueryParam,
          req
        });
        const fileURL = generateURL({
          baseUrl,
          collectionPrefix: prefix,
          filename,
          prefix: documentPrefix,
          useCompositePrefixes
        });
        const metadata = await head(fileURL, { token });
        const uploadedAt = metadata.uploadedAt.toISOString();
        const etag = `"${fileURL.replace(`${baseUrl}/`, "")}-${uploadedAt}"`;
        const requestEtag =
          req.headers.get("etag") || req.headers.get("if-none-match");
        const range = getRangeRequestInfo({
          fileSize: metadata.size,
          rangeHeader: req.headers.get("range")
        });

        if (range.type === "invalid") {
          return new Response(null, {
            headers: new Headers(range.headers),
            status: range.status
          });
        }

        let headers = new Headers(incomingHeaders);
        for (const [key, value] of Object.entries(range.headers)) {
          headers.append(key, value);
        }
        headers.append(
          "Cache-Control",
          `public, max-age=${cacheControlMaxAge}`
        );
        headers.append("Content-Disposition", metadata.contentDisposition);
        headers.append("Content-Type", metadata.contentType);
        headers.append("ETag", etag);

        if (
          collection.upload &&
          typeof collection.upload === "object" &&
          collection.upload.modifyResponseHeaders
        ) {
          headers =
            collection.upload.modifyResponseHeaders({ headers }) || headers;
        }

        if (requestEtag === etag) {
          return new Response(null, { headers, status: 304 });
        }

        const response = await fetch(`${fileURL}?${uploadedAt}`, {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
            ...(range.type === "partial"
              ? {
                  Range: `bytes=${range.rangeStart}-${range.rangeEnd}`
                }
              : {})
          }
        });

        if (!response.ok || !response.body) {
          return new Response(null, { status: 204 });
        }

        headers.append("Last-Modified", uploadedAt);
        return new Response(response.body, {
          headers,
          status: range.status
        });
      } catch (error) {
        if (error instanceof BlobNotFoundError) {
          return new Response(null, { status: 404 });
        }
        req.payload.logger.error({
          err: error,
          msg: "Unexpected error in responsive Vercel Blob handler"
        });
        return new Response("Internal Server Error", { status: 500 });
      }
    }
  });
}

export const responsiveVercelBlobStorage =
  (options: ResponsiveVercelBlobStorageOptions): Plugin =>
  (incomingConfig) => {
    const storeId = options.token
      ?.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]
      ?.toLowerCase();
    const enabled = options.enabled !== false && Boolean(options.token);

    if (enabled && !storeId) {
      throw new Error("Invalid Vercel Blob token format");
    }

    const cacheControlMaxAge =
      options.cacheControlMaxAge ?? DEFAULT_CACHE_AGE;
    const useCompositePrefixes = options.useCompositePrefixes ?? false;
    const baseUrl = `https://${storeId}.public.blob.vercel-storage.com`;
    const clientUploadAccess =
      typeof options.clientUploads === "object"
        ? options.clientUploads.access
        : undefined;

    initClientUploads({
      clientHandler: CLIENT_HANDLER,
      collections: options.collections,
      config: incomingConfig,
      enabled: enabled && Boolean(options.clientUploads),
      extraClientHandlerProps: () => ({
        addRandomSuffix: true,
        useCompositePrefixes
      }),
      serverHandler: createClientUploadRoute({
        access: clientUploadAccess,
        cacheControlMaxAge,
        token: options.token ?? ""
      }),
      serverHandlerPath: "/vercel-blob-client-upload-route"
    });

    if (!enabled || !options.token || !storeId) {
      return incomingConfig;
    }

    const adapter = createAdapter({
      baseUrl,
      cacheControlMaxAge,
      clientUploads: options.clientUploads,
      token: options.token,
      useCompositePrefixes
    });
    const collections = Object.fromEntries(
      Object.entries(options.collections).map(([slug, value]) => [
        slug,
        {
          ...(value === true ? {} : value),
          adapter
        }
      ])
    ) as Partial<Record<UploadCollectionSlug, CollectionOptions>>;

    return cloudStoragePlugin({
      collections,
      useCompositePrefixes
    })(incomingConfig);
  };
