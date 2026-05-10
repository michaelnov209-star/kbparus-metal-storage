import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "path";
import { fileURLToPath } from "url";

import { Users } from "./payload/collections/Users";
import { Media } from "./payload/collections/Media";
import { Categories } from "./payload/collections/Categories";
import { Subcategories } from "./payload/collections/Subcategories";
import { Products } from "./payload/collections/Products";
import { CalculatorProfiles } from "./payload/collections/CalculatorProfiles";
import { Contacts } from "./payload/globals/Contacts";
import { HomeContent } from "./payload/globals/HomeContent";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: " — Админка КБ Парус",
      icons: [{ rel: "icon", type: "image/png", url: "/brand/logo-g.png" }]
    }
  },
  collections: [Users, Media, Categories, Subcategories, Products, CalculatorProfiles],
  globals: [Contacts, HomeContent],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "change-me-locally",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts")
  },
  db: postgresAdapter({
    pool: {
      // Используем DIRECT (unpooled) connection. Drizzle push DDL не работает
      // через pgbouncer (Neon pooled). Vercel + Neon integration предоставляет
      // оба env var; Payload использует direct, runtime-запросы Next.js Lambda
      // и без того короткие — connection pool не критичен.
      connectionString:
        process.env.DATABASE_URL_UNPOOLED ||
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        ""
    },
    // Принудительно создаём/обновляем схему БД даже в production. Безопасно для
    // нашего масштаба (один dev). На зрелом production-deploy переключим на
    // controlled migrations через `payload migrate`.
    push: true,
    // Neon serverless через pgbouncer не поддерживает многооператорные транзакции.
    transactionOptions: false
  }),
  plugins: [
    vercelBlobStorage({
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || ""
    })
  ]
  // Убрали кастомный i18n — без импорта translation-пакетов он вызывает hydration
  // mismatch (server: ru, client: en). Подписи полей уже на русском через label: { ru }.
});
