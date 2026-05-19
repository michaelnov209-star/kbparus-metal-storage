# Передача проекта разработчику — КБ Парус «Системы хранения металла»

Документ объединяет engineering-handoff (Payload CMS stabilization, инфраструктурные решения) и onboarding для нового разработчика-человека. Подходит и нейросети-помощнику для быстрого входа в контекст.

| Параметр | Значение |
|----------|----------|
| Production URL | https://kbparus-metal-storage.vercel.app |
| Репозиторий | `michaelnov209-star/kbparus-metal-storage` (GitHub) |
| Hosting | Vercel (Hobby) — auto-deploy из ветки `main` |
| Stack | Next.js 16, React 19, TypeScript 5.9 strict, Payload CMS 3, Neon Postgres, Vercel Blob |
| Целевая ветка | `main` (CMS уже в production) |
| Документация-индекс | `docs/README.md` |

---

## Быстрый старт

```bash
git clone https://github.com/michaelnov209-star/kbparus-metal-storage.git
cd kbparus-metal-storage
cp .env.example .env.local      # заполнить под локальные нужды
npm install
npm run dev                     # http://localhost:3000
npm run lint                    # tsc --noEmit
npm run test                    # vitest, 7+ кейсов калькулятора
npm run build                   # production-сборка Next.js
```

Полная команда сборки на Vercel — `npm run vercel-build` (см. секцию «Build pipeline»).

---

## Стек

| Технология | Версия | Назначение |
|-----------|--------|-----------|
| Next.js | 16.2.x | App Router, SSG/ISR, API Routes |
| React | 19.2.x | UI |
| TypeScript | 5.9 (strict) | Типизация |
| Payload CMS | 3.84.x | Headless CMS, админка `/admin` |
| `@payloadcms/db-postgres` + Drizzle | 3.84.x | Postgres-адаптер |
| Neon Postgres | — | База данных через Vercel Marketplace |
| Vercel Blob | — | Хранилище медиа (через `@payloadcms/storage-vercel-blob`) |
| lucide-react | 1.x | Иконки |
| Vitest | 4.x | Юнит-тесты |
| Node | `22.x` (exact pin) | Runtime |

Принципы: чистый CSS (нет Tailwind), нет CSS-in-JS, ESM-пакет (`"type": "module"`).

---

## Структура проекта

```
/
├── app/                                # Next.js App Router
│   ├── page.tsx                        # Главная (читает Payload home-content с fallback)
│   ├── layout.tsx                      # Корневой лейаут + метаданные
│   ├── globals.css                     # Все стили
│   ├── sitemap.ts                      # Динамический sitemap
│   ├── opengraph-image.tsx             # OG-картинка
│   ├── icon.svg                        # Favicon
│   ├── catalog/[id]/page.tsx           # Страница категории (17 шт.)
│   ├── catalog/[id]/[productId]/page.tsx  # Страница продукта
│   ├── api/leads/route.ts              # POST /api/leads → Bitrix24 + Telegram
│   ├── api/health/route.ts             # GET /api/health (CMS/DB/storage статус)
│   └── (payload)/                      # Группа маршрутов Payload
│       ├── admin/[[...segments]]/      # /admin UI
│       ├── admin/importMap.ts          # Автогенерируется через payload generate:importmap
│       ├── api/[...slug]/route.ts      # REST API Payload
│       └── layout.tsx                  # Payload root layout
│
├── components/                         # React-компоненты
│   ├── BrandMark.tsx                   # Логотип
│   ├── Calculator.tsx                  # 3-шаговый калькулятор
│   ├── CatalogGrid.tsx                 # Сетка 17 категорий
│   ├── FaqAccordion.tsx
│   ├── ImageLightbox.tsx
│   ├── LeadForm.tsx                    # Форма заявки (honeypot, speed-trap)
│   ├── LinePageStyles.tsx              # Inline-стили для page.tsx
│   ├── ProductConfigurator.tsx
│   ├── ProductGallery.tsx
│   ├── SliderControls.tsx
│   └── SolutionsShowcase.tsx
│
├── data/storageSystems/                # Статический fallback-каталог
│   ├── excelCatalog.ts                 # 17 категорий
│   ├── catalogDepth.ts                 # Пилот-продукты
│   ├── excelCalculator.ts              # Профили калькулятора
│   ├── priceFactors.ts                 # Коэффициенты цен
│   ├── content.ts                      # Тексты-fallback
│   ├── visualAssets.ts                 # URL изображений
│   └── ... (типы, опции, market insights)
│
├── lib/
│   ├── calculator/                     # Бизнес-логика калькулятора
│   │   ├── types.ts                    # CalculatorInput, CalculatorResult
│   │   ├── validation.ts               # normalizeCalculatorInput()
│   │   ├── pricing.ts                  # calculateStorageSystem()
│   │   ├── recommendation.ts
│   │   └── format.ts                   # formatRub(), formatRoundedRub()
│   ├── cms/                            # Адаптеры чтения из Payload
│   │   ├── client.ts                   # getPayload({ config })
│   │   ├── catalog.ts                  # Категории + подкатегории
│   │   ├── products.ts                 # Товары
│   │   └── home-content.ts             # Глобал главной
│   ├── leads/                          # Доставка заявок (Bitrix24, Telegram)
│   └── seo/                            # JSON-LD, metadata-хелперы
│
├── payload/
│   ├── collections/                    # Users, Media, Categories, Subcategories,
│   │                                   #   Products, CalculatorProfiles
│   ├── globals/                        # Contacts, HomeContent, LeadManagement,
│   │                                   #   SiteNavigation
│   └── admin/structure.ts              # Группировка коллекций в админке
│
├── scripts/cms/                        # Build-pipeline и seed-скрипты (см. ниже)
│
├── tests/
│   ├── calculator.test.ts              # Юнит-тесты калькулятора
│   └── leads.test.ts                   # Валидация и rate-limit заявок
│
├── public/
│   ├── robots.txt
│   ├── brand/logo-g.png
│   └── assets/
│       ├── images/catalog/             # Фото 17 категорий
│       ├── images/products/            # Фото пилот-продуктов
│       ├── images/calculator-configurator.svg
│       ├── images/baner_liniiokraski.png
│       ├── images/kbparus-cnc-banner.png
│       ├── icons/                      # telegram.svg, max.svg
│       └── videos/metal-storage-hero-trimmed.mp4
│
├── docs/                               # Документация (см. docs/README.md)
├── .env.example
├── .nvmrc                              # 22
├── next.config.mjs                     # security headers + withPayload
├── payload.config.ts                   # Главная конфигурация Payload
├── vercel.json                         # buildCommand + cache headers
├── package.json                        # engines.node = "22.x", "type": "module"
├── tsconfig.json
└── vitest.config.ts
```

---

## Бизнес-логика

### Что делает сайт

1. **Каталог** — 17 категорий промышленных систем хранения металла.
2. **Калькулятор** — 3-шаговый конфигуратор: профиль → параметры → ориентировочная цена.
3. **Лиды** — `POST /api/leads` принимает заявку, шлёт в Bitrix24 (или mock) и Telegram-чат менеджеров.
4. **Доверие** — описания, фото, FAQ, контакты, кейсы, география.

### Правило калькулятора

Калькулятор показывает **ориентировочную** цену. Формулировки в UI: «стартовая стоимость», «от ... ₽», «ориентир». Финальная цена всегда уточняется инженером — никаких «точно», «гарантированно».

### API заявок (`POST /api/leads`)

```typescript
// Запрос
{
  contact: { name: string, phone: string, email?: string },
  city?: string,
  comment?: string,
  calculatorInput?: CalculatorInput,
  utm?: { source, medium, campaign, content, term }
}

// Mock-режим (нет BITRIX24_WEBHOOK_URL и TELEGRAM_BOT_TOKEN)
{ ok: true, mode: "mock", payload: { ... } }

// Реальная доставка
{ ok: true, bitrix24Id: 123 }
```

Защита: rate-limit 5 req/min/IP (in-memory), honeypot, speed-trap (≥2 сек на форму), серверная валидация телефона/email, anti-double-submit на клиенте.

---

## Payload CMS

### Состояние

CMS встроена в Next.js App Router и развёрнута в production. На главной, страницах категорий и продуктов данные читаются из Payload с graceful fallback на TS-файлы из `data/storageSystems/`.

- Admin UI: `/admin`. Темы: фиксированная светлая, русский интерфейс (`fallbackLanguage: "ru"`).
- Health check: `/api/health` возвращает `status: "ok"`, `cms.ok: true`, список globals.
- Auth roles в `payload/collections/Users.ts`: `admin`, `editor`, `photographer`.
- Медиа: коллекция `Media` хранит файлы в Vercel Blob, sharp-трансформации в 320/800/1600 webp.
- Live edit-флоу: страницы под ISR `revalidate=60`, изменения в CMS появляются без полной пересборки.

### Коллекции и глобалы

| Тип | Имя | Назначение |
|-----|-----|------------|
| collection | `users` | Авторизация |
| collection | `media` | Изображения и видео |
| collection | `categories` | 17 категорий каталога |
| collection | `subcategories` | Подкатегории |
| collection | `products` | Товары (7 tabs: main/images/price/configurator/specs/SEO/publishing) |
| collection | `calculator-profiles` | Зеркало листа «Админка» из Excel: высоты, ширины, длины, нагрузки, опции |
| global | `contacts` | Телефоны, email, адрес, соцсети, ИНН |
| global | `home-content` | Hero, материалы, before/after, преимущества, кейсы, география, отзывы, партнёры, шаги, FAQ |
| global | `site-navigation` | Хедер, футер, легальные ссылки |
| global | `lead-management` | Настройки доставки заявок |

### Группировка в админке

Сгруппировано как «операционный центр» — порядок задан в `payload/admin/structure.ts`: главная страница → каталог → калькулятор → компания → медиа → заявки → пользователи. Подробности — `docs/architecture/cms-admin-ux.md`.

---

## Build pipeline

Команда `npm run vercel-build` запускает 5 шагов:

```bash
node scripts/cms/check.mjs                       # preflight assertions
node scripts/cms/safe-generate-importmap.mjs     # payload generate:importmap (Linux/Mac)
node scripts/cms/push-schema.mjs                 # explicit pushDevSchema(payload.db)
node scripts/cms/check.mjs                       # повторная валидация
next build
```

### Что делает каждый шаг

1. **`cms:check`** — 13 assertions: env vars (`PAYLOAD_SECRET≥32`, DB URL, unpooled URL, BLOB token), наличие файлов, контент `importMap.ts` (должен содержать VercelBlobClientUploadHandler + Lexical), `next.config.mjs` (serverExternalPackages + withPayload), Node major = 22. Любая failed (не warn) → build aborts.
2. **`cms:generate-importmap`** — на Linux/Mac запускает `npx payload generate:importmap`, который перезаписывает `app/(payload)/admin/importMap.ts`. На Windows — graceful skip с использованием закоммиченного fallback.
3. **`cms:push-schema`** — через `npx tsx` запускает `scripts/cms/push-schema.ts`, который вызывает `pushDevSchema(payload.db)` из `@payloadcms/drizzle`, затем верифицирует, что globals `contacts` и `home-content` читаемы. Без этого Payload в `NODE_ENV=production` не пушит схему автоматически.
4. **`cms:check`** (повторно) — на случай, если шаг 2 повёл себя странно.
5. **`next build`** — стандартная сборка.

### Почему deploy *намеренно* падает раньше публикации

Без pipeline `/admin` мог сломаться в runtime, и пользователь видел бы битый сайт. С pipeline: если CMS-prerequisites не выполнены, build останавливается до `next build`, deploy не публикуется, production остаётся на предыдущей рабочей версии.

### CMS seed-скрипты

```bash
npm run cms:seed-catalog -- <url> [--apply]            # категории/подкатегории/товары
npm run cms:seed-home-content -- <url> [--apply]       # главная (15 секций)
npm run cms:seed-media -- <url> [--apply]              # медиа в Vercel Blob
npm run cms:seed-site-navigation -- <url> [--apply]    # навигация/футер
npm run cms:seed-catalog:local                          # локально через tsx
npm run cms:validate-deployment -- <url>                # smoke deployment
npm run cms:admin-smoke -- <url>                        # авторизованный smoke
```

Все seed-скрипты идемпотентны (заполняют только пустые поля), есть dry-run без `--apply`.

---

## Переменные окружения

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `PAYLOAD_SECRET` | Да (≥32 символа) | Подписи сессий Payload |
| `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING` | Да | Direct connection к Neon (для DDL/schema push) |
| `DATABASE_URL` / `POSTGRES_URL` | Да | Pooled connection (runtime queries) |
| `BLOB_READ_WRITE_TOKEN` | Да | Vercel Blob storage |
| `BITRIX24_WEBHOOK_URL` | Нет | Доставка лидов в CRM (без неё — mock) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Нет | Уведомления о новых заявках |
| `CMS_ADMIN_SMOKE_TRANSPORT` | Нет | `fetch` (default) или `vercel-curl` для smoke |

Без `BITRIX24_WEBHOOK_URL` API всё равно принимает заявки, логирует в Vercel Functions, возвращает `mode: "mock"`.

---

## Troubleshooting (уроки эксплуатации)

### `/admin` blank page / React error #418

Проверяй именно эти причины в порядке убывания частоты:

1. **`importMap.ts` пустой или потерял запись плагина.** Открой `app/(payload)/admin/importMap.ts` — он должен содержать как минимум `VercelBlobClientUploadHandler`, `RscEntryLexicalCell`, `RscEntryLexicalField`, `LexicalDiffComponent`. Если плагин добавлен в `payload.config.ts`, но в importMap нет — перегенерь.
2. **Схема не пушнута.** Проверь `/api/health` — если `cms.ok: false` или нет globals, значит DDL не прошёл.
3. **Pooled connection использовался для DDL.** Neon pgbouncer не поддерживает multi-statement DDL. Schema push должен идти через `DATABASE_URL_UNPOOLED`.

### `relation "users" does not exist` / `relation "contacts" does not exist`

В `NODE_ENV=production` Payload/Drizzle **не делает** автоматический `push: true`. Решение:

- В build pipeline должен быть `cms:push-schema` (вызывает `pushDevSchema(payload.db)` явно).
- В env должен быть direct/unpooled URL для DDL.
- После deploy `/api/health` должен показать `globalNames: ["contacts", "home-content", ...]`.

### `ERR_MODULE_NOT_FOUND: Cannot find module './payload/collections/Users'` при `payload generate:importmap`

ESM resolution в tsx loader. Фикс — `package.json` должен иметь `"type": "module"`, в imports `payload.config.ts` лучше использовать пути с расширением `.ts` (с `allowImportingTsExtensions: true` в tsconfig). Не использовать `--use-swc` (фейлит на named exports CJS-модулей).

### Vercel выбрал Node 24 (несовместимый)

`engines.node` должен быть **exact pin** (`"22.x"`), не range типа `">=22.0.0 <25.0.0"`. На range Vercel берёт максимальную версию из диапазона. `.nvmrc` тоже должен содержать `22`.

### Schema push падает с `ECONNREFUSED` или таймаутом

Используется pooled URL вместо direct. Проверь priority в `payload.config.ts`: `DATABASE_URL_UNPOOLED → POSTGRES_URL_NON_POOLING → DATABASE_URL → POSTGRES_URL`.

### Bitrix24 не получает заявки

`BITRIX24_WEBHOOK_URL` не задан в Vercel env vars или вебхук не имеет прав `crm.deal.add`. Проверь `/api/leads` в режиме mock — он возвращает `mode: "mock"`. Подробности — `docs/operations/cms-setup.md` и `docs/operations/telegram-bot.md`.

---

## Инженерные принципы (не нарушать)

1. **Тесты — золотой стандарт.** Любое изменение в `lib/calculator/pricing.ts` или `data/storageSystems/excelCalculator.ts` прогонять через `npm run test`.
2. **Не отключать preflight checks ради «лишь бы задеплоить».** Если build падает на `cms:check` — это feature, не баг. Production не должен сломаться из-за CMS misconfig.
3. **Не использовать pooled connection для DDL.** Всегда unpooled для schema operations.
4. **`importMap.ts` коммитим в репозиторий.** CLI перезаписывает на каждом build, но fallback нужен — иначе случайный сбой CLI оставит админку без upload-обработчиков.
5. **Документировать любой non-trivial фикс** в `CHANGELOG.md` или соответствующем `docs/**/*.md`.
6. **Временные решения помечать `TODO:`** с условием, когда они станут постоянными.
7. **Production main branch не ломать.** Эксперименты — на feature-ветках, cutover — только после smoke на preview.

---

## Что нельзя менять без причины

| Файл | Почему |
|------|--------|
| `lib/calculator/pricing.ts` | Основная формула цен. Изменение требует прогона тестов. |
| `data/storageSystems/priceFactors.ts` | Коэффициенты из Excel. Изменение = ручная сверка с источником. |
| `data/storageSystems/excelCatalog.ts` | Ровно 17 категорий. Смена ID ломает роутинг и sitemap. |
| `payload.config.ts` | Любое изменение требует regenerate importMap. |
| `app/globals.css` | Единый источник стилей. Не дублировать в компонентах. |
| `.env*` | Никогда не коммитить файлы с реальными ключами. |

---

## Известный долг и направления развития

- `BITRIX24_WEBHOOK_URL` пока не настроен в Vercel — заявки в CRM не идут.
- Реальные фото оборудования вместо Pexels (`data/storageSystems/visualAssets.ts`).
- 26 calculator-профилей из Excel ещё не реализованы (в коде 6 базовых).
- Persistent rate-limit (Upstash Redis) — сейчас in-memory.
- CSP не настроен — нужен рефакторинг inline-стилей в `LinePageStyles.tsx`.
- Нет error boundaries — при crash калькулятора страница пустеет.
- Нет мобильного бургер-меню (приемлемо для B2B desktop-аудитории).

Полный roadmap — `docs/planning/roadmap.md`.

---

## Дальнейшая работа — куда смотреть

- `../planning/roadmap.md` — приоритезированные следующие шаги, спринты 1–5.
- `../audits/project-audit.md` — текущая оценка состояния проекта.
- `../audits/calculator-audit.md` — детальный аудит калькулятора.
- `../audits/customer-journey-audit.md` — путь клиента, точки потери конверсии.
- `../operations/deployment-guide.md` — процесс деплоя.
- `../operations/deployment-checklist.md` — чек-лист перед релизом.
- `../operations/cms-setup.md` — настройка Payload CMS с нуля.
- `../operations/production-validation.md` — валидация production после deploy.
- `../operations/admin-smoke.md` — авторизованный smoke-тест админки.
- `../operations/telegram-bot.md` — настройка Telegram-уведомлений.
- `../operations/content-collection-workflow.md` — процесс сбора контента.
- `../architecture/project-context.md` — бизнес-контекст и цели.
- `../architecture/site-processes.md` — операционные процессы сайта.
- `../architecture/cms-admin-ux.md` — UX-архитектура админки.
- `../architecture/cms-content-architecture.md` — план перехода контента в CMS.
- `../handoffs/claude-code-handoff.md` — отдельный handoff для AI-агента.

---

**Краткий итог для нового разработчика:** проект — продакшн-ready Next.js + Payload CMS B2B-сайт. CMS уже работает, ловушки на пути установки задокументированы выше. Перед любым PR — `npm run lint && npm run test && npm run build`. После deploy — `/api/health` обязателен.
