# Передача проекта разработчику — КБ Парус

**Дата:** 2026-05-09  
**Production URL:** https://kbparus-metal-storage.vercel.app  
**Репозиторий:** GitHub → Vercel (auto-deploy из ветки `main`)  

---

## Быстрый старт

```bash
git clone https://github.com/YOUR_ORG/kbparus-metal-storage.git
cd kbparus-metal-storage
npm install
npm run dev          # http://localhost:3000
npm run lint         # TypeScript проверка
npm run test         # 7 тест-кейсов
npm run build        # production сборка
```

Переменные окружения: скопировать `.env.example` → `.env.local`, заполнить при необходимости.

---

## Стек

| Технология | Версия | Назначение |
|-----------|--------|-----------|
| Next.js | 16.x | App Router, SSG, API Routes |
| React | 19.x | UI |
| TypeScript | 5.9 (strict) | Типизация |
| CSS | нативный | Стили (нет Tailwind, нет CSS-in-JS) |
| lucide-react | 1.x | Иконки |
| Vitest | 4.x | Тесты |
| Vercel | — | Деплой + CDN |

---

## Структура проекта

```
/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Главная страница (600+ строк)
│   ├── layout.tsx                # Корневой лейаут + метаданные
│   ├── globals.css               # Все стили (~880 строк)
│   ├── sitemap.ts                # Динамический sitemap (22+ URL)
│   ├── opengraph-image.tsx       # OG-картинка
│   ├── icon.svg                  # Favicon
│   ├── catalog/
│   │   └── [id]/
│   │       ├── page.tsx          # Страница категории (17 шт.)
│   │       └── [productId]/
│   │           └── page.tsx      # Страница продукта (4 пилот)
│   └── api/
│       └── leads/
│           └── route.ts          # POST /api/leads → Bitrix24
│
├── components/                   # React-компоненты
│   ├── BrandMark.tsx             # Логотип + подпись
│   ├── Calculator.tsx            # 3-шаговый калькулятор (640 строк)
│   ├── CatalogGrid.tsx           # Сетка 17 категорий
│   ├── FaqAccordion.tsx          # FAQ с поиском
│   ├── HeroVisual.tsx            # НЕ ИСПОЛЬЗУЕТСЯ в page.tsx (legacy)
│   ├── ImageLightbox.tsx         # Лайтбокс для изображений
│   ├── LeadForm.tsx              # Форма заявки (контакты)
│   ├── LinePageStyles.tsx        # Inline-стили для page.tsx
│   ├── ProductConfigurator.tsx   # Конфигуратор на странице продукта
│   ├── ProductGallery.tsx        # Галерея на странице продукта
│   ├── SliderControls.tsx        # Кнопки слайдера
│   └── SolutionsShowcase.tsx     # Вкладки по типам решений
│
├── data/storageSystems/          # Все бизнес-данные (TypeScript)
│   ├── excelCatalog.ts           # 17 категорий каталога
│   ├── catalogDepth.ts           # 4 пилот-продукта
│   ├── excelCalculator.ts        # 6 профилей калькулятора
│   ├── priceFactors.ts           # Коэффициенты цен
│   ├── content.ts                # Тексты страниц
│   ├── productCategories.ts      # Типы продуктов (SolutionsShowcase)
│   ├── visualAssets.ts           # URL изображений (временные стоки)
│   ├── calculatorOptions.ts      # Опции калькулятора
│   ├── marketInsights.ts         # Маркетинговые данные
│   ├── referenceLinks.ts         # Ссылки
│   └── types.ts                  # TypeScript-типы данных
│
├── lib/calculator/               # Бизнес-логика калькулятора
│   ├── index.ts                  # Barrel-экспорт
│   ├── types.ts                  # CalculatorInput, CalculatorResult
│   ├── validation.ts             # normalizeCalculatorInput()
│   ├── pricing.ts                # calculateStorageSystem()
│   ├── recommendation.ts         # recommendStorageSystem()
│   └── format.ts                 # formatRub(), formatRoundedRub()
│
├── tests/
│   └── calculator.test.ts        # 7 тест-кейсов калькулятора
│
├── docs/                         # Документация (английский, от Codex)
│   ├── CLAUDE_CODE_HANDOFF.md
│   ├── PROJECT_CONTEXT.md
│   ├── CONTENT_COLLECTION_WORKFLOW.md
│   └── SITE_PROCESSES.md
│
├── public/
│   ├── robots.txt                # Инструкции для роботов
│   ├── brand/
│   │   └── logo-g.png            # Логотип КБ Парус
│   └── assets/
│       ├── images/
│       │   ├── catalog/          # 17 изображений категорий
│       │   └── products/auto-sheet-metal/  # 13 фото пилот-продуктов
│       └── videos/
│           └── metal-storage-hero-trimmed.mp4  # Видео для hero
│
├── .env.example                  # Пример переменных окружения
├── vercel.json                   # Кеш-заголовки для статики
├── package.json
├── tsconfig.json
├── next.config.mjs
└── vitest.config.ts
```

---

## Ключевые файлы и за что они отвечают

### Хочу изменить тексты на сайте
→ `data/storageSystems/content.ts` — большинство текстов  
→ `app/page.tsx` — inline тексты hero-секции и некоторых блоков  
→ `data/storageSystems/excelCatalog.ts` — названия и описания категорий

### Хочу добавить категорию в каталог
→ `data/storageSystems/excelCatalog.ts` — добавить объект в массив `excelHomeCatalog`  
→ `public/assets/images/catalog/` — добавить изображение  
→ `app/sitemap.ts` — обновится автоматически (читает `excelHomeCatalog`)

### Хочу добавить продукт в категорию
→ `data/storageSystems/catalogDepth.ts` — добавить в `catalogProducts`  
→ `public/assets/images/products/[category-id]/` — добавить фото

### Хочу изменить цены в калькуляторе
→ `data/storageSystems/priceFactors.ts` — базовые цены и коэффициенты  
→ `data/storageSystems/excelCalculator.ts` — цены опций  
→ После изменения: `npm run test` — убедиться, что тест-кейсы всё ещё проходят

### Хочу изменить дизайн
→ `app/globals.css` — все CSS-переменные и стили  
→ Основные переменные: `--accent: #fc5413`, `--ink: #101216`, `--white: #ffffff`

### Хочу изменить SEO
→ `app/layout.tsx` — метаданные для главной страницы  
→ `app/catalog/[id]/page.tsx` → `generateMetadata()` — метаданные категорий

---

## Бизнес-логика

### Что делает сайт

1. **Показывает каталог** из 17 категорий промышленных систем хранения
2. **Предоставляет калькулятор** для предварительного расчёта стоимости оборудования
3. **Принимает заявки** через форму → передаёт в Bitrix24 CRM
4. **Формирует доверие** через описания, фото, FAQ, контакты

### Калькулятор (3 шага)

**Шаг 1 — Выбор профиля:** Пользователь выбирает тип системы хранения (6 вариантов)  
**Шаг 2 — Параметры:** Вводит габариты, нагрузку, количество башен/полок, дополнительные опции  
**Шаг 3 — Результат:** Видит ориентировочную стоимость и заполняет форму заявки  

**Важно:** Калькулятор показывает ОРИЕНТИРОВОЧНУЮ цену. Финальная стоимость всегда определяется менеджером. Не добавлять фразы типа "Точная цена" или "Гарантированная стоимость".

### API заявок (`POST /api/leads`)

```typescript
// Входящий payload
{
  contact: { name: string, phone: string, email?: string },
  city?: string,
  comment?: string,
  calculatorInput?: CalculatorInput,  // параметры из калькулятора
  utm?: { source, medium, campaign, content, term }
}

// Ответ при mock-режиме (нет BITRIX24_WEBHOOK_URL)
{ ok: true, mode: "mock", payload: { ... } }

// Ответ при реальной интеграции
{ ok: true, bitrix24Id: 123 }
```

---

## Переменные окружения

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `BITRIX24_WEBHOOK_URL` | Нет | URL для отправки лидов. Без неё — mock-режим |

**Без `BITRIX24_WEBHOOK_URL`:** API принимает заявки, логирует в консоль Vercel, возвращает `{ ok: true, mode: "mock" }`. Заявки в CRM не попадают.

---

## Правила разработки (что НЕЛЬЗЯ трогать без причины)

1. **`lib/calculator/pricing.ts`** — основная формула. Изменение требует прогона `npm run test`
2. **`data/storageSystems/priceFactors.ts`** — коэффициенты из Excel. Изменение = ручная проверка с оригиналом
3. **`app/globals.css`** — единый источник стилей. Не дублировать стили в компонентах
4. **`data/storageSystems/excelCatalog.ts`** — ровно 17 категорий. Изменение ID категории ломает роутинг
5. **`app/layout.tsx`** — metadata влияет на SEO и OG-превью
6. **`.gitignore`** — `.env` и `.env.local` исключены. Никогда не коммитить файлы с реальными ключами

---

## Процесс деплоя

```bash
git add .
git commit -m "Описание изменений"
git push origin main
# → Vercel автоматически деплоит за 1-3 минуты
```

Подробнее: `DEPLOYMENT_GUIDE_RU.md`

---

## Известные ограничения и TODO

### Требуют данных от КБ Парус
- [ ] `BITRIX24_WEBHOOK_URL` — webhook из Bitrix24 аккаунта компании
- [ ] Реальная цена опции "Весы на распалетчик" (`weight-scale` = 3 ₽ — placeholder)
- [ ] Реальные фотографии оборудования (заменить Pexels в `data/storageSystems/visualAssets.ts`)
- [ ] Описания и характеристики продуктов для 16 категорий (кроме пилотной)

### Технический долг
- [ ] `components/HeroVisual.tsx` — импортируется, но не используется. Можно удалить
- [ ] `calculatorInput` не передаётся из раздела "Контакты" при отправке формы
- [ ] UTM-параметры не читаются из URL при отправке заявки
- [ ] Нет error boundaries — при crash калькулятора страница пустеет
- [ ] Нет мобильного бургер-меню (приемлемо для B2B с desktop-аудиторией)

### Следующий приоритет
1. Настроить `BITRIX24_WEBHOOK_URL` в Vercel (10 минут, максимальный эффект)
2. Добавить Telegram-уведомление при новой заявке (2-3 часа)
3. Исправить `weight-scale` цену

---

## Контакты по проекту

**Компания:** КБ Парус / ООО Технокам  
**Сайт основной:** [смотреть docs/PROJECT_CONTEXT.md]  
**CRM:** Bitrix24 [webhook URL нужно получить от компании]  
**Деплой:** Vercel Dashboard (доступ нужен от компании)  

---

## История изменений

| Дата | Исполнитель | Что изменено |
|------|------------|-------------|
| 2026-04-28 — 2026-05-08 | Codex | Начальная разработка MVP, калькулятор, каталог, видео, polish |
| 2026-05-09 | Claude Sonnet 4.6 | SEO-инфраструктура, CSS-фиксы, удаление долга, документация |

Детальный журнал: `CLAUDE_WORKLOG_RU.md`  
Полный changelog: `CHANGELOG.md`
