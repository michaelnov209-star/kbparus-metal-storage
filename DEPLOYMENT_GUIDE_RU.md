# Инструкция по деплою — КБ Парус

**Production URL:** https://kbparus-metal-storage.vercel.app  
**Репозиторий:** GitHub → Vercel (автоматический деплой)  

---

## Предварительные требования

- **Node.js** 20+ (проверить: `node -v`)
- **Git** (проверить: `git -v`)
- Доступ к репозиторию на GitHub
- (Опционально) Аккаунт Vercel для управления

---

## Локальная разработка

### Первый запуск

```bash
# 1. Клонировать репозиторий
git clone https://github.com/YOUR_ORG/kbparus-metal-storage.git
cd kbparus-metal-storage

# 2. Установить зависимости
npm install

# 3. Создать файл окружения (если нужна реальная CRM)
cp .env.example .env.local
# Отредактировать .env.local, добавить BITRIX24_WEBHOOK_URL

# 4. Запустить dev-сервер
npm run dev
```

Сайт будет доступен на: http://localhost:3000

### Ежедневная разработка

```bash
# Запустить dev-сервер
npm run dev

# Проверить TypeScript (без ошибок)
npm run lint

# Запустить тесты
npm run test

# Собрать production build локально
npm run build
npm run start  # запустить собранную версию
```

---

## Переменные окружения

### Список переменных

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `BITRIX24_WEBHOOK_URL` | Нет | URL webhook для отправки лидов в CRM. Без этой переменной API работает в mock-режиме |

### Для локальной разработки

Создать файл `.env.local` в корне проекта (не коммитить, он в `.gitignore`):

```bash
BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.ru/rest/1/your-token/crm.deal.add.json
```

### Для production (Vercel)

1. Открыть https://vercel.com/dashboard
2. Выбрать проект `kbparus-metal-storage`
3. Перейти: **Settings → Environment Variables**
4. Добавить:
   - Name: `BITRIX24_WEBHOOK_URL`
   - Value: (URL webhook из Bitrix24)
   - Environment: Production, Preview, Development
5. Нажать **Save**
6. Запустить новый деплой (Push новый коммит или нажать **Redeploy** в Dashboard)

---

## Автоматический деплой

### Как работает

```
Разработчик → git push origin main → GitHub → Vercel (автоматически) → https://kbparus-metal-storage.vercel.app
```

1. Разработчик делает `git push` в ветку `main`
2. GitHub уведомляет Vercel через webhook
3. Vercel автоматически запускает `npm run build`
4. При успешной сборке — деплоит на production URL
5. При ошибке сборки — деплой отменяется, предыдущая версия остаётся активной

**Время деплоя:** обычно 1-3 минуты

### Preview deploys

Каждый push в любую ветку (кроме main) создаёт **Preview Deploy** с уникальным URL:

```
Разработчик → git push origin feature/my-branch → Vercel → https://kbparus-metal-storage-git-feature-my-branch.vercel.app
```

Preview deploy позволяет:
- Протестировать изменения до слияния в main
- Поделиться ссылкой для проверки заказчиком
- Автоматически удаляется через 30 дней

---

## Деплой через CLI (опционально)

Требует установки Vercel CLI:

```bash
npm i -g vercel

# Авторизоваться
vercel login

# Задеплоить preview (без push в git)
vercel

# Задеплоить в production
vercel --prod
```

---

## Ручной деплой через Vercel Dashboard

Если автоматический деплой не сработал:

1. Открыть https://vercel.com/dashboard
2. Выбрать проект
3. Нажать кнопку **Redeploy** на последнем deployment
4. Выбрать **Redeploy without changing Environment Variables**
5. Нажать **Redeploy**

---

## Чеклист после деплоя

После каждого production-деплоя проверить:

### Основной функционал

- [ ] Главная страница открывается: https://kbparus-metal-storage.vercel.app
- [ ] Видео в hero-секции воспроизводится автоматически
- [ ] Каталог отображает 17 категорий с изображениями
- [ ] Страница категории открывается: `/catalog/auto-sheet-metal`
- [ ] Калькулятор: переключение шагов 1 → 2 → 3 работает
- [ ] Калькулятор: цена пересчитывается при изменении параметров
- [ ] Форма заявки в калькуляторе: кнопка "Отправить заявку" активна
- [ ] Форма в разделе "Контакты": отправка работает (статус "Заявка отправлена")

### SEO и инфраструктура

- [ ] `/robots.txt` возвращает корректный текст
- [ ] `/sitemap.xml` возвращает XML с 22+ URL
- [ ] Open Graph: при расшаривании ссылки показывается превью

### API

- [ ] POST `/api/leads` с тестовым payload возвращает `{ ok: true }`
  ```bash
  curl -X POST https://kbparus-metal-storage.vercel.app/api/leads \
    -H "Content-Type: application/json" \
    -d '{"contact":{"name":"Тест","phone":"+7 999 000 00 00"}}'
  ```

### CRM (если настроен webhook)

- [ ] Тестовая заявка появляется в Bitrix24 → CRM → Лиды
- [ ] Данные корректно заполнены (имя, телефон, параметры оборудования)

---

## Откат к предыдущей версии

Если новый деплой сломал что-то критическое:

### Через Vercel Dashboard (быстрее, ~30 секунд)

1. Открыть https://vercel.com/dashboard → проект
2. Перейти в **Deployments**
3. Найти последний рабочий deployment
4. Нажать **...** → **Promote to Production**
5. Сайт немедленно переключится на старую версию

### Через git (сохраняет историю корректно)

```bash
# Откатить последний коммит (создаёт revert-коммит)
git revert HEAD
git push origin main

# Откатить несколько коммитов
git revert HEAD~3..HEAD
git push origin main
```

---

## Мониторинг

### Vercel Analytics

1. Открыть https://vercel.com/dashboard → проект → **Analytics**
2. Доступно: количество запросов, p95 latency, ошибки 5xx/4xx

### Логи деплоев

1. Vercel Dashboard → проект → **Deployments**
2. Клик на любой deployment → **Build Logs** или **Runtime Logs**
3. Искать строки `Error:` или `Warning:` при проблемах

### Vercel Status

Если сам Vercel недоступен: https://www.vercel-status.com/

---

## Troubleshooting

### Ошибка сборки: TypeScript

```bash
# Проверить локально до push
npm run lint
```

TypeScript errors блокируют деплой. Все ошибки должны быть исправлены.

### Ошибка сборки: Module not found

```bash
# Проверить, что все зависимости установлены
npm install
npm run build
```

### Страница 404 на `/catalog/[id]`

Проверить `generateStaticParams()` в `app/catalog/[id]/page.tsx`. Значение `id` должно совпадать с полем `id` в `excelHomeCatalog`.

### API /api/leads возвращает 500

1. Проверить Vercel Function Logs
2. Если `BITRIX24_WEBHOOK_URL` установлен — проверить корректность URL
3. Убрать `BITRIX24_WEBHOOK_URL` для возврата в mock-режим

### Видео в hero не воспроизводится

Файл `public/assets/videos/metal-storage-hero-trimmed.mp4` должен существовать. Проверить размер (должен быть < 50MB для оптимальной загрузки). Видео воспроизводится автоматически только при `muted` атрибуте — это требование браузеров.
