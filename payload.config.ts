import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { ru } from "@payloadcms/translations/languages/ru";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

import { Users } from "./payload/collections/Users";
import { Media } from "./payload/collections/Media";
import { Categories } from "./payload/collections/Categories";
import { Subcategories } from "./payload/collections/Subcategories";
import { Products } from "./payload/collections/Products";
import { CalculatorProfiles } from "./payload/collections/CalculatorProfiles";
import { Leads } from "./payload/collections/Leads";
import { Contacts } from "./payload/globals/Contacts";
import { HomeContent } from "./payload/globals/HomeContent";
import { LeadManagement } from "./payload/globals/LeadManagement";
import { SiteNavigation } from "./payload/globals/SiteNavigation";
import {
  getDirectPostgresConnectionString,
  getPostgresConnectionString
} from "./lib/config/postgres";
import { getPayloadSecret } from "./lib/config/payload-secret";
import {
  isSmtpConfigured,
  smtpSettingsFromEnv
} from "./lib/email/smtp-config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const smtpSettings = smtpSettingsFromEnv(process.env);
const smtpFromName = process.env.SMTP_FROM_NAME?.trim() || "КБ Парус";

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
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: dirname,
      importMapFile: path.resolve(dirname, "app/(payload)/admin/importMap.ts")
    },
    components: {
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
          path: "@/app/(payload)/components/SeoNavLink",
          exportName: "SeoNavLink"
        }
      ],
      beforeDashboard: [
        {
          path: "@/app/(payload)/components/AdminDashboard",
          exportName: "AdminDashboard"
        }
      ],
      views: {
        seo: {
          Component: {
            path: "@/app/(payload)/components/SeoReportingView",
            exportName: "SeoReportingView"
          },
          path: "/seo",
          exact: true,
          meta: {
            title: "SEO и позиции — КБ Парус"
          }
        }
      }
    },
    meta: {
      titleSuffix: " — Админка КБ Парус",
      icons: [{ rel: "icon", type: "image/png", url: "/brand/logo-g.png" }]
    },
    theme: "light"
  },
  i18n: {
    fallbackLanguage: "ru",
    supportedLanguages: { ru }
  },
  collections: [Users, Media, Categories, Subcategories, Products, CalculatorProfiles, Leads],
  globals: [HomeContent, Contacts, LeadManagement, SiteNavigation],
  email: payloadEmail,
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
          : getPostgresConnectionString(process.env)
    },
    push: false,
    // Runtime сохраняет прежний serverless-режим без многооператорных
    // транзакций. Migration wrapper включает настоящую транзакцию на direct URL.
    ...(process.env.PAYLOAD_MIGRATING === "true"
      ? {}
      : { transactionOptions: false as const })
  }),
  plugins: [
    vercelBlobStorage({
      collections: { media: true },
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN || ""
    })
  ]
});
