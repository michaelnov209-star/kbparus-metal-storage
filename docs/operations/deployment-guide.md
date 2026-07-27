# Публикация КБ Парус

Production: <https://kbparus-metal-storage.vercel.app>

## Требования

- Node.js 22;
- npm с актуальным `package-lock.json`;
- доступ к GitHub и Vercel-проекту `kbparus-metal-storage`;
- production-переменные из `.env.example`.

Обязательный минимум для production:

- `NEXT_PUBLIC_SITE_URL`;
- `PAYLOAD_SECRET` длиной не менее 32 символов;
- pooled `DATABASE_URL`;
- `BLOB_READ_WRITE_TOKEN`.

Для read-only аудита схемы отдельно требуется `DATABASE_URL_UNPOOLED`.
SMTP, Telegram, Bitrix24 и Upstash подключаются независимо. Заявка считается
принятой только после успешной доставки хотя бы в один реальный канал.

## Локальная проверка

```bash
npm ci
npm run lint
npm test
npm run build
node e2e/run.mjs
npm audit --omit=dev --audit-level=high
```

Ожидаемый результат: TypeScript, unit, production build и весь E2E-набор
завершаются без ошибок. E2E сам выбирает свободный локальный порт и не
подключается к случайно оставшемуся процессу.

## Build pipeline

Vercel запускает:

```text
images:optimize
→ cms:check
→ cms:generate-importmap
→ cms:check
→ next build
```

Build не меняет production-БД: в Payload установлено `push: false`.
Миграции не входят ни в preview, ни в production deploy.

## Безопасная публикация

1. Зафиксировать и отправить проверенный commit.
2. Создать Preview deployment.
3. Проверить точный Preview URL командой:

   ```bash
   npm run smoke:deployment -- https://<preview-url>
   ```

4. Проверить главную, категорию, товар, меню, калькулятор и форму на
   390, 768 и 1280 px.
5. Опубликовать тот же проверенный commit в Production.
6. Выполнить:

   ```bash
   npm run smoke:production
   ```

Smoke выполняет только безопасные `GET`/`HEAD`: health, sitemap, публичные
страницы, hero-видео и оптимизированные изображения. Он не создаёт заявки и
не меняет CMS.

## После публикации

- `/api/health` возвращает `status: ok`;
- все URL из `/sitemap.xml` отвечают `200`;
- mobile и desktop hero-video доступны;
- хешированные изображения и mobile-video имеют годовой immutable cache;
- `/api/users` и lead-management не открыты публично;
- в браузере нет ошибок консоли и горизонтального скролла;
- форма показывает успех только после ответа реального канала доставки.

Реальную тестовую заявку отправлять только в согласованное окно, с пометкой
`ТЕСТ` и уведомлением ответственного менеджера.

## Миграции CMS

Production migration apply сейчас намеренно заблокирован. Доступен только
read-only workflow `CMS schema audit — production` из ветки `main`.

Порядок разблокировки, требования к Neon restore point и baseline описаны в
[`cms-migrations.md`](cms-migrations.md).

## Откат

При ошибке приложения вернуть предыдущий подтверждённый Vercel deployment.
Откат приложения не откатывает базу и Blob-файлы. Изменения схемы после
будущей разблокировки миграций выполняются через forward-fix либо проверенный
Neon restore point.
