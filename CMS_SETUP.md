# Payload CMS — устройство и настройка

## Актуально после стабилизации importMap от 2026-05-11

- Проект должен оставаться ESM-пакетом: в `package.json` обязательно `"type": "module"`.
- Импорты коллекций в `payload.config.ts` остаются без `.ts` расширений, например `./payload/collections/Users`. Это соответствует официальным Payload templates.
- `payload.config.ts` явно задаёт файл генерации: `admin.importMap.importMapFile = app/(payload)/admin/importMap.ts`.
- `npm run cms:generate-importmap` всегда запускает официальный Payload CLI. Команда больше не пропускается на Windows и не заменяется ручным importMap.
- Если importMap не генерируется, build должен падать до deploy. Это защита от сломанной админки.
- Lexical importMap-компоненты проверяются только при наличии реальных `richText` полей в схемах. Сейчас активных `richText` полей нет, поэтому importMap содержит только реально используемые admin-компоненты.
- На Vercel обязателен Node 22.x и env-переменные `PAYLOAD_SECRET`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED` или `POSTGRES_URL_NON_POOLING`, `BLOB_READ_WRITE_TOKEN`.

## Что такое Payload в этом проекте

Payload CMS 3 — это headless CMS, встроенный в наш Next.js-приложение. Живёт в одном репозитории и одном Vercel-проекте с публичным сайтом. Доступен по адресу **`/admin`**.

```
kbparus-metal-storage/
├── app/
│   ├── (payload)/
│   │   ├── admin/[[...segments]]/...   ← UI админки на /admin
│   │   ├── api/[...slug]/...           ← REST API на /api/<collection>
│   │   ├── layout.tsx                  ← Payload root layout
│   │   └── custom.scss                 ← кастом стили админки
│   ├── api/
│   │   ├── health/                     ← /api/health для мониторинга
│   │   └── leads/                      ← существующая форма заявок
│   └── ...                             ← публичный сайт
├── payload/
│   ├── collections/                    ← схемы данных
│   └── globals/
├── payload.config.ts                   ← главный конфиг
└── scripts/cms/                        ← preflight скрипты
```

## Архитектура данных

| Слой | Где хранится |
|------|-------------|
| Контент (товары, FAQ, контакты) | **Postgres** (Neon free tier через Vercel Marketplace) |
| Файлы (фото, видео) | **Vercel Blob** (1 ГБ free) |
| Код приложения | GitHub → Vercel deployments |

## Env-переменные

Все добавляются через **Vercel Dashboard → Project → Settings → Environment Variables**.

| Переменная | Источник | Назначение |
|------------|----------|-----------|
| `PAYLOAD_SECRET` | вручную (генерируется) | Ключ для подписи сессий админки. ≥32 символа. |
| `DATABASE_URL` | Neon integration | Connection string к Postgres (pooled, через pgbouncer) |
| `DATABASE_URL_UNPOOLED` | Neon integration | Direct connection (для DDL: schema push). **Критично!** |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob integration | Доступ к хранилищу файлов |

Опционально (для существующего функционала заявок):
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `BITRIX24_WEBHOOK_URL`

## Как создаётся БД-схема

При первом обращении Payload запускает Drizzle `db.push()` с `push: true` в config — автоматически создаёт/обновляет таблицы на основе TypeScript-схем коллекций.

**Критично:** push-операции (DDL) НЕ работают через Neon's pooled connection (pgbouncer). Используем **`DATABASE_URL_UNPOOLED`** для direct-соединения. Если у вас на Vercel есть только pooled — добавьте unpooled через Neon Console.

В нашем `payload.config.ts` подбор connection string идёт по приоритету:
```
DATABASE_URL_UNPOOLED → POSTGRES_URL_NON_POOLING → DATABASE_URL → POSTGRES_URL
```

## Как генерируется importMap

`importMap` — это объект, который Payload использует для разрешения client-компонентов плагинов в админке. Без правильного importMap кнопки/поля не рендерятся → пустая страница.

**Production-стратегия:** при каждом Vercel build автоматически выполняется `payload generate:importmap`, который перезаписывает `app/(payload)/admin/importMap.ts` свежим содержимым.

**Если CLI падает на Linux:** см. секцию Troubleshooting ниже.

**Локально на Windows + Node 24:** `payload generate:importmap` известно падает (баг tsx-loader на путях с пробелами). Поэтому файл коммитится в репо как ручной fallback. На Vercel build он перезаписывается.

**При добавлении нового плагина или richText feature:**
1. На Linux/Mac/WSL: `npm run cms:generate-importmap` → проверить diff → коммит
2. На Windows native: вручную добавить запись в `app/(payload)/admin/importMap.ts`, затем `npm run cms:check`
3. Vercel rebuild всё равно регенерирует на Linux — лучшая страховка

## Команды для разработчика

```bash
# Полная преflight-проверка CMS
npm run cms:check

# Регенерировать importMap (Linux/Mac, иначе — skip)
npm run cms:generate-importmap

# Принудительно push БД-схему (Linux/Mac, иначе — skip)
npm run cms:push-schema

# Полный Vercel-build локально (если есть env)
npm run vercel-build

# Локальная dev-разработка (без CMS-операций)
npm run dev

# Health check
curl http://localhost:3000/api/health
```

## Что делать при ошибках

### `getFromImportMap: PayloadComponent not found in importMap, key: '...'`

importMap не содержит запись для нужного клиентского компонента.

1. Запустить `npm run cms:generate-importmap` (на Linux/WSL/Vercel rebuild)
2. Если не помогает — добавить вручную в `importMap.ts` импорт компонента
3. Запустить `npm run cms:check` — должно пройти

### `relation "users" does not exist (code 42P01)`

Postgres-таблицы не созданы. Причины:
1. **`DATABASE_URL_UNPOOLED` не задан** — DDL не работает через pooled. Добавь в Vercel env vars.
2. **Schema push не прошёл при build** — проверить логи Vercel Build → должна быть строка `✓ Schema push complete`
3. **Подключились к другой Postgres-БД** — проверить что connection string правильный

Решение: нажать **Redeploy** в Vercel, который запустит build заново с `vercel-build` командой и push'нет схему.

### React #418 / hydration mismatch / blank /admin

1. Проверить что `next.config.mjs` имеет `serverExternalPackages` для `@payloadcms/db-postgres, sharp, drizzle-kit, drizzle-orm, pg`
2. Проверить что importMap содержит все нужные компоненты
3. Очистить кэш браузера (`Ctrl+Shift+R`)
4. Если всё ещё — открыть Vercel Function Logs → найти точный текст ошибки

### Server Components render error

Обычно означает что один из server components в `app/(payload)/` упал. Найти конкретный текст в Vercel Logs. Часто — отсутствует env var.

## CI/Vercel build flow

```
1. npm install                 (Vercel cache hit обычно)
2. node scripts/cms/check.mjs  (валидирует env, файлы, importMap)
3. node scripts/cms/safe-generate-importmap.mjs  (Linux: generate; Win: skip)
4. node scripts/cms/push-schema.mjs              (Linux: push; Win: skip)
5. node scripts/cms/check.mjs  (повторная проверка после генерации)
6. next build
7. Deploy
```

Если любой из шагов 2-5 падает — build останавливается, deploy НЕ идёт. Production не сломается из-за криво обновлённого CMS.

## Health endpoint

`GET /api/health` возвращает:

```json
{
  "status": "ok",
  "timestamp": "2026-05-10T...",
  "components": {
    "app": { "ok": true },
    "cms": { "ok": true, "collections": 6, "collectionNames": [...] },
    "storage": { "ok": true, "configured": true },
    "leadIntegrations": {
      "telegram": { "configured": true },
      "bitrix24": { "configured": false }
    }
  }
}
```

Используется для:
- Быстрой проверки после деплоя
- Uptime-мониторинга (cron job, Better Uptime, и т.п.)
- Подтверждения что schema push прошёл (collections > 0)

Безопасен — не раскрывает секреты, connection strings, содержимое БД.
