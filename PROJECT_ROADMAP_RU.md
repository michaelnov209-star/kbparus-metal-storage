# Дорожная карта — КБ Парус / Системы хранения металла

**Дата обновления:** 2026-05-09 (после сессии 2)  
**Production URL:** https://kbparus-metal-storage.vercel.app  

---

## Спринт 0 — Технические основы (ВЫПОЛНЕНО)

### Сессия 1 (утро 2026-05-09)
- ✅ SEO: robots.txt + dynamic sitemap (22+ URL)
- ✅ Safari-совместимость: `@supports` fallback для `animation-timeline`
- ✅ Документация: `.env.example`
- ✅ Кеширование ассетов: `vercel.json`
- ✅ Чистота зависимостей: убран `ffmpeg-static`
- ✅ Мёртвый CSS: убраны Pexels URL
- ✅ 6 RU-документов

### Сессия 2 (день 2026-05-09)
- ✅ Обновлены npm-пакеты: next 16.2.6, react 19.2.6, lucide-react 1.14.0
- ✅ Исправлен placeholder `weight-scale`: 3 ₽ → 90 000 ₽ (из Excel)
- ✅ Заменён баннер: coating-lines → baner_liniiokraski.png
- ✅ Добавлены 14 продуктов из нового Excel (9 в категории 2, 5 в категории 4)
- ✅ Раскрытие ассортимента на странице категории (для всех с продуктами)
- ✅ **Production hardening:**
  - Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
  - `poweredByHeader: false`, `reactStrictMode: true`
  - Rate-limiting на `/api/leads` (5 req/min/IP)
  - Honeypot поле + speed-trap (минимум 2 сек на заполнение)
  - Серверная валидация телефона и email
  - Sanitize и max-length на полях
  - Timeout 10с на запрос к Bitrix24
  - Anti-double-submit в LeadForm

---

## Спринт 1 — Конверсия и CRM (СЛЕДУЮЩИЙ ПРИОРИТЕТ)

**Цель:** Превратить сайт из витрины в реальный канал продаж.

### 1.1 Bitrix24 webhook — КРИТИЧНО (10 минут)

**Что:** Настроить переменную `BITRIX24_WEBHOOK_URL` в Vercel Environment Variables.  
**Зачем:** Все заявки сейчас уходят в mock-режим, в CRM не попадают.  
**Кто:** Менеджер с доступом к Bitrix24 + разработчик с доступом к Vercel.  
**Шаги:**
1. В Bitrix24: Приложения → Webhooks → Создать входящий webhook → разрешить `crm.deal.add`
2. Скопировать URL webhook (формат: `https://YOUR.bitrix24.ru/rest/USER_ID/TOKEN/`)
3. В Vercel Dashboard: Settings → Environment Variables → добавить `BITRIX24_WEBHOOK_URL`
4. Redeploy проекта (или подождать следующего push в main)
5. Тест: отправить заявку с сайта → проверить, что появилась в CRM

### 1.2 Telegram-уведомления при заявке (2-3 часа)

**Что:** При новой заявке отправлять сообщение в Telegram-чат менеджеров.  
**Зачем:** Быстрая реакция без постоянного мониторинга Bitrix24.  
**Файлы:** `app/api/leads/route.ts`  
**Реализация:**
1. Создать Telegram-бота через @BotFather
2. Добавить бота в чат менеджеров, получить chat_id
3. Добавить env-переменные: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
4. После успешной отправки в Bitrix24 — `fetch` к `https://api.telegram.org/bot{TOKEN}/sendMessage`
5. Текст сообщения: имя, телефон, город, тип оборудования, ориентировочная цена

### 1.3 UTM-трекинг (3 часа)

**Что:** Читать UTM-параметры из URL и передавать в `/api/leads` → Bitrix24.  
**Зачем:** Понимание эффективности каналов трафика.  
**Файлы:** `components/LeadForm.tsx`, `components/Calculator.tsx`  
**Реализация:**
- При первой загрузке страницы сохранить `URLSearchParams` (utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_referrer) в `localStorage`
- При отправке заявки прочитать из `localStorage` и положить в `payload.utm`
- В `/api/leads/route.ts` это уже принимается и пересылается в `UF_UTM`

### 1.4 Передача calculator state в форму контактов (4-6 часов)

**Что:** Сейчас `LeadForm` в разделе "Контакты" отправляет пустой `calculatorInput: {}`.  
**Зачем:** Менеджер не видит, что пользователь выбрал в калькуляторе перед заявкой.  
**Реализация:**
- React Context `CalculatorContext` в `app/page.tsx`
- `Calculator` обновляет state при изменении
- `LeadForm` читает state и передаёт в payload
- Альтернатива: `localStorage` для persistence между перезагрузками

### 1.5 Реальные фотографии КБ Парус (зависит от заказчика)

**Что:** Заменить Pexels-фото в `data/storageSystems/visualAssets.ts` на реальные.  
**Кто:** Маркетолог + фотограф КБ Парус.  
**Эффект:** Резкий рост доверия со стороны B2B-клиентов.

---

## Спринт 2 — Расширение каталога

### 2.1 Calculator-профили из Excel (большая задача, 30+ часов)

**Что:** Новый Excel содержит 32 листа продуктов, каждый со своими формулами цен.  
**Сейчас в коде:** 6 calculator-профилей.  
**Нужно:** Постепенно добавлять профили для самых востребованных продуктов.  
**Приоритет:** Сначала те 14 продуктов, которые мы только что добавили (manual-sheet-metal, manual-sort-and-pipe-storage).

### 2.2 Продуктовые страницы для остальных 14 категорий

Сейчас продукты есть только в 3 категориях. Остальные 14 категорий показывают generic-страницу. Нужны:
- Контент описаний от КБ Парус
- Изображения продуктов
- Технические характеристики

### 2.3 CMS / Admin UI для контента

**Варианты:** Sanity, Contentful, Tina CMS  
**Зачем:** Маркетолог сможет менять цены и описания без разработчика.

---

## Спринт 3 — Аналитика и SEO

### 3.1 Yandex Metrika + Google Analytics 4 (1-2 часа)

**Файлы:** `app/layout.tsx`  
**Использовать:** `next/script` с `strategy="afterInteractive"`

### 3.2 Цели в аналитике (3-4 часа)

- Открытие страницы калькулятора
- Переход с шага 1 на 2, с 2 на 3
- Отправка формы заявки
- Клик на телефон / email
- Скролл до 50% / 100% страницы

### 3.3 SEO-контент по 17 категориям (зависит от копирайтера)

Уникальные тексты 1000+ слов на каждую страницу категории. Сейчас только короткие `description` в `generateMetadata`.

### 3.4 Schema.org разметка (4-6 часов)

JSON-LD: `Organization`, `Product`, `FAQPage`, `BreadcrumbList`. Эффект — rich snippets в выдаче Google.

---

## Спринт 4 — UX-полировка

### 4.1 Мобильное бургер-меню (4-6 часов)
### 4.2 Error boundaries (3-4 часа)
### 4.3 Loading skeletons (2-3 часа)
### 4.4 Микроанимации hover (1-2 часа)

---

## Спринт 5 — Безопасность 2.0

### 5.1 CAPTCHA на формах (4-6 часов)

**Варианты:** hCaptcha (бесплатно, приватность), Cloudflare Turnstile, reCAPTCHA v3.  
**Когда нужно:** Если honeypot перестал справляться (бот-трафик).

### 5.2 Content Security Policy (CSP) (4-8 часов)

Сейчас CSP не настроен. Запустить strict CSP сложно из-за inline стилей в `LinePageStyles.tsx`. Требует рефакторинга.

### 5.3 Persistent rate-limiting (Redis/Upstash) (4 часа)

Сейчас rate-limit хранится в памяти Lambda. На Vercel каждая Lambda холодным стартом сбрасывает счётчик. Решение: Upstash Redis (бесплатный план).

### 5.4 Webhook signature verification

Если будем принимать webhook от 1С/Bitrix24 — проверять подпись.

---

## Долгосрочно (6+ месяцев)

### 1С / WMS интеграция
Синхронизация наличия и цен из 1С на сайт через REST API + webhook.

### Личный кабинет B2B
NextAuth + PostgreSQL + история заявок + статусы проектов + документы.

### 3D-конфигуратор
Three.js / Babylon.js — интерактивная визуализация конфигурации стеллажа.

---

## Конкретные следующие шаги (по приоритету)

| # | Задача | Время | Кто | Эффект |
|---|--------|-------|-----|--------|
| 1 | **Bitrix24 webhook** | 10 мин | Менеджер + DevOps | Заявки попадают в CRM |
| 2 | **Telegram-уведомления** | 3 ч | Разработчик | Реакция в течение 1-2 минут |
| 3 | **Yandex Metrika** | 1 ч | DevOps | Понимание трафика |
| 4 | **UTM-трекинг** | 3 ч | Разработчик | Атрибуция каналов |
| 5 | **Реальные фото** | — | КБ Парус (фотограф) | Доверие клиентов |
| 6 | **Calculator state в LeadForm** | 5 ч | Разработчик | Менеджер видит выбор клиента |
| 7 | **Schema.org Organization + Product** | 4 ч | Разработчик | Rich snippets в Google |
| 8 | **Цели в Метрике** | 3 ч | Маркетолог + разработчик | Воронка продаж |
| 9 | **CMS** | большая задача | Решение менеджмента | Автономность маркетолога |
| 10 | **Calculator-профили из Excel** | большая задача | Разработчик | Полная функциональность |

**Главный следующий шаг:** Bitrix24 webhook (10 минут, без кода) превращает сайт из мок-витрины в реальный канал лидогенерации.
