# КБ Парус — «Системы хранения металла»

Production-ready B2B-сайт для направления «Системы хранения металла» КБ Парус / ООО «Технокам». Next.js + Payload CMS на Vercel. Сайт работает как инструмент первичного подбора оборудования: клиент выбирает систему, видит ориентировочную стоимость «от ... ₽», оставляет заявку → менеджер получает структурированные данные в Bitrix24 и Telegram.

- **Production:** https://kbparus-metal-storage.vercel.app
- **Admin:** https://kbparus-metal-storage.vercel.app/admin
- **Health:** https://kbparus-metal-storage.vercel.app/api/health

## Стек

| Слой | Технология |
|------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5.9 strict |
| CMS | Payload 3 (`/admin`), Postgres (Neon), Vercel Blob |
| Hosting | Vercel, auto-deploy из `main`, Node 22.x (exact pin) |
| Тесты | Vitest |
| Интеграции | Bitrix24 (webhook), Telegram Bot API |

Без Tailwind и CSS-in-JS — нативный CSS в `app/globals.css`. ESM-пакет (`"type": "module"`).

## Быстрый старт

```bash
git clone https://github.com/michaelnov209-star/kbparus-metal-storage.git
cd kbparus-metal-storage
cp .env.example .env.local      # заполнить под локальные нужды
npm install
npm run dev                     # http://localhost:3000
```

Проверки перед PR:

```bash
npm run lint                    # tsc --noEmit
npm run test                    # vitest
npm run build                   # production-сборка Next.js
```

Полная команда сборки на Vercel — `npm run vercel-build`. Подробнее — [`docs/handoffs/developer-handoff.md`](docs/handoffs/developer-handoff.md).

## Структура (верхнего уровня)

```
app/                # Next.js App Router (страницы, API, /admin Payload)
components/         # React-компоненты
data/storageSystems/# Статический fallback-каталог
lib/                # calculator/, cms/, leads/, seo/
payload/            # Payload-коллекции, глобалы, структура админки
public/             # Статика (фото, видео, иконки, robots.txt)
scripts/cms/        # Build pipeline и seed-скрипты
tests/              # Vitest
docs/               # Документация (см. docs/README.md)
```

## Админка

Payload admin доступен по `/admin`. Сейчас это не только стандартная CMS-оболочка, а рабочая панель менеджера:

- кастомный SaaS-dashboard с быстрыми действиями: новый товар, загрузка фото, заявки, главная;
- карточки показателей: товары, категории, медиа, заявки;
- блок “Безопасный порядок работы” для публикации контента;
- встроенный пункт “Обучение” с пошаговым tour-overlay, подсветкой элементов и всплывающими подсказками со стрелками;
- светлая тема админки и отдельные premium industrial стили в `app/(payload)/custom.scss`.

Кастомные компоненты админки лежат в `app/(payload)/components/`. При изменении компонентов, подключённых к Payload admin, запускать `npm run cms:generate-importmap`.

## Документация

Вся документация — в [`docs/`](docs/README.md). Главные точки входа:

- [`docs/handoffs/developer-handoff.md`](docs/handoffs/developer-handoff.md) — onboarding для разработчика (быстрый старт, архитектура, troubleshooting Payload/Drizzle, build pipeline).
- [`docs/planning/roadmap.md`](docs/planning/roadmap.md) — спринты и приоритеты.
- [`docs/audits/project-audit.md`](docs/audits/project-audit.md), [`docs/audits/calculator-audit.md`](docs/audits/calculator-audit.md), [`docs/audits/customer-journey-audit.md`](docs/audits/customer-journey-audit.md), [`docs/audits/dependency-audit-2026-05-19.md`](docs/audits/dependency-audit-2026-05-19.md) — независимые аудиты.
- [`docs/operations/`](docs/README.md#структура) — деплой, CMS setup, валидация, Telegram-бот, Bitrix24.
- [`docs/architecture/`](docs/README.md#структура) — контекст проекта, процессы, CMS-архитектура.
- [`docs/reports/report-for-director.md`](docs/reports/report-for-director.md) — отчёт руководству.
- [`CHANGELOG.md`](CHANGELOG.md) — хронология релизов.

## Переменные окружения

Минимум для запуска CMS (см. `.env.example`):

| Переменная | Назначение |
|-----------|------------|
| `PAYLOAD_SECRET` | Подписи сессий Payload (≥32 символа) |
| `DATABASE_URL_UNPOOLED` или `POSTGRES_URL_NON_POOLING` | Direct connection к Neon (для DDL/schema push) |
| `DATABASE_URL` или `POSTGRES_URL` | Pooled connection (runtime queries) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage |
| `BITRIX24_WEBHOOK_URL` | Опционально — доставка лидов в CRM |
| `BITRIX24_FIELD_*` | Опционально — custom fields для структурированных данных в Bitrix24 |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Опционально — уведомления о заявках |
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | Опционально — счетчик Яндекс Метрики |

Без `BITRIX24_WEBHOOK_URL` Bitrix24 мягко пропускается. Если не настроены ни Telegram, ни Bitrix24, API заявок работает в mock-режиме и логирует в Vercel Functions.

## Деплой

Auto-deploy на Vercel из ветки `main` (1–3 минуты). Build pipeline — `npm run vercel-build`:

```
cms:check → cms:generate-importmap → cms:push-schema → cms:check → next build
```

Если CMS-prerequisites не выполнены, build *намеренно* падает до публикации — production остаётся на предыдущей рабочей версии. Подробности — [`docs/operations/deployment-guide.md`](docs/operations/deployment-guide.md), [`docs/operations/deployment-checklist.md`](docs/operations/deployment-checklist.md).

## Бизнес-правило калькулятора

Калькулятор показывает **ориентировочную** стоимость («от ... ₽», «стартовая стоимость», «ориентир»). Финальная цена всегда определяется менеджером. В UI не должно появляться формулировок «точно», «гарантированно» — это контрактное обещание, которого сайт дать не может.

## Контрибьюции

1. Перед изменением `lib/calculator/pricing.ts` или `data/storageSystems/excelCalculator.ts` — прогон `npm run test`.
2. После изменения `payload.config.ts` или коллекций — пересборка importMap (`npm run cms:generate-importmap` на Linux/Mac/WSL).
3. Любой non-trivial фикс — отразить в `CHANGELOG.md` или соответствующем `docs/**/*.md`.
4. Production не ломать: эксперименты — на feature-ветках, cutover в `main` — после smoke на preview.

## Лицензия и владение

Проект принадлежит ООО «Технокам» / КБ Парус. Внутренний коммерческий продукт.
