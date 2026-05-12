# CMS Content Architecture

Цель: постепенно перевести сайт из code-driven режима в CMS-driven режим без риска для production.

## Текущая карта контента

| Зона сайта | Сейчас | Целевая CMS-модель | Статус |
| --- | --- | --- | --- |
| Hero главной | `home-content` + fallback | Global `home-content.hero` + Media | частично в CMS |
| Контакты | hardcoded в `app/page.tsx` | Global `contacts` | подключено к CMS |
| Метрики главной | `app/page.tsx` | `home-content.hero.metrics`, далее отдельные section metrics | частично в CMS |
| Преимущества | `app/page.tsx` | `home-content.advantages` или блок `advantages` | модель есть, frontend hardcoded |
| Что храним | `app/page.tsx` | `home-content.storedMaterials` + Media | модель есть, frontend hardcoded |
| До/после | `app/page.tsx` + `visualAssets` | `home-content.beforeBlock/afterBlock` + Media | модель есть, frontend hardcoded |
| Кейсы | `app/page.tsx` + `visualAssets` | Collection `cases` или `home-content.cases` | модель есть в global, frontend hardcoded |
| География | `app/page.tsx` | `home-content.geoProjects` + future map settings | модель есть, frontend hardcoded |
| Отзывы | `app/page.tsx` | Collection `reviews` или `home-content.reviews` | модель есть in global, frontend hardcoded |
| Партнёры | placeholder array in code | Collection `partners` или `home-content.partners` | модель есть, frontend hardcoded |
| FAQ | `app/page.tsx` | `home-content.faq` | модель есть, frontend hardcoded |
| Баннеры | hardcoded images/URLs | `home-content.kbparusBanner/coatingBanner` | модель есть, frontend hardcoded |
| Каталог главной | `excelHomeCatalog` + `lib/cms/catalog.ts` fallback | Collection `categories` | чтение подключено к CMS-first adapter |
| Категории каталога | `data/storageSystems/*` + `lib/cms/catalog.ts` fallback | Collection `categories` + Media + SEO | чтение подключено к CMS-first adapter |
| Подкатегории | `catalogDepth.ts` | Collection `subcategories` | CMS collection есть, frontend hardcoded |
| Товары | `catalogDepth.ts` | Collection `products` + gallery/specs/SEO | CMS collection есть, frontend hardcoded |
| Калькулятор | `lib/calculator`, `excelCalculator.ts` | `calculator-profiles` + controlled logic in code | CMS model есть, runtime logic hardcoded |
| Заявки | `/api/leads`, Telegram | Collection/global for lead ops + future Bitrix24 | Telegram работает, Bitrix24 не подключён |

## Целевая модель

### Globals

- `home-content`: модульное управление главной страницей.
- `contacts`: телефоны, email, адрес, соцсети, мессенджеры, реквизиты.
- `lead-management`: операционный статус форм, Telegram, подготовка Bitrix24.
- Future: `site-settings` для сквозного SEO, навигации, robots/canonical defaults.

### Collections

- `categories`: верхний уровень каталога и карточки на главной.
- `subcategories`: посадочные страницы внутри категории.
- `products`: конкретные товары, галереи, specs, SEO, price mode.
- `calculator-profiles`: управляемые профили расчёта, но формулы остаются в коде до отдельной миграции.
- Future: `cases`, `reviews`, `partners`, `faq` если потребуется переиспользование вне главной.

### Blocks

Для главной безопасный путь — не сразу generic page builder, а фиксированные бизнес-блоки:

- Hero
- Metrics
- Catalog preview
- Stored materials
- Before / After
- Advantages
- Cases
- Geography
- Reviews
- About
- Banners
- Shipment steps
- Partners
- FAQ
- Contacts CTA

Generic reorderable blocks стоит вводить позже, когда менеджеры подтвердят реальный процесс редактирования.

## Стратегия миграции

1. Оставлять визуальные React-компоненты как есть.
2. Добавлять `lib/cms/*` адаптеры с fallback на текущие данные.
3. Подключать CMS по одному блоку.
4. Не удалять `data/storageSystems` до полного parity.
5. Для каталога сначала читать CMS collections, если в них есть опубликованные записи; иначе использовать текущие data-файлы.
6. Сохранять текущие URL: `/catalog/[id]`, `/catalog/[id]/[productId]`.
7. Не делать write-migration в production без отдельного seed/rollback плана.

## Bitrix24 preparation

Текущий `/api/leads` уже отделяет короткие контактные заявки от заявок конфигуратора.

Целевая архитектура:

- env: `BITRIX24_WEBHOOK_URL`;
- mapping layer: `lib/leads/bitrix24.ts`;
- unified lead DTO после frontend normalization;
- retry/fallback: Telegram отправляется независимо; ошибка Bitrix24 не должна ломать форму;
- логирование без персональных данных и без raw JSON в публичных ответах;
- calculator fields передаются человекочитаемо, без Excel/ID/SKU;
- future: очередь/retry через durable storage, если объём заявок вырастет.

## Первый внедрённый шаг

`contacts` подключён к frontend через `lib/cms/contacts.ts`. Если CMS недоступна или global пустой, используются текущие production fallback-значения.

## Второй внедрённый шаг

Категории каталога подключены к frontend через `lib/cms/catalog.ts`.

- Главная, dropdown каталога, `/catalog/[id]`, хлебные крошки товаров и sitemap читают Payload collection `categories`.
- Если CMS недоступна, запись неполная или категория ещё не заведена, используется `excelHomeCatalog`.
- URL `/catalog/[id]` сохранены: CMS `slug` должен совпадать с текущим `id`.
- Товары, спецификации, галереи и калькулятор пока остаются в `data/storageSystems` и `lib/calculator`.
