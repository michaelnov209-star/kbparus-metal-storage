# Production validation — Payload CMS

Цель: безопасно проверить CMS перед cutover в production. Проверки не должны сбрасывать БД, удалять данные, делать force push или merge в `main` без отдельного подтверждения.

## Автоматическая проверка деплоя

Preview:

```bash
npm run cms:validate-deployment -- https://<preview-url>
```

Если preview защищён Vercel Deployment Protection и прямой запрос возвращает `401`, использовать Vercel Dashboard/CLI для просмотра защищённого деплоя. Production URL после cutover должен проходить прямую проверку без `401`.

Production:

```bash
npm run cms:validate-deployment -- https://kbparus-metal-storage.vercel.app --production
```

Скрипт проверяет:

- `/api/health`: `status: "ok"`, `cms.ok: true`;
- наличие коллекций `users`, `media`, `categories`, `subcategories`, `products`, `calculator-profiles`;
- наличие globals `contacts`, `home-content`;
- сигнал `BLOB_READ_WRITE_TOKEN` через health endpoint;
- `/admin/create-first-user` рендерится и не является blank page;
- `/api/users` не читается публично;
- главная и `/catalog/auto-sheet-metal` возвращают `200`.

Telegram и Bitrix24 считаются warning, потому что они могут быть не включены на CMS-preview.

## Ручная проверка перед production

- [ ] First admin: открыть `<preview-url>/admin/create-first-user`, создать первого администратора вручную. Не создавать администратора скриптом.
- [ ] Login/logout: войти в `/admin`, открыть меню пользователя, нажать logout, затем снова войти тем же администратором.
- [ ] Доступы: открыть `/api/users?limit=1` в приватном окне без cookies. Ожидаемо: нет публичного списка пользователей.
- [ ] Globals edit: в админке открыть `Globals` -> `contacts` или `home-content`, изменить безопасное тестовое текстовое поле, сохранить, обновить страницу, убедиться, что значение осталось.
- [ ] Globals revert: вернуть прежнее значение того же поля, сохранить, обновить страницу, убедиться, что откат сохранился.
- [ ] Uploads/blob storage: открыть `Media`, загрузить маленькое тестовое изображение, открыть публичный URL файла из записи media, убедиться, что файл отдаётся из Blob.
- [ ] Rebuild consistency: после успешных write-проверок сделать redeploy Preview без изменений, повторить `npm run cms:validate-deployment -- <preview-url>`, проверить, что globals и media остаются читаемыми.
- [ ] Env vars: в Vercel для Preview и Production есть `PAYLOAD_SECRET`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED` или `POSTGRES_URL_NON_POOLING`, `BLOB_READ_WRITE_TOKEN`.

## Что не проверять этим этапом

- Не запускать reset/drop/truncate.
- Не пересоздавать БД.
- Не делать production cutover через merge в `main` без подтверждения.
- Не считать отсутствие Bitrix24 blocker до этапа интеграции.

## Критерий готовности к CMS architecture

- Автоматическая проверка preview зелёная.
- Admin auth подтверждён вручную.
- Globals переживают redeploy.
- Upload в `media` реально создаёт файл в Blob.
- Production env parity подтверждена.
