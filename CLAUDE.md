# CLAUDE.md — КБ Парус (kbparus-metal-storage)

B2B-сайт «Системы хранения металла» для КБ Парус / ООО «Технокам».
Production: https://kbparus-metal-storage.vercel.app

> ⚠️ Рабочая папка `New project 2` содержит и **сторонние проекты** (`3x-ui/`, `3x-ui-telegram-bot/`, `technokam-payroll/`, `vedomost-audit/`) — они НЕ часть kbparus. Код kbparus: `app/`, `components/`, `lib/`, `payload/`, `data/`, `scripts/`, `tests/`, `docs/`.

## Граф знаний (graphify)

Карта архитектуры построена graphify → `graphify-out/`:
- `graph.html` — интерактивный граф (открыть в браузере)
- `GRAPH_REPORT.md` — аудит: god-nodes, сообщества, мосты, gaps
- `graph.json` — данные для запросов

Спросить граф: `/graphify query "<вопрос>"` (например, «How does a lead flow from form to Telegram?»). Граф уже построен — запросы не пересобирают его.

## Стек

Next.js 16 (App Router) · React 19 · TypeScript strict · Payload CMS 3 · Neon Postgres · Vercel Blob · Vercel hosting · Node 22.x (точный пин в `engines`). ESM-пакет (`"type":"module"` обязателен для importMap).

## Архитектура (по графу знаний)

**Контент-слой (CMS-first с fallback):** фронтенд читает через `lib/cms/*` адаптеры (`catalog.ts`, `products.ts`, `home-content.ts`, `contacts.ts`, `site-navigation.ts`) → Payload. Если CMS пуст/недоступен — fallback на `data/storageSystems/*`. ISR `revalidate=60` → правки маркетолога видны за минуту.

**Калькулятор:** `components/Calculator.tsx` + `ProductConfigurator.tsx` → `lib/calculator/pricing.ts` (формулы: automatic/rollout/forklift/hybrid). Данные профилей в `data/storageSystems/excelCalculator.ts`. God-nodes: `CalculatorInput`, `calculateStorageSystem()`, `formatRoundedRub()`, `getCalculatorProfile()`.

**Заявки:** `app/api/leads/route.ts` (god-node `POST()`) → параллельно Telegram (`lib/telegram.ts`), email (`lib/email.ts`), Bitrix24 (`lib/bitrix24.ts`), внутренний `leads` collection. Защита: honeypot, rate-limit, валидация.

**Payload-админка:** `payload.config.ts` + `payload/collections/*` + `payload/globals/*`. Бизнес-группировка меню (`payload/admin/structure.ts`), русский UI, light theme, кастомный `AdminDashboard`. God-node доступа к CMS: `getCmsClient()`.

**Build-pipeline (критично):** `vercel-build` = `cms:check → cms:generate-importmap → cms:push-schema → cms:check → next build`. Любой шаг падает → deploy не публикуется (защита от сломанной админки). Schema push через `@payloadcms/drizzle` `pushDevSchema()` на unpooled-соединении (`DATABASE_URL_UNPOOLED`).

## Инженерные правила (НЕ нарушать)

- **Формулы калькулятора** (`lib/calculator/pricing.ts`) — менять только с прогоном тестов. `npm run test` = 7/7 (Vitest, фиксируют эталонные цены).
- **`push: true`** в Payload — добавлять поля можно, удалять нельзя (потеря данных).
- **Новые CMS-поля** обязаны иметь `label: { ru }` и `admin.description: { ru }` — иначе маркетолог видит slug'и.
- **importMap** регенерируется на каждый Vercel build; кастомные admin-компоненты обязаны туда попадать (иначе `getFromImportMap not found` → blank /admin).
- **Seed-скрипты идемпотентны** — повторный запуск не перетирает заполненные поля.
- Документация: `docs/` (architecture / operations / audits / handoffs / planning / reports).

## Команды

```bash
npm run dev            # локальная разработка
npm run lint           # tsc --noEmit
npm run test           # Vitest 7/7
npm run cms:check      # 13 preflight-проверок CMS
npm run vercel-build   # полный build-pipeline локально
npm run cms:validate-deployment -- <url>   # smoke-тест деплоя
```

Health: `GET /api/health` → `{ status:"ok", cms.ok:true }`.

## Известные TODO (из графа / аудитов)

- Bitrix24 webhook (env не настроен на части окружений)
- 152-ФЗ: согласие на обработкуданных в формах (customer-journey-audit)
- Производительность каталог-изображений: отдаются оригинальные PNG 2–2.6 МБ через `/api/media/file/` с `Cache-Control: max-age=0` — нет sharp-вариантов/webp, нет кеша (в работе)
- Реальные фото оборудования вместо части стоковых
