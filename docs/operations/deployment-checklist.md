# Deployment Checklist — KB Parus + Payload CMS

## Важное по текущему CMS pipeline

- Vercel должен использовать Node 22.x.
- `vercel-build` намеренно запускает CMS-проверки до `next build`: `cms:check`, `cms:generate-importmap`, `cms:push-schema`, повторный `cms:check`.
- `payload generate:importmap` должен реально проходить на Vercel. Если он падает, deploy не должен публиковаться.
- importMap не поддерживается вручную как финальное решение: файл `app/(payload)/admin/importMap.ts` генерируется Payload CLI.
- После deploy обязательно проверить `/api/health` и `/admin`.

## Перед первым деплоем feat/payload-cms на production

### 1. Vercel env-переменные (Production environment)

Открыть **Vercel Dashboard → Project → Settings → Environment Variables** и проверить наличие:

| Переменная | Где взять | Обязательна |
|------------|-----------|-------------|
| `PAYLOAD_SECRET` | сгенерировать (≥32 символа) | ✅ |
| `DATABASE_URL` | Neon integration | ✅ |
| `DATABASE_URL_UNPOOLED` | Neon integration или Neon Console | ✅ для DDL |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob integration | ✅ |
| `TELEGRAM_BOT_TOKEN` | @BotFather | optional |
| `TELEGRAM_CHAT_ID` | @getmyid_bot | optional |
| `BITRIX24_WEBHOOK_URL` | Bitrix24 admin | optional |
| `BITRIX24_FIELD_*` | Bitrix24 CRM fields | optional |
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | Яндекс Метрика | optional |

**Важно:** все переменные должны быть отмечены для **Production** + **Preview** environments. Иначе preview deploys будут падать.

### 2. Neon database готовность

- [ ] Postgres БД создана через Vercel Marketplace → Storage → Neon
- [ ] Региона: близкого к РФ (Frankfurt eu-central-1 рекомендуется)
- [ ] Размер БД ≥ 0.5 ГБ free tier (хватит на 200+ товаров)
- [ ] `DATABASE_URL_UNPOOLED` доступен (Neon Console → Connection Details → Direct connection)

### 3. Vercel Blob готовность

- [ ] Bucket создан через Vercel Marketplace → Storage → Blob
- [ ] `BLOB_READ_WRITE_TOKEN` авто-добавлен в env

### 4. Локальная проверка перед push

```bash
npm run cms:check    # все compute checks без БД должны быть зелёными
npm run lint         # 0 TypeScript errors
npm run test         # 7/7 calculator tests pass
npm run build        # next build проходит локально
```

### 5. Push в feat/payload-cms

```bash
git push origin feat/payload-cms
```

Vercel автоматически создаёт Preview Deployment. Должно произойти:

1. **Install:** `npm install` (или cache hit)
2. **Build:** `npm run vercel-build` → 6 шагов:
   - `cms:check` (env vars, files, importMap valid)
   - `cms:generate-importmap` (Linux: regenerates from config)
   - `cms:push-schema` (Linux: создаёт/обновляет таблицы Postgres)
   - `cms:check` второй раз (после generate)
   - `next build` (генерирует все статические + API роуты)
3. **Deploy:** Vercel переключает Preview URL на новую сборку

Если build упадёт на одном из шагов — deploy НЕ произойдёт, production не пострадает. Логи доступны в **Vercel Dashboard → Deployments → Build Logs**.

### 6. Smoke test после Preview deploy

Автоматическая недеструктивная проверка:

```bash
npm run cms:validate-deployment -- <Preview URL>
```

Если preview закрыт Vercel Deployment Protection и скрипт получает `401`, это не проверка CMS. Нужно открыть деплой через Vercel Dashboard/CLI и повторить smoke test вручную.

- [ ] `<Preview URL>/api/health` → `200 OK` с `"status": "ok"` + `cms.collections >= 6`
- [ ] `<Preview URL>/admin` → форма «Create First User» отрендерена (НЕ blank page)
- [ ] Создать первого админа → залогиниться → увидеть меню коллекций
- [ ] Загрузить тестовое изображение в `media` → открыть публичный URL Blob-файла
- [ ] Изменить безопасное поле в `contacts` или `home-content` → сохранить → обновить → значение осталось
- [ ] `<Preview URL>` (главная) → обычная домашняя страница работает (CMS не подключена к данным ещё)
- [ ] `<Preview URL>/catalog/auto-sheet-metal` → каталог отображается
- [ ] Тестовая заявка через форму → приходит в Telegram

### 7. Cutover в production (main branch)

Только после полного smoke test на preview:

```bash
git checkout main
git merge feat/payload-cms
git push origin main
```

Vercel задеплоит на production URL. Повторить smoke test на production.

```bash
npm run cms:validate-deployment -- https://kbparus-metal-storage.vercel.app --production
```

## Регулярные проверки в production

### После каждого деплоя

```bash
curl https://kbparus-metal-storage.vercel.app/api/health | jq
```

Должно быть:
```json
{ "status": "ok", "components": { "cms": { "ok": true, ... }, ... } }
```

### Раз в неделю (uptime check)

Настроить через Better Uptime / UptimeRobot / Cron-job.org:
- Pinging `/api/health` каждые 5 минут
- Alert если `status` ≠ `"ok"` или `cms.ok` ≠ `true`

## Disaster recovery

### `/admin` упал после деплоя

1. **Откатить deployment** (Vercel Dashboard → Deployments → промоут предыдущий рабочий → Promote to Production)
2. Откат занимает ~30 секунд
3. Затем диагностировать новый деплой по Build Logs

### Postgres недоступен

Neon free tier может уйти в idle (auto-suspend через 5 минут без запросов). Первый запрос после idle занимает ~1 секунду. Это нормально.

Если Postgres реально упал:
- Проверить status.neon.tech
- В Vercel Logs искать `ECONNREFUSED` / `ETIMEDOUT`
- В крайнем случае создать новый Neon БД и переключить `DATABASE_URL`

### Vercel Blob недоступен

- Картинки не отображаются на сайте
- Проверить status.vercel.com
- Файлы остаются в Blob — после восстановления сервиса всё снова работает

### Случайно удалили данные через админку

- Payload поддерживает versions/drafts для коллекций где включено
- Postgres backup от Neon (раз в день free tier)
- В крайнем случае: восстановить из git (TypeScript-исходники в `data/storageSystems/` остаются как fallback)

## Рекомендации в долгой перспективе

1. **Перейти с `push: true` на controlled migrations** через `payload migrate:create`. Делается когда:
   - Появятся реальные production-данные, которые нельзя терять при schema rebuild
   - Команда вырастет > 1 разработчика
2. **Сменить free Neon tier на paid** ($19/мес) когда:
   - БД > 0.5 ГБ
   - Нужен >1 концурентного коннекта без auto-suspend
3. **Добавить Sentry или другой error tracking** для admin route specifically
