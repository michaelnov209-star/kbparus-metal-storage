import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { ru } from "@payloadcms/translations/languages/ru";
import { attachDatabasePool } from "@vercel/functions";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

import {
  payloadCollections,
  payloadGlobals,
  Users
} from "./payload/admin/config-registry";
import { canManageMedia } from "./payload/access/rbac";
import {
  getDirectPostgresConnectionString,
  getPostgresConnectionString
} from "./lib/config/postgres";
import { getPayloadSecret } from "./lib/config/payload-secret";
import { responsiveVercelBlobStorage } from "./lib/storage/vercel-blob-responsive";
import {
  isSmtpConfigured,
  smtpSettingsFromEnv
} from "./lib/email/smtp-config";
import {
  getSiteUrl,
  getTrustedSiteOrigins
} from "./lib/seo/site";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const smtpSettings = smtpSettingsFromEnv(process.env);
const smtpFromName = process.env.SMTP_FROM_NAME?.trim() || "КБ Парус";
const payloadServerURL = getSiteUrl();
const payloadCsrfOrigins = getTrustedSiteOrigins(process.env);

async function createPayloadEmailAdapter() {
  if (!isSmtpConfigured(smtpSettings)) return undefined;

  const [{ nodemailerAdapter }, { getSmtpTransport }] = await Promise.all([
    import("@payloadcms/email-nodemailer"),
    import("./lib/email/smtp")
  ]);

  return nodemailerAdapter({
    defaultFromAddress: smtpSettings.from,
    defaultFromName: smtpFromName,
    transport: getSmtpTransport(smtpSettings),
    // Runtime sends expose delivery failures. Avoid an outbound SMTP
    // connection while Payload config is evaluated during Vercel builds.
    skipVerify: true
  });
}

const payloadEmail = await createPayloadEmailAdapter();

export default buildConfig({
  serverURL: payloadServerURL,
  csrf: payloadCsrfOrigins,
  admin: {
    user: Users.slug,
    avatar: "default",
    importMap: {
      baseDir: dirname,
      importMapFile: path.resolve(dirname, "app/(payload)/admin/importMap.ts")
    },
    components: {
      actions: [
        {
          path: "@/app/(payload)/components/AdminAccountMenu",
          exportName: "AdminAccountMenu"
        }
      ],
      providers: [
        {
          path: "@/app/(payload)/components/AdminTrainingProvider",
          exportName: "AdminTrainingProvider"
        }
      ],
      graphics: {
        Logo: {
          path: "@/app/(payload)/components/Logo",
          exportName: "Logo"
        },
        Icon: {
          path: "@/app/(payload)/components/Icon",
          exportName: "Icon"
        }
      },
      beforeLogin: [
        {
          path: "@/app/(payload)/components/LoginBranding",
          exportName: "LoginBranding"
        }
      ],
      beforeNavLinks: [
        {
          path: "@/app/(payload)/components/AdminWorkspaceNav",
          exportName: "AdminWorkspaceNav"
        }
      ],
      views: {
        dashboard: {
          Component: {
            path: "@/app/(payload)/components/AdminDashboardLoader",
            exportName: "AdminDashboardLoader"
          },
          meta: {
            title: "Обзор — КБ Парус"
          }
        },
        seo: {
          Component: {
            path: "@/app/(payload)/components/SeoReportingViewLoader",
            exportName: "SeoReportingViewLoader"
          },
          path: "/seo",
          exact: true,
          meta: {
            title: "SEO и позиции — КБ Парус"
          }
        },
        system: {
          Component: {
            path: "@/app/(payload)/components/AdminSystemViewLoader",
            exportName: "AdminSystemViewLoader"
          },
          path: "/system",
          exact: true,
          meta: {
            title: "Здоровье сайта — КБ Парус"
          }
        },
        integrations: {
          Component: {
            path: "@/app/(payload)/components/AdminIntegrationsViewLoader",
            exportName: "AdminIntegrationsViewLoader"
          },
          path: "/integrations",
          exact: true,
          meta: {
            title: "Интеграции — КБ Парус"
          }
        }
      }
    },
    meta: {
      titleSuffix: " — Админка КБ Парус",
      icons: [{ rel: "icon", type: "image/png", url: "/brand/logo-mark.png" }]
    },
    theme: "light"
  },
  i18n: {
    fallbackLanguage: "ru",
    supportedLanguages: { ru }
  },
  collections: payloadCollections,
  globals: payloadGlobals,
  email: payloadEmail,
  onInit: (payload) => {
    if (
      process.env.VERCEL === "1" &&
      process.env.PAYLOAD_MIGRATING !== "true"
    ) {
      attachDatabasePool(payload.db.pool);
    }
  },
  sharp,
  secret: getPayloadSecret(process.env),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts")
  },
  db: postgresAdapter({
    migrationDir: path.resolve(dirname, "migrations"),
    pool: {
      connectionString:
        process.env.PAYLOAD_MIGRATING === "true"
          ? getDirectPostgresConnectionString(process.env)
          : getPostgresConnectionString(process.env),
      ...(process.env.PAYLOAD_MIGRATING === "true"
        ? {}
        : {
            allowExitOnIdle: true,
            connectionTimeoutMillis: 10_000,
            idleTimeoutMillis: 5_000,
            max: 5
          })
    },
    push: false,
    // Runtime сохраняет прежний serverless-режим без многооператорных
    // транзакций. Migration wrapper включает настоящую транзакцию на direct URL.
    ...(process.env.PAYLOAD_MIGRATING === "true"
      ? {}
      : { transactionOptions: false as const })
  }),
  plugins: [
    responsiveVercelBlobStorage({
      collections: { media: true },
      cacheControlMaxAge: 31_536_000,
      clientUploads: {
        access: ({ req }) => canManageMedia(req.user)
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || ""
    })
  ]
});
