# Контролируемые миграции Payload CMS

## Текущее безопасное состояние

- Payload работает с `push: false`: Vercel build не меняет схему БД.
- В репозитории есть DDL-free baseline
  `20260727_135515_legacy_baseline` и JSON-снимок схемы.
- Production baseline пока не подтверждён: не завершены сверка физической схемы,
  проверка `payload_migrations` и тест восстановления Neon.
- GitHub workflow `CMS schema audit — production` работает только из `main` и
  выполняет только read-only аудит. Пути применения миграций в нём нет.
- Production-миграции остаются заблокированными до отдельного подтверждённого
  этапа принятия baseline.

## Direct connection без fallback

Runtime использует pooled URL. Любая Payload-команда миграций с
`PAYLOAD_MIGRATING=true` обязана получить один из direct URL:

1. `DATABASE_URL_UNPOOLED`
2. `DATABASE_POSTGRES_URL_NON_POOLING`
3. `POSTGRES_URL_NON_POOLING`

Если direct URL отсутствует, команда завершается до подключения к БД. Fallback
на `DATABASE_URL`, `DATABASE_POSTGRES_URL` или `POSTGRES_URL` для миграций
запрещён.

## Разрешённый production-аудит

1. Запускать GitHub workflow только из ветки `main`.
2. Ввести подтверждение `AUDIT_PRODUCTION`.
3. Пройти approval защищённого GitHub environment `production`.
4. Workflow установит `DATABASE_URL_UNPOOLED` только для шага read-only аудита и
   выполнит:

   ```bash
   npm run cms:migrate:audit
   ```

Скрипт открывает транзакцию `BEGIN READ ONLY`, читает историю миграций и список
таблиц, затем выполняет `ROLLBACK`. `npm ci` и остальные шаги не получают
production credentials.

## Что нужно подтвердить до разблокировки apply

Отдельный production apply workflow можно проектировать только после выполнения
всех условий:

1. Создан Neon branch или restore point, восстановление реально проверено.
2. Read-only аудит показал ожидаемую единственную legacy-запись и не выявил
   неизвестных миграций.
3. Физические таблицы и критичные поля сверены с
   `migrations/20260727_135515_legacy_baseline.json`.
4. Принятие baseline оформлено отдельным изменением, проверено повторным
   read-only аудитом и зафиксировано в change log.
5. Миграция протестирована на отдельной Neon branch вместе с lint, unit, build,
   E2E и smoke.
6. Для будущего apply создан отдельный manual workflow: только `main`,
   защищённый environment с обязательным reviewer, concurrency lock и secrets
   только на шаге миграции.

До выполнения этого списка нельзя добавлять `cms:migrate:apply` в текущий
production workflow или запускать его против production вручную.

## Разработка миграций вне production

После изменения Payload config:

```bash
npm run cms:migrate:create -- add_feature_name
```

Проверить `up`, `down` и JSON snapshot. Для удаления или переименования
использовать expand-contract: добавить новую структуру, перенести и проверить
данные, а удаление выпустить отдельным релизом. Применение и status допустимы
только на явно выбранной non-production Neon branch с direct URL.

## Запрещено

- `migrate:fresh`, `migrate:reset`, `migrate:refresh` на production.
- Любые миграции из Vercel build, Preview deploy или feature/PR workflow.
- Fallback на pooled Postgres URL для schema operations.
- Принятие baseline без read-only аудита и проверенного восстановления.
- Добавление production apply до отдельного security review и подтверждения
  baseline.

## Rollback

- Основной способ после будущего разблокирования миграций — forward-fix.
- `migrate:down` допустим только для заранее проверенной обратимой последней
  миграции.
- Baseline не откатывается.
- Для destructive-инцидента используется проверенный Neon restore point или
  branch restore.
- Blob-файлы и внешние интеграции не входят в транзакцию DDL и проверяются
  отдельно.
