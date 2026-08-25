# КБ Парус — «Системы хранения металла»

Production-ready B2B-сайт отдельного направления «Системы хранения металла» КБ Парус / ООО «Технокам». Next.js + Payload CMS на Vercel. Сайт работает как инструмент первичного подбора оборудования: клиент выбирает систему, видит ориентировочную стоимость «от ... ₽», оставляет заявку → менеджер получает структурированные данные в Telegram, почте и журнале заявок CMS.

- **Production:** https://kbparus-metal-storage.vercel.app
- **Admin:** https://kbparus-metal-storage.vercel.app/admin
- **Health:** https://kbparus-metal-storage.vercel.app/api/health

`kbparus.ru` — другой сайт бренда, посвящённый линиям порошковой окраски. Он не используется как canonical/origin этого проекта. После покупки отдельного домена систем хранения нужно заменить `NEXT_PUBLIC_SITE_URL`, разрешённые origin форм и ресурсы в поисковых кабинетах.

## Стек

| Слой | Технология |
|------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5.9 strict |
| CMS | Payload 3 (`/admin`), Postgres (Neon), Vercel Blob, `sharp` для обработки изображений |
| Hosting | Vercel, auto-deploy из `main`, Node 24.x (exact pin) |
| Тесты | Vitest + Playwright (390/768/1280, WCAG, visual regression) |
| Интеграции | Telegram Bot API, Яндекс Почта, Яндекс Метрика/Вебмастер, Google Search Console; Bitrix24 оставлен как опциональный будущий канал |

Без Tailwind и CSS-in-JS — нативный CSS в `app/globals.css`. ESM-пакет (`"type": "module"`).

## Быстрый старт

```bash
git clone https://github.com/michaelnov209-star/kbparus-metal-storage.git
cd kbparus-metal-storage
cp .env.example .env.local      # заполнить под локальные нужды
npm ci --include=optional --strict-allow-scripts # точная и закрытая установка
npm run dev                     # http://localhost:3000
```

Проверки перед PR:

```bash
npm run lint                    # tsc --noEmit
npm run test                    # vitest
npm run build                   # production-сборка Next.js
npm run security:audit          # блокирует moderate/high/critical во всём дереве зависимостей
npm run quality                 # lint + test + security audit + build одной командой
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

Социальная обложка для Telegram и других мессенджеров хранится в `public/brand/social-preview.jpg`. Она собирается из реального промышленного кадра и логотипа командой `npm run images:og`, которая входит в общий build pipeline.

## Публичный сайт

- Главная ведёт пользователя по воронке: hero → каталог → калькулятор → кейсы/доверие → контакты.
- `/catalog` показывает 17 разделов ассортимента в порядке Excel/админки; на мобильных устройствах карточки собраны в компактную сетку 2×N, чтобы не заставлять пользователя листать по одному разделу.
- `/catalog/[id]` для разделов с товарами сразу открывает ассортимент: пользователь не проходит через длинный вводный блок перед карточками.
- `/catalog/[id]/[productId]` поддерживает два режима товара:
  - **обычный товар** — карточка, галерея и форма заявки; характеристики, состав подбора и документы расположены ниже формы;
  - **товар с калькулятором** — единый `Calculator`, ограниченный одним профилем через `calculatorProfileId`; выбор модели пропускается, пользователь сразу видит параметры, затем результат; характеристики, состав подбора и документы расположены ниже калькулятора, общая форма не дублируется.
- Калькуляторы подключены только к моделям, для которых существует подходящая расчётная логика: четыре автоматические системы листового металла, четыре кассетные/выкатные системы и автоматизированная башня для длинномерного проката.
- Главная и товарные страницы используют один UI калькулятора и одну логику из `lib/calculator`; отдельного упрощённого товарного конфигуратора нет.
- Активные состояния калькулятора используют единый фирменный акцент `#fc5413`; сводные карточки параметров равнозначны по ширине и типографике, а цена со знаком рубля всегда отображается одной строкой.
- Дополнительные опции имеют проверенные визуальные карточки с русскими пояснениями; критерии конструктивной достоверности и источники зафиксированы в `docs/operations/calculator-option-validation.md`.
- Браузерные тесты заявок перехватывают `/api/leads`; реальные заявки без отдельного разрешения владельца проекта не отправляются.
- Формы передают менеджеру источник заявки: раздел/товар, URL, превью, контактные данные, город, комментарий и, если есть, параметры конфигуратора. Для заявки с товарной страницы API повторно находит опубликованный товар на сервере и подставляет доверенные название, ссылку и изображение.

## Админка

Payload admin доступен по `/admin`. Сейчас это не только стандартная CMS-оболочка, а рабочая панель менеджера:

- кастомный SaaS-dashboard с быстрыми действиями: новый товар, загрузка фото, заявки, главная;
- карточки показателей: товары, профили расчёта, медиа, заявки;
- карта главной страницы в порядке публичной витрины: hero → каталог → калькулятор → доверие → контакты;
- карта каталога в порядке сайта: категория → вложенные товары → визуальные превью, готовность контента, быстрые ссылки “редактировать” и “посмотреть на сайте”;
- в списке товаров и в редакторе явно видно, подключён ли калькулятор и какой профиль используется; режим `С калькулятором` нельзя сохранить без выбранного профиля;
- ролевое рабочее пространство для администратора, редактора контента и медиа-менеджера;
- операционный блок Preview / Status / Health для проверки сайта, заявок и `/api/health`;
- SEO Reporting Center: реальные данные Google Search Console и Яндекс Вебмастера, периоды 30/90/180/365 дней, устройства, топ запросов, посадочные страницы, страны Google, динамика и CSV;
- блок “Безопасный порядок работы” для публикации контента;
- встроенное ролевое обучение с затемнением экрана, точечной подсветкой, изогнутой стрелкой, прогрессом и повторным запуском из меню;
- светлая тема админки и отдельные premium industrial стили в `app/(payload)/custom.scss`.

Кастомные компоненты админки лежат в `app/(payload)/components/`. При изменении компонентов, подключённых к Payload admin, запускать `npm run cms:generate-importmap`.

Медиа в CMS хранятся через Vercel Blob. Payload получает `sharp` напрямую в `payload.config.ts`, чтобы resize/preview изображений работали без предупреждений в production build.

## Документация

Вся документация — в [`docs/`](docs/README.md). Главные точки входа:

- [`docs/handoffs/developer-handoff.md`](docs/handoffs/developer-handoff.md) — onboarding для разработчика (быстрый старт, архитектура, troubleshooting Payload/Drizzle, build pipeline).
- [`docs/planning/roadmap.md`](docs/planning/roadmap.md) — спринты и приоритеты.
- [`docs/audits/project-audit.md`](docs/audits/project-audit.md), [`docs/audits/calculator-audit.md`](docs/audits/calculator-audit.md), [`docs/audits/customer-journey-audit.md`](docs/audits/customer-journey-audit.md), [`docs/audits/dependency-audit-2026-05-19.md`](docs/audits/dependency-audit-2026-05-19.md) — независимые аудиты.
- [`docs/audits/security-and-repository-audit-2026-08-24.md`](docs/audits/security-and-repository-audit-2026-08-24.md) — актуальный аудит безопасности, зависимостей и CI/CD.
- [`docs/operations/`](docs/README.md#структура) — деплой, CMS setup, валидация, Telegram-бот, Bitrix24.
- [`docs/architecture/`](docs/README.md#структура) — контекст проекта, процессы, CMS-архитектура.
- [`docs/reports/report-for-director.md`](docs/reports/report-for-director.md) — отчёт руководству.
- [`CHANGELOG.md`](CHANGELOG.md) — хронология релизов.

## Переменные окружения

Минимум для запуска CMS (см. `.env.example`):

| Переменная | Назначение |
|-----------|------------|
| `PAYLOAD_SECRET` | Подписи сессий Payload (≥32 символа); без него Vercel Production не собирается |
| `NEXT_PUBLIC_SITE_URL` | Канонический публичный origin сайта |
| `DATABASE_URL_UNPOOLED` или `POSTGRES_URL_NON_POOLING` | Direct connection к Neon только для контролируемых audit/migration-команд |
| `DATABASE_URL` или `POSTGRES_URL` | Pooled connection (runtime queries) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage |
| `LEAD_ALLOWED_ORIGINS` | Дополнительные разрешённые origin форм заявок через запятую |
| `LEAD_ALLOW_NO_ORIGIN` | Разрешение запросов без `Origin`; в production оставлять `false` |
| `LEAD_RATE_LIMIT_MAX`, `LEAD_RATE_LIMIT_WINDOW_MS` | Лимит заявок на клиента и окно ограничения |
| `LEAD_RATE_LIMIT_SALT` | Опциональная соль хеша клиента; иначе используется `PAYLOAD_SECRET` |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Распределённый rate limit между Vercel-инстансами |
| `BITRIX24_WEBHOOK_URL` | Опционально — доставка лидов в CRM |
| `BITRIX24_FIELD_*` | Опционально — custom fields для структурированных данных в Bitrix24 |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Опционально — уведомления о заявках |
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | Опционально — счетчик Яндекс Метрики |
| `GOOGLE_SITE_VERIFICATION`, `YANDEX_SITE_VERIFICATION` | Опционально — подтверждение сайта в поисковых кабинетах |
| `GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL`, `GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY`, `GOOGLE_SEARCH_CONSOLE_SITE_URL` | Read-only подключение SEO-отчётов Google |
| `YANDEX_WEBMASTER_*` | Подключение SEO-отчётов Яндекса |

Одноразовая синхронизация привязок товарных калькуляторов запускается только с двумя build-переменными: `RUN_PRODUCT_CALCULATOR_BINDING_SYNC=true` и `PRODUCT_CALCULATOR_BINDING_SYNC_CONFIRMATION=APPLY_PRODUCT_CALCULATOR_BINDINGS`. Скрипт меняет только `pageMode` и `calculatorProfile` у заранее утверждённых товаров и после записи проверяет каждую связь.

Подключение и ограничения SEO-источников описаны в [`docs/operations/seo-reporting.md`](docs/operations/seo-reporting.md).

Без `BITRIX24_WEBHOOK_URL` Bitrix24 мягко пропускается. Заявка считается принятой только после успешной доставки хотя бы в один реальный канал: CMS, email, Telegram или Bitrix24. Если все каналы недоступны, API возвращает `503`, а интерфейс не показывает ложный успех. Для стабильного общего лимита на всех Vercel-инстансах рекомендуется Upstash Redis; без него действует ограниченный in-memory fallback каждого инстанса.

## Деплой

Auto-deploy на Vercel из ветки `main` (1–3 минуты). Build pipeline — `npm run vercel-build`:

```
security:audit → conditional-production-migrate → conditional-current-state-sync →
conditional-product-calculator-binding-sync → images:optimize → cms:check →
cms:generate-types → cms:generate-importmap → cms:check → next build
```

Обычный build не изменяет production-БД. Миграции включаются только для одного
явно подтверждённого Production deployment: с точным release-name, direct URL
и одноразовыми `--build-env` флагами. Подробности —
[`docs/operations/cms-migrations.md`](docs/operations/cms-migrations.md),
[`docs/operations/deployment-guide.md`](docs/operations/deployment-guide.md) и
[`docs/operations/deployment-checklist.md`](docs/operations/deployment-checklist.md).

## Бизнес-правило калькулятора

Калькулятор показывает **ориентировочную** стоимость («от ... ₽», «стартовая стоимость», «ориентир»). Финальная цена всегда определяется менеджером. В UI не должно появляться формулировок «точно», «гарантированно» — это контрактное обещание, которого сайт дать не может.

## Контрибьюции

1. Перед изменением `lib/calculator/pricing.ts` или `data/storageSystems/excelCalculator.ts` — прогон `npm run test`.
2. После изменения `payload.config.ts` или коллекций — пересборка importMap (`npm run cms:generate-importmap` на Linux/Mac/WSL).
3. Изменение Payload schema — новая проверенная миграция; обычный Vercel build не выполняет DDL, контролируемый Production release требует точного имени миграции и одноразового подтверждения.
4. Любой non-trivial фикс — отразить в `CHANGELOG.md` или соответствующем `docs/**/*.md`.
5. Production не ломать: эксперименты — на feature-ветках, cutover в `main` — после smoke на preview.

## Безопасность

- Политика: [`SECURITY.md`](SECURITY.md).
- Перед релизом: `npm run security:audit` и `npm run quality`.
- Реальные секреты никогда не добавляются в Git; используются Vercel/GitHub
  Secrets и локальный `.env.local`.
- Dependabot еженедельно проверяет npm и ежемесячно GitHub Actions.
- Устаревшая цепочка `drizzle-kit -> @esbuild-kit/core-utils` получает через
  npm override безопасный `esbuild 0.25.12`. Команда `security:audit`
  дополнительно проверяет совместимость sync/async TypeScript transform и
  блокирует Vercel build при любом новом риске уровня moderate и выше.
- CI и Vercel разрешают install-скрипты только для точных проверенных версий
  из `package.json#allowScripts`; новая транзитивная зависимость со скриптом
  останавливает установку до ручного аудита.

## Лицензия и владение

Проект принадлежит ООО «Технокам» / КБ Парус. Внутренний коммерческий продукт.
