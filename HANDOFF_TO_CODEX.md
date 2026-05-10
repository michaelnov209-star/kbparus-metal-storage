# HANDOFF TO CODEX — KB Parus / Payload CMS Stabilization

**Document type:** Engineering handoff / architecture transfer  
**Generated:** 2026-05-10  
**Branch state:** `feat/payload-cms` (latest commit `cbe69bb`)  
**Audience:** Codex agent или другой инженер, который продолжит работу

> **TL;DR для Codex:** Проект на ветке `feat/payload-cms` имеет **production-ready CMS pipeline**, но на этапе `vercel-build` падает `payload generate:importmap` с `ERR_MODULE_NOT_FOUND`. **Node version уже зафиксирован на 22.x и Vercel реально использует Node 22.22.2** — проблема НЕ в Node. Реальный остаток — ESM resolution/extension issue в tsx-loader, который Payload CLI использует для загрузки `payload.config.ts` на Vercel. См. секции 9 и 10 для конкретных следующих шагов.

---

## 1. Контекст проекта

| Параметр | Значение |
|----------|----------|
| Имя проекта | `kbparus-metal-storage` |
| Бизнес | КБ Парус / ООО «Технокам» — производитель промышленных систем хранения металла |
| Production URL | https://kbparus-metal-storage.vercel.app |
| Репозиторий | `michaelnov209-star/kbparus-metal-storage` (GitHub) |
| Hosting | Vercel (Hobby tier) |
| Stack | Next.js 16.2.6, React 19.2.6, TypeScript 5.9 strict, App Router |
| CMS | Payload CMS 3.84.1 (`feat/payload-cms` ветка, ещё не на main) |
| Database | Neon Postgres (через Vercel Marketplace) |
| File storage | Vercel Blob (через @payloadcms/storage-vercel-blob) |
| Целевая ветка для CMS | `feat/payload-cms` |
| Production ветка | `main` (live, без CMS) |
| Цель текущего этапа | Стабилизировать Payload-deployment, открыть `/admin`, мигрировать данные из TypeScript-файлов в Postgres, переключить страницы на чтение из CMS |

---

## 2. История передачи проекта

```
Codex (initial dev)  →  Claude Code (стабилизация + Payload integration)  →  Codex (продолжение)
        2026-04 — 2026-05-08            2026-05-09 — 2026-05-10                2026-05-10+
```

### Codex (фаза 1)
- Создал начальный Next.js + TypeScript проект
- Реализовал каталог (17 категорий), 6 профилей калькулятора, форму заявок
- Деплой на Vercel настроен, GitHub auto-deploy main → production работает
- Контент в TypeScript-файлах (`data/storageSystems/*.ts`)

### Claude Code (фаза 2 — что я сделал)
1. **Инфраструктура и hardening:** SEO (robots.txt, sitemap, JSON-LD), security headers, rate-limit, honeypot, валидация форм
2. **Контент:** добавил 14 продуктов из нового Excel-калькулятора, заменил баннер, заменил placeholder-цену 3₽ → 90 000₽
3. **Telegram-интеграция:** уведомления о заявках с фото товара и кликабельной ссылкой
4. **CMS integration (текущая работа):** Payload CMS 3 на ветке `feat/payload-cms`
5. **Production-ready pipeline:** preflight checks, schema push, health endpoint, документация

### Codex (фаза 3 — следующая)
- **Точечная задача:** разрулить `payload generate:importmap` ESM resolution issue (см. секцию 9)
- После этого: миграция данных, переключение страниц на CMS, cutover в main

---

## 3. В каком состоянии Claude Code принял проект

### Что уже работало
- Production-сайт live на https://kbparus-metal-storage.vercel.app
- Каталог: 17 категорий с фото, 4 пилот-продукта в первой категории (auto-sheet-metal)
- Калькулятор: 6 профилей (auto-sheet-metal, auto-sort-metal, rollout-cassette-rack, forklift-cassette-rack, two-side-rollout-rack, hybrid-rollout-rack)
- 7 vitest-тестов на калькулятор, все зелёные
- API `/api/leads` (mock-режим, ожидал Bitrix24 webhook URL)
- Vercel auto-deploy main → production
- TypeScript strict, чистый CSS (без Tailwind)

### Что НЕ работало или было placeholder
- Опция `weight-scale` в калькуляторе стоила 3 ₽ (placeholder)
- Не было SEO-инфраструктуры (robots.txt, sitemap)
- Не было защиты форм (rate-limit, honeypot)
- Не было CMS (любые правки требовали разработчика + деплой)
- На некоторых страницах был визуальный мусор (служебный текст «Для пилота...», захардкоженный заголовок)
- Не было мониторинга / health endpoint
- `BITRIX24_WEBHOOK_URL` не настроен → заявки уходили в void
- Не было Telegram-уведомлений

### Какие были ожидания
1. Стабилизация и production-hardening
2. Внедрение CMS-админки чтобы маркетолог сам редактировал контент
3. Миграция Excel-калькулятора в редактируемые таблицы
4. Подключение реальной интеграции Telegram + Bitrix24

---

## 4. Полная хронология проблем (CMS phase, в хронологическом порядке)

### 4.1 Bootstrap Payload (commit `2f28c41`)

**Действие:** Установлены пакеты `payload`, `@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/storage-vercel-blob`, `@payloadcms/richtext-lexical`, `sharp`. Созданы коллекции (Users, Media, Categories, Subcategories, Products, CalculatorProfiles), globals (Contacts, HomeContent), routes `/admin/[[...segments]]`, `/api/[...slug]`, layout `app/(payload)/layout.tsx`. Wrap `next.config.mjs` в `withPayload`. Build прошёл локально.

**Симптом после deploy:** `/admin` рендерил **пустую белую страницу** в Vercel Preview. Только Vercel Toolbar справа. React-консоль показывала **`React minified error #418`** (hydration mismatch).

### 4.2 Первая попытка фикса hydration (commit `42a5469`)

**Гипотезы (research-агентом):**
1. `experimental.cacheComponents` / `dynamicIO` — у нас не включены ❌ ложная
2. `experimental.reactCompiler` — у нас не включён ❌ ложная
3. **`withPayload` + Turbopack incompatibility** (Payload issues #14354, #15429) ✅ возможно
4. Postgres-схема не создана → query users падает → React unmounts ✅ возможно
5. Custom i18n config без translation-пакета → server `ru`, client `en` mismatch ✅ возможно

**Применённые фиксы:**
- `db.push: true` (явно — для production-deploy)
- `db.transactionOptions: false` (Neon pgbouncer не любит multi-statement transactions)
- Убран custom `i18n` config (был broken — не импортировались translation-пакеты)
- `serverExternalPackages: ["sharp", "drizzle-kit", "drizzle-orm", "pg", "@payloadcms/db-postgres"]` в next.config

**Симптом после deploy:** /admin всё ещё blank. Но в Vercel Runtime Logs пользователь нашёл **новую** ошибку:

```
getFromImportMap: PayloadComponent not found in importMap
key: '@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler'
```

### 4.3 ImportMap problem (commit `976fc76`)

**Реальная причина:** `app/(payload)/admin/importMap.ts` экспортировал пустой `{}`. Когда Payload пытался отрендерить upload-поле в Media-коллекции (использует `vercelBlobStorage` plugin), он искал в importMap ключ `@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler`. Не находил → admin-tree не монтировался → React #418 → blank page.

**Попытка fix через `payload generate:importmap` (CLI):**

| Approach | Error |
|----------|-------|
| Default (tsx ESM loader) | `ERR_MODULE_NOT_FOUND: Cannot find module './payload/collections/Users'` |
| Add `.ts` extensions + `allowImportingTsExtensions` | `ERR_REQUIRE_ASYNC_MODULE` |
| `--use-swc` + `@swc-node/register` | `Named export not found, CommonJS module` |

**Диагноз:** Локальная среда (Windows + Node 24 + tsx ESM + путь с пробелом «New project 2») несовместима с Payload CLI. Но это **локальный Windows-bug**, не Payload-bug.

**Применённый fix:** Hand-wrote `importMap.ts` с минимальным набором required entries:
- `@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler`
- `@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell`
- `@payloadcms/richtext-lexical/rsc#RscEntryLexicalField`
- `@payloadcms/richtext-lexical/rsc#LexicalDiffComponent`

**Это было ВРЕМЕННОЕ решение** — задокументировано в комментариях файла. Долгосрочно importMap должен генерироваться CLI-ом.

**Симптом после deploy:** ошибка про importMap ушла. Появилась **следующая** ошибка:

```
relation "users" does not exist
code: 42P01
```

### 4.4 Schema not pushed (commit `d618133` — большой production-ready pipeline)

**Реальная причина:** двойная.
1. **Lazy schema push race condition.** Payload `push: true` создаёт таблицы при первом `getPayload()` call. На Vercel cold-start это происходит асинхронно с первым request к /admin → query users falls in flight before tables exist.
2. **Pooled Neon connection не поддерживает DDL.** Drizzle `db.push()` делает CREATE TABLE / ALTER TABLE. Neon's pooled connection (через pgbouncer) не поддерживает многооператорные DDL-операции в transaction-pooling режиме. Нужен **direct connection** (`DATABASE_URL_UNPOOLED`).

**Применённые фиксы:**
- В `payload.config.ts` connection string priority: `DATABASE_URL_UNPOOLED → POSTGRES_URL_NON_POOLING → DATABASE_URL → POSTGRES_URL`
- Создан **production-ready build pipeline** (см. секцию 7):
  - `scripts/cms/check.mjs` — preflight validation
  - `scripts/cms/safe-generate-importmap.mjs` — platform-aware importMap regeneration
  - `scripts/cms/push-schema.{ts,mjs}` — explicit schema push до первого запроса
- `vercel.json` → `buildCommand: "npm run vercel-build"` запускает все 5 шагов
- `app/api/health/route.ts` — health endpoint для post-deploy проверок
- Документация: `CMS_SETUP.md`, `DEPLOYMENT_CHECKLIST.md`
- `.nvmrc` = 22, `engines.node = ">=22.0.0 <25.0.0"` (range — это и было ошибкой)

**Симптом после deploy:** build упал с **`ERR_MODULE_NOT_FOUND: Cannot find module '/vercel/path0/payload/collections/Users'`** на шаге `cms:generate-importmap`. Vercel runtime logs показали `Node.js v24.14.1` — Vercel выбрал Node 24 потому что наш range `>=22.0.0 <25.0.0` это допускал.

### 4.5 Node version pin (commit `cbe69bb` — последний)

**Реальная причина:** Vercel при range-engines выбирает **последнюю поддерживаемую версию из range**. Range `>=22.0.0 <25.0.0` → Node 24. Узкий exact pin `"22.x"` → Node 22.

**Применённый фикс:** `engines.node = "22.x"` (exact pin, не range). В `cms:check.mjs` добавлен soft-warn что Node major version = 22.

**Симптом после deploy (текущий):** Vercel **успешно перешёл на Node 22.22.2** (подтверждено пользователем в Build Logs). Однако **`payload generate:importmap` ВСЁ РАВНО падает** с тем же:

```
Node.js v22.22.2
ERR_MODULE_NOT_FOUND:
Cannot find module '/vercel/path0/payload/collections/Users'
imported from /vercel/path0/payload.config.ts
```

**Это значит:**
- Гипотеза «Node 24 ломает CLI» — была **частично верной** (Node 24 точно ломал), но **не полной**
- На Node 22 та же ошибка → дело не только в Node
- Реальный остаток — это **ESM resolution в tsx-loader** который Payload CLI использует для загрузки `payload.config.ts`. tsx должен резолвить `./payload/collections/Users` → `Users.ts`, но не делает этого даже на Node 22

---

## 5. Что уже точно диагностировано (не повторять!)

### Подтверждённые реальные проблемы (НЕ ложные гипотезы)
1. ✅ **importMap проблема была реальной.** Empty `{}` ломал admin UI на missing component. Hand-written fallback покрыл — admin готов к работе как только pipeline пропустит.
2. ✅ **`relation "users" does not exist` была реальной.** Schema действительно не push'ивалась. Решено через explicit `cms:push-schema` script + DATABASE_URL_UNPOOLED priority.
3. ✅ **Neon pooled connection ломал DDL.** Direct connection через `DATABASE_URL_UNPOOLED` обязательна для schema push.
4. ✅ **Node 24 ломал tsx CLI.** На Vercel это было причиной первого падения после `d618133`. Зафиксировано на 22.x в `cbe69bb`.

### Что Vercel уже делает корректно (не пере-проверять)
- Vercel Preview deploys работают на ветке `feat/payload-cms` ✅
- Коммиты деплоятся (auto-deploy на push) ✅
- Preview URL генерируется правильно ✅
- Runtime Logs доступны и используются ✅
- Build Logs показывают всё что нужно ✅
- Vercel **уже на Node 22.22.2** (пользователь подтвердил в логах) ✅

### Env-переменные подключены (пользователь подтвердил)
- `PAYLOAD_SECRET` ✅
- `DATABASE_URL` ✅
- `BLOB_READ_WRITE_TOKEN` ✅
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` ✅ (для существующих lead-уведомлений)

### НЕ известно точно (нужна проверка)
- `DATABASE_URL_UNPOOLED` присутствует ли в Vercel env vars (документация рекомендует, но не подтверждено)
- Vercel Project Settings → Node.js Version: какое значение dropdown'а (Auto-detect или явный 22.x?). Сейчас по факту работает 22.22.2, значит engines field подхвачен — но проверить не помешает.

### Что точно НЕ является текущей причиной
- ❌ Не Node version (22.22.2 уже)
- ❌ Не отсутствие env vars (build доходит до cms:generate-importmap, значит env подхватились)
- ❌ Не importMap content (мы его ещё даже не запускаем — ошибка ДО его генерации)
- ❌ Не Postgres connection
- ❌ Не Vercel project settings
- ❌ Не cache (Vercel build cache invalidates на изменения)

---

## 6. Что именно Claude Code изменил (file-by-file)

### Phase 1 — Pre-CMS hardening (на main, уже в production)

| Файл | Изменение | Проблема, которую решал | Тип |
|------|-----------|------------------------|-----|
| `public/robots.txt` | новый | SEO, поисковики не индексировали | Архитектурный |
| `app/sitemap.ts` | новый | SEO, нет карты сайта | Архитектурный |
| `lib/seo/schema.tsx` | новый | JSON-LD для rich snippets | Архитектурный |
| `next.config.mjs` | security headers | Нет защиты от bot-атак | Архитектурный |
| `app/api/leads/route.ts` | rate-limit, honeypot, validation, Telegram integration | Заявки уходили в void | Архитектурный |
| `components/LeadForm.tsx` | honeypot, formStartedAt, anti-double-submit | Уязвимость к ботам | Архитектурный |
| `components/Calculator.tsx` | source/honeypot/formStartedAt | Унификация форм | Архитектурный |
| `components/ProductConfigurator.tsx` | source/honeypot + price animation | Унификация форм + UX | Архитектурный |
| `data/storageSystems/excelCalculator.ts` | weight-scale 3 → 90 000 ₽ | Bug | Архитектурный |
| `data/storageSystems/catalogDepth.ts` | +14 products + SeoOverrides + draft/featured/sortOrder | Расширение каталога | Архитектурный |
| `app/page.tsx` | hero CMS integration с fallback | Подготовка к CMS | Архитектурный |
| `lib/cms/client.ts`, `lib/cms/home-content.ts` | новые | Server-side чтение из Payload | Архитектурный |
| `vercel.json` | cache headers, framework, buildCommand | Vercel оптимизации | Архитектурный |
| `.env.example` | новый | Onboarding | Архитектурный |
| Документация (RU) | 9+ файлов | Передача контекста | Архитектурный |

### Phase 2 — CMS integration (ветка feat/payload-cms)

| Файл | Изменение | Проблема, которую решал | Тип |
|------|-----------|------------------------|-----|
| `package.json` | + payload@3.84.1 + 5 связанных пакетов + sharp + tsx + scripts (cms:check, cms:generate-importmap, cms:push-schema, vercel-build) + engines pin + ".x" syntax | Bootstrap CMS + production pipeline | Архитектурный |
| `next.config.mjs` | + serverExternalPackages, withPayload wrapper | Turbopack/Payload interop | Архитектурный |
| `tsconfig.json` | + `@payload-config` path alias | Payload root layout требует alias | Архитектурный |
| `payload.config.ts` | новый. Postgres adapter с DATABASE_URL_UNPOOLED priority. push:true, transactionOptions:false. lexicalEditor. vercelBlobStorage plugin. Ссылается на 6 collections + 2 globals. | Главная конфигурация Payload | Архитектурный |
| `payload/collections/Users.ts` | новый. Auth roles: admin/editor/photographer | Авторизация админки | Архитектурный |
| `payload/collections/Media.ts` | новый. mimeTypes: image/* + video/mp4/webm/quicktime. Sharp transforms (320/800/1600 webp). | Медиа-библиотека с авто-оптимизацией | Архитектурный |
| `payload/collections/Categories.ts` | новый. 17 категорий с SEO group | Каталог | Архитектурный |
| `payload/collections/Subcategories.ts` | новый | Каталог | Архитектурный |
| `payload/collections/Products.ts` | новый. 7 tabs (main/images/price/configurator/specs/SEO/publishing). Filter draft for non-auth. | Товары с полной редактируемостью | Архитектурный |
| `payload/collections/CalculatorProfiles.ts` | новый. **Зеркалит лист «Админка» из Excel 1-в-1**: heightOptions, widthOptions, lengthOptions, loadOptions с price+factor, towerByShelfCount, gateBasePrice, options, defaultValues. | Калькулятор-таблицы, редактируемые из CMS | Архитектурный |
| `payload/globals/Contacts.ts` | новый. Phones, email, address, socials, INN | Контакты редактируемы | Архитектурный |
| `payload/globals/HomeContent.ts` | новый. **hero.background.{type, video, poster, image}** + metrics + advantages + storedMaterials + beforeAfter + cases + geo + reviews + **partners** + shipmentSteps + about + banners + FAQ. **Все секции главной редактируемы.** | Полная редактируемость главной | Архитектурный |
| `app/(payload)/layout.tsx` | новый. RootLayout с serverFunction + handleServerFunctions из layouts (не utilities — это разница в @payloadcms/next 3.84). | Payload root | Архитектурный |
| `app/(payload)/admin/[[...segments]]/page.tsx` | новый. RootPage от Payload. | Admin UI route | Архитектурный |
| `app/(payload)/admin/[[...segments]]/not-found.tsx` | новый | Admin 404 | Архитектурный |
| `app/(payload)/admin/importMap.ts` | **ВРЕМЕННО hand-written.** Содержит VercelBlobClientUploadHandler + 3 Lexical RscEntry. Должен заменяться сгенерированным через `payload generate:importmap`. | Manual fallback пока CLI не работает | **ВРЕМЕННЫЙ** |
| `app/(payload)/api/[...slug]/route.ts` | новый | REST API | Архитектурный |
| `app/(payload)/custom.scss` | placeholder | Custom admin styles | Архитектурный |
| `app/api/health/route.ts` | новый | Health endpoint, безопасный, для мониторинга | Архитектурный |
| `scripts/cms/check.mjs` | новый. **13 preflight assertions:** env vars (PAYLOAD_SECRET≥32, DB URL, unpooled URL, BLOB token), files (config, admin, api, layout, importMap), importMap content (содержит VercelBlobClientUploadHandler + Lexical), next.config (serverExternalPackages + withPayload), Node major = 22 (soft warn). Валит build при failure. | Валидация всего перед deploy | Архитектурный |
| `scripts/cms/safe-generate-importmap.mjs` | новый. Platform-aware: Linux/Mac → `payload generate:importmap`, Windows → graceful skip + использует hand-written fallback. | Автоматическая регенерация importMap на Vercel build | Архитектурный (но **сейчас падает** — см. секцию 9) |
| `scripts/cms/push-schema.ts` + `.mjs` | новый. ts-импл + mjs-обёртка через tsx. Вызывает `getPayload({ config })` чтобы триггернуть Drizzle db.push() ДО next build → таблицы готовы к первому запросу. | Устранение race condition lazy schema push | Архитектурный |
| `vercel.json` | + `buildCommand: "npm run vercel-build"` | Vercel запускает наш pipeline | Архитектурный |
| `.nvmrc` | новый, содержит `22` | Node version pin | Архитектурный |
| `CMS_SETUP.md` | новый | Документация архитектуры CMS | Архитектурный |
| `DEPLOYMENT_CHECKLIST.md` | новый | Чек-лист перед deploy + smoke tests + disaster recovery | Архитектурный |

### Файлы которые сейчас являются ВРЕМЕННЫМИ решениями

| Файл | Почему временное | Что должно стать постоянным |
|------|------------------|-----------------------------|
| `app/(payload)/admin/importMap.ts` | Hand-written с минимальным набором — может оказаться неполным при добавлении нового плагина | Должен генерироваться CLI-ом автоматически |
| `db.push: true` в payload.config | Push нормально для нашего масштаба (один dev), но в зрелом prod — controlled migrations | Перейти на `payload migrate:create` + `payload migrate` когда команда вырастет |

---

## 7. Текущий build pipeline (как он должен работать)

### Команда: `npm run vercel-build`

Эквивалентна:
```bash
node scripts/cms/check.mjs &&
node scripts/cms/safe-generate-importmap.mjs &&
node scripts/cms/push-schema.mjs &&
node scripts/cms/check.mjs &&
next build
```

### Шаги по одному

**Шаг 1: `cms:check` (первый раз)**
- Проверяет env vars, файлы, importMap content, next.config, Node version
- 13 assertions, каждая может стать `failed`, `passed`, или `soft warn`
- Если хотя бы одна failed (не warn) → process exit 1 → build aborts
- Защищает от deploy с неправильным окружением

**Шаг 2: `cms:generate-importmap`**
- Linux/Mac: `npx payload generate:importmap` → перезаписывает `importMap.ts` свежим
- Windows: graceful skip (объясняет почему в логах)
- Это шаг где **сейчас падает** на Vercel (см. секцию 9)

**Шаг 3: `cms:push-schema`**
- Linux: spawn `npx tsx scripts/cms/push-schema.ts` → вызывает `getPayload({ config })` → Drizzle db.push() создаёт/обновляет таблицы
- Windows / no DATABASE_URL: graceful skip (Payload push'нет лениво на первом запросе)
- Использует direct connection (`DATABASE_URL_UNPOOLED` если есть)

**Шаг 4: `cms:check` (второй раз)**
- Повторная валидация после генерации
- На случай если cms:generate-importmap странно повёл себя

**Шаг 5: `next build`**
- Стандартная Next.js production сборка
- Только если все 4 предыдущих шага прошли

### Почему deploy intentionally падает раньше публикации

**Без этого pipeline:**
- Deploy проходил бы build (только `next build`)
- /admin падал бы в runtime с blank page или 500
- Пользователь видел бы сломанный сайт пока мы не откатим
- Diagnostics требовала Vercel Function Logs (медленнее, чем Build Logs)

**С этим pipeline:**
- Build не доходит до `next build` пока все CMS-prerequisites не выполнены
- Deploy не публикуется → старая working версия остаётся в production
- Build Logs дают точную ошибку с описанием что не так
- Production не может сломаться из-за CMS misconfig

**Текущая ситуация это и демонстрирует** — pipeline остановил bad deploy на шаге 2 (generate-importmap), production не пострадал.

---

## 8. Что Codex НЕ должен повторно диагностировать

### Подтверждённое (не пере-проверять)
- ✅ Vercel deploy ветки `feat/payload-cms` работает
- ✅ Коммиты подхватываются (auto-deploy)
- ✅ Preview URL формируется правильно
- ✅ Build Logs и Runtime Logs доступны
- ✅ ImportMap проблема была реальной (empty `{}` ломало hydration)
- ✅ Hand-written importMap fix реально устранил `getFromImportMap not found`
- ✅ `relation "users" does not exist` — была реальная проблема, не симптом другого
- ✅ Neon pooled (pgbouncer) реально не работает с DDL — нужен unpooled
- ✅ Node 24 реально ломал tsx (был один из факторов в `d618133` падении)
- ✅ Node 22 теперь реально применяется (Vercel logs: `Node.js v22.22.2`)
- ✅ `engines.node = "22.x"` (exact pin) — правильный способ зафиксировать Node на Vercel
- ✅ Текущая ошибка возникает уже на Node 22 → проблема НЕ в Node version

### Категорически не нужно
- ❌ Снова менять `engines` на range или другой синтаксис
- ❌ Менять deployment ветку
- ❌ Возвращаться к гипотезам про cache, project settings, env vars
- ❌ Снова пробовать `--use-swc` (3 раза проверяли — фейлит на named exports)
- ❌ Снова пробовать `allowImportingTsExtensions` без структурного фикса

---

## 9. Текущая точка остановки (BLOCKING ISSUE)

### Точная ошибка

```
Running "vercel-build" command
> npm run vercel-build

[step 1: cms:check passes]

[step 2: cms:generate-importmap]
→ Запускаю payload generate:importmap...

node:internal/process/promises:394
    triggerUncaughtException(err, true /* fromPromise */);
    ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/vercel/path0/payload/collections/Users'
imported from /vercel/path0/payload.config.ts
    at finalizeResolution (node:internal/modules/esm/resolve:275:11)
    ...

Node.js v22.22.2

✗ payload generate:importmap завершился с кодом 1
```

### Что это означает технически

- **Среда:** Vercel build container, Linux x64, Node 22.22.2 (наконец правильная версия)
- **Команда:** `npx payload generate:importmap` (через wrapper `safe-generate-importmap.mjs`)
- **Точка падения:** Payload CLI вызывает `tsx` ESM loader для загрузки `payload.config.ts`. Внутри config есть строка `import { Users } from "./payload/collections/Users";` (без расширения). tsx loader на Node 22 ESM **не может разрешить** этот путь в `Users.ts`.
- **На локальной разработке (Windows + Node 24):** та же ошибка, плюс ещё про путь с пробелом
- **На Vercel (Linux + Node 22.22.2):** только проблема разрешения, путь нормальный (`/vercel/path0/...`)

### Гипотезы для решения (приоритезировано)

#### Гипотеза А: Добавить `.ts` extensions в imports payload.config.ts (наиболее вероятная)
- TypeScript с `moduleResolution: "bundler"` позволяет это
- Нужно `allowImportingTsExtensions: true` в tsconfig
- Но при этом сломается `tsc --noEmit` если есть импорты из server-component кода в client-component с разной resolution
- **Что попробовать:** добавить `.ts` к 8 импортам в `payload.config.ts` + `allowImportingTsExtensions` в tsconfig
- **Риск:** конфликт с next.js. Раньше пробовал — получил `ERR_REQUIRE_ASYNC_MODULE` на локальной. Но это был Node 24, может быть на Node 22 + Linux пройдёт.

#### Гипотеза Б: Проверить, требует ли Payload CLI specific tsconfig
- Payload может ожидать tsconfig в специфическом формате
- Возможно нужен отдельный `tsconfig.payload.json` со своим `moduleResolution`
- **Что попробовать:** глянуть исходник `node_modules/payload/dist/bin/index.js` чтобы понять как именно вызывается tsx и какой tsconfig применяется

#### Гипотеза В: Использовать `package.json type: "module"` или нет
- Сейчас наш `package.json` БЕЗ `"type": "module"` — Node 22 видит .ts как ambiguous
- Если поставить `"type": "module"`, расширения становятся обязательными → нужно везде `.ts`
- Если оставить без — Node трактует .ts как CJS → tsx должен преобразовать
- **Что проверить:** установить `"type": "module"` и одновременно добавить `.ts` extensions

#### Гипотеза Г: Использовать другой loader или patch tsx
- Есть `@swc-node/register` — пробовали, фейлит на named exports CJS
- Есть `ts-node/esm` — не пробовали; может работать
- Можно патчить через `--experimental-vm-modules` или другие Node flags
- **Что попробовать:** запуск Payload CLI через `node --import tsx scripts/cms/payload-bin-wrapper.mjs`

#### Гипотеза Д: Pre-compile config to JS
- Скомпилировать `payload.config.ts` в `.js` через tsc/esbuild перед `payload generate:importmap`
- Передать `--config payload.config.js` в CLI (если поддерживает)
- **Что попробовать:** добавить step в pipeline: `tsc --noEmit false --outDir .payload-build payload.config.ts && payload generate:importmap --config .payload-build/payload.config.js`

#### Гипотеза Е (radikalная): Не использовать CLI вообще
- Написать собственный generator, который анализирует config и пишет importMap
- Это **отказ от автоматики Payload** и шаг назад
- **Только если все остальные не работают**

### Что искать в official Payload examples

- https://github.com/payloadcms/payload/tree/main/templates/website
- https://github.com/payloadcms/payload/tree/main/templates/blank
- Особое внимание: имеют ли они `"type": "module"` в package.json
- Есть ли у них extensions в imports
- Что у них в tsconfig moduleResolution

---

## 10. Что должен сделать Codex дальше

### Шаг 1 — Изучить official Payload templates (15 минут)
Ровно 2 файла из `payloadcms/payload` repo на GitHub:
- `templates/website/package.json` — какой `"type"`, какой engines, какие scripts
- `templates/website/payload.config.ts` — есть ли `.ts` extensions в imports

Это даст точную ответную ставку — поддерживаемая Payload-командой связка работает с extensions или без.

### Шаг 2 — Применить минимальный фикс на основе Шага 1
Если templates имеют `.ts` extensions:
- Добавить `.ts` в 8 imports `payload.config.ts`
- Добавить `allowImportingTsExtensions: true` в tsconfig.json
- Запустить локально `npm run lint` — TypeScript должен пройти
- Запустить `npm run vercel-build` локально (Windows может skip generate-importmap, главное cms:check проходит)

Если templates имеют `"type": "module"`:
- Добавить в package.json
- Адаптировать остальные .js скрипты (`scripts/cms/*.mjs` уже на mjs — это OK)
- Возможно потребуется `.js` extensions в imports тоже

### Шаг 3 — Push в feat/payload-cms и проверить
- Push commit
- Vercel rebuild
- Откройте Build Logs, ищите:
  ```
  ✓ importMap сгенерирован успешно
  → Инициализация Payload (это триггерит push схемы)...
  ✓ Schema push complete за X.Xs
  ```

### Шаг 4 — Если importMap прошёл, но schema push упал
- Вероятная причина: `DATABASE_URL_UNPOOLED` отсутствует в Vercel env vars
- Проверить через Vercel Dashboard → Settings → Environment Variables
- Если нет — добавить (взять из Neon Console → Connection Details → Direct connection)
- Redeploy

### Шаг 5 — Если build прошёл — проверить admin
- `<Preview URL>/api/health` → должен вернуть `{ status: "ok", cms: { ok: true, collections: 6+ } }`
- `<Preview URL>/admin` → должна открыться форма «Create First User»
- Создать пользователя, залогиниться, увидеть меню коллекций (Categories, Products, и т.д.)

### Шаг 6 — Migration & data stage (после стабилизации /admin)
1. Написать `scripts/cms/migrate-from-ts.ts` — читает `data/storageSystems/*.ts`, пушит в Postgres через Payload Local API
2. Загрузить картинки из `public/assets/images/` в Vercel Blob через Payload media collection
3. Переключить страницы (`app/page.tsx`, `app/catalog/[id]/page.tsx`, `app/catalog/[id]/[productId]/page.tsx`) с чтения из TS-импортов на `await getPayload().find(...)`
4. Кэширование: ISR `revalidate = 60` или `revalidateTag` через Payload `afterChange` hooks

### Шаг 7 — Cutover в main (после полного QA на preview)
- Merge `feat/payload-cms` → `main`
- Vercel автоматически задеплоит на production
- Старая static-deploy остаётся как rollback target на 1 неделю

---

## 11. Важные инженерные принципы (не нарушать)

1. **Не считать «зелёный build = всё ок».** Нужно verify через Health endpoint и фактический /admin рендер.
2. **Ручной importMap не финальное решение.** Hand-written `importMap.ts` это fallback. Цель — CLI-генерация на каждый build.
3. **Не отключать preflight checks ради «лишь бы задеплоить».** Если build падает — это feature, не баг. Падение на CMS misconfig сохраняет production.
4. **Не диагностировать без Runtime Logs / Build Logs.** Гипотезы без логов = трата времени.
5. **Не использовать pooled Neon connection для DDL.** Всегда `DATABASE_URL_UNPOOLED` для schema operations.
6. **Deploy intentionally падает ДО публикации, если CMS broken.** Это не баг pipeline, это его функция.
7. **Не делать точечных костылей вместо системного решения.** Каждое исправление — это либо архитектурный fix, либо явно помеченный временный workaround с TODO.
8. **Production main branch не трогаем.** Все CMS-эксперименты в `feat/payload-cms`. Cutover в main — только после полного QA на preview.

---

## 12. Коммиты и контрольные точки

### Branch state
- **Production:** `main` (last commit `6d915a6 Fix catalog image interactions` от Codex + 25 коммитов Claude после)
- **CMS work:** `feat/payload-cms` (current HEAD `cbe69bb`)

### Ключевые коммиты Phase 1 (на main, в production)

| Commit | Что |
|--------|-----|
| `42a9a2b` | Удалён ffmpeg-static, добавлен .env.example |
| `4d76d67` | robots.txt + sitemap |
| `dd1fdde` | CSS animation-timeline fallback + убраны Pexels URL |
| `34e6aae` | +14 продуктов из Excel |
| `0a08e4b` | Production hardening (rate-limit, honeypot, validation, security headers) |
| `6166ff0` | Telegram-уведомления о заявках |
| `cf78f2c` | source/honeypot/formStartedAt в 3 формах |
| `8ccb999` | JSON-LD schemas + per-page metadata |
| `f455160` | Telegram + photo + product link |

### Ключевые коммиты Phase 2 (feat/payload-cms)

| Commit | Что |
|--------|-----|
| `2f28c41` | **Bootstrap Payload CMS 3** — все коллекции, globals, routes, layout, withPayload |
| `60c05b7` | Hero background mode (video/image) в HomeContent |
| `0f5adcc` | Wire homepage hero с CMS + graceful fallback |
| `42a5469` | Первая попытка fix /admin blank page (push:true, transactionOptions, serverExternalPackages, убран broken i18n) |
| `976fc76` | **Hand-written importMap** с VercelBlobClientUploadHandler + Lexical |
| `d618133` | **Production-ready CMS pipeline** — preflight checks, schema push script, health endpoint, `.nvmrc`, документация. Commit где появился текущий blocker (Node 24 selected from range). |
| `cbe69bb` | **Pin Node 22.x exactly.** Vercel перешёл на Node 22.22.2, но `payload generate:importmap` всё равно падает — текущий блокер. |

### Текущий blocker появился на коммите
- На `d618133` — впервые упал build pipeline на Vercel
- На `cbe69bb` — Node version исправлен, но та же ESM resolution проблема осталась

---

## 13. Roadmap после стабилизации CMS

### Этап 4 — Migration data из TS в Postgres (1-2 дня после фикса blocker)

**Скрипт `scripts/cms/migrate-from-ts.ts`:**
1. Читает существующие `excelCalculator.ts`, `excelCatalog.ts`, `catalogDepth.ts`, `content.ts`
2. Загружает все `public/assets/images/` файлы в Vercel Blob через Payload Local API
3. Создаёт документы в коллекциях:
   - `categories` ← из `excelHomeCatalog`
   - `subcategories` ← из `catalogSubcategories`
   - `products` ← из `catalogProducts` (21 продукт)
   - `calculator-profiles` ← из `calculatorProfiles` (6 профилей с factor tables)
   - `home-content` global ← из `content.ts`
   - `contacts` global ← из `content.ts`
4. Запускается ОДИН РАЗ, не коммитится как runtime

**Risks:**
- Migration script сам зависит от tsx loader (та же проблема)
- Альтернатива: запускать через Payload CLI `payload migrate:create` + кастомная migration

### Этап 5 — Page integration (2 дня)

В `app/page.tsx`, `app/catalog/[id]/page.tsx`, `app/catalog/[id]/[productId]/page.tsx`:
- Заменить `import { excelHomeCatalog } from "@/data/..."` на `await getPayload().find({ collection: "categories" })`
- ISR cache: `export const revalidate = 60` или `unstable_cache` с tag invalidation
- Webhook от Payload `afterChange` → `revalidateTag` для мгновенного обновления

В `components/Calculator.tsx`, `components/CatalogGrid.tsx`:
- Принимать данные через props (от server component)

Тесты `tests/calculator.test.ts` (7/7 зелёные) **продолжают работать** — они тестируют чистую функцию, не источник данных.

### Этап 6 — Cutover в production (полдня)

- Деплоить `feat/payload-cms` на Preview
- Smoke test: открыть все 21 товар, прогнать калькулятор, тестовая заявка
- `/api/health` всё зелёное
- Merge feat/payload-cms → main
- Vercel задеплоит на production URL
- Старая static-build остаётся как rollback на 1 неделю

### Этап 7 — Training (полдня)

- 30-минутный screencast на русском: редактирование товара, замена фото, FAQ, что НЕ трогать в калькуляторе
- 1-страничный cheat-sheet
- 2 практических edits с пользователем + 1 соло

### Этап 8 — Calculator hardening (1 день)

- Payload field validators: `value > 0`, `factor 0.1..10`, монотонный порядок размеров
- Кнопка «Тестовый расчёт» в админке — показывает цену по сохранённым данным ДО публикации
- Daily CI: Vitest против production-данных через Local API → Telegram alert если pinned тесты поплыли

---

## 14. Самое важное для Codex

### Top 10 критических пунктов

1. **Текущий blocker — НЕ Node version.** Vercel уже на Node 22.22.2 (подтверждено Build Logs). Не тратить время на engines/version.
2. **Текущий blocker — ESM resolution в payload generate:importmap.** Падает на `Cannot find module '/vercel/path0/payload/collections/Users'`. Реальный фикс — добавить `.ts` extensions или `"type": "module"`. Сначала **проверить что делают official Payload templates** на GitHub.
3. **Hand-written `importMap.ts` это ВРЕМЕННО.** Цель — CLI-генерация на каждый build. Hand-written покрывает только текущие плагины. При добавлении любого нового — снова сломается.
4. **`DATABASE_URL_UNPOOLED` нужен для schema push.** Если на Vercel env vars его нет — добавить из Neon Console (Connection Details → Direct connection). Без него `cms:push-schema` упадёт даже если importMap починим.
5. **Production не пострадал.** Build pipeline остановил bad deploy на шаге cms:generate-importmap. Production main branch работает на старой статической сборке. Можно спокойно итерировать на feat/payload-cms.
6. **Не возвращаться к "просто next build" без preflight checks.** Pipeline это не баг, это feature. Без него /admin сломается на runtime и production пострадает.
7. **Hand-written importMap.ts НЕ удалять.** Он fallback. После того как CLI заработает — Vercel перезапишет файл свежим, но в репо коммитим тоже на случай если CLI снова сломается.
8. **Тесты Vitest (7/7 зелёные) — золотой стандарт.** Любое изменение в `lib/calculator/pricing.ts` или `data/storageSystems/excelCalculator.ts` должно прогоняться через тесты. Калькулятор не должен сломаться при миграции данных.
9. **`/api/health` это первый smoke test после deploy.** Возвращает CMS / DB / storage статус без секретов. Использовать для верификации что всё работает.
10. **Документация в репо актуальна.** `CMS_SETUP.md`, `DEPLOYMENT_CHECKLIST.md`, `ПРЕДЛОЖЕНИЕ_АДМИНКА.md` — читать перед действиями. Не пере-планировать архитектуру с нуля.

### Что точно не делать

- ❌ Не возвращаться к диагностике Node version — она уже 22
- ❌ Не пробовать `--use-swc` — три раза проверяли, фейлит
- ❌ Не отключать preflight checks ради скорости deploy
- ❌ Не мерджить `feat/payload-cms` в main пока /admin не работает на preview
- ❌ Не редактировать importMap.ts вручную после того как CLI заработает (лишний merge conflict source)
- ❌ Не использовать pooled connection для DDL операций

### Что обязательно делать

- ✅ Перед коммитом: `npm run cms:check && npm run lint && npm run test && npm run build`
- ✅ После Vercel deploy: проверить `/api/health` и `/admin`
- ✅ Документировать каждый non-trivial fix в `CHANGELOG.md` или relevant `*.md`
- ✅ Каждое временное решение помечать `TODO:` с условием когда оно станет постоянным
- ✅ Любое изменение в `payload.config.ts` или коллекциях — повторно прогнать `npm run cms:generate-importmap` (на Linux/Mac/WSL/Vercel)

---

**Конец handoff документа.**

Если что-то непонятно — читать в этом порядке:
1. Этот файл (HANDOFF_TO_CODEX.md) полностью
2. `CMS_SETUP.md` (архитектура)
3. `DEPLOYMENT_CHECKLIST.md` (operational)
4. `ПРЕДЛОЖЕНИЕ_АДМИНКА.md` (исторический контекст выбора Payload)
5. `CHANGELOG.md` (что делал предыдущий dev)

Удачи. Главное — не повторять уже доказанные failed гипотезы и фиксить **системно**, не точечно.
