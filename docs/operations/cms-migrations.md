# Контролируемые миграции Payload CMS

## Безопасная модель

- Payload работает с `push: false`: обычные Production и Preview build не
  меняют схему БД.
- Миграции разрешены только в явно подтверждённом Vercel Production build.
- GitHub workflow `CMS schema audit — production` остаётся read-only и не
  содержит пути применения миграций.
- Runtime использует pooled URL, миграции — только direct URL.
- Каждая миграция должна быть идемпотентной или транзакционной, проверенной
  тестами и зарегистрированной в `migrations/index.ts`.

## Защита production release

`scripts/cms/conditional-production-migrate.mjs` применяет миграции только при
одновременном выполнении всех условий:

1. `RUN_PAYLOAD_MIGRATIONS=true`.
2. `VERCEL_ENV=production`.
3. `PAYLOAD_MIGRATION_CONFIRMATION=APPLY_PRODUCTION_MIGRATIONS`.
4. `PAYLOAD_MIGRATION_RELEASE` точно равен последней миграции из
   `migrations/index.ts`.
5. Доступен direct URL:
   `DATABASE_URL_UNPOOLED`, `DATABASE_POSTGRES_URL_NON_POOLING` или
   `POSTGRES_URL_NON_POOLING`.
6. Session advisory lock свободен; он удерживается до завершения всех
   миграций и исключает два параллельных Production apply.

Эти значения передаются только конкретному Production deployment через
`--build-env`. Хранить `RUN_PAYLOAD_MIGRATIONS=true` как постоянную переменную
проекта запрещено.

Пример контролируемого выпуска:

```bash
vercel --prod --yes \
  --build-env RUN_PAYLOAD_MIGRATIONS=true \
  --build-env PAYLOAD_MIGRATION_CONFIRMATION=APPLY_PRODUCTION_MIGRATIONS \
  --build-env PAYLOAD_MIGRATION_RELEASE=<latest-migration-name>
```

Если release-name устарел, окружение не Production или direct URL отсутствует,
build завершается до изменения БД.

## Однократный переход legacy schema

Старая production-схема была создана Payload development push и содержит
служебный marker `name=dev, batch=-1`. Стандартный Payload CLI в таком состоянии
показывает интерактивное предупреждение, непригодное для Production build.

`scripts/cms/reconcile-legacy-migration-marker.mjs` не принимает это
предупреждение автоматически. Вместо этого он:

- берёт transaction-level advisory lock;
- требует ровно один marker `dev/-1`;
- проверяет отсутствие конфликтующей baseline-записи;
- только при
  `PAYLOAD_LEGACY_BASELINE_CONFIRMATION=RECLASSIFY_REVIEWED_DEV_SCHEMA`
  переименовывает marker в DDL-free baseline
  `20260727_135515_legacy_baseline` с `batch=0`;
- не изменяет контентные таблицы;
- при любом отклонении делает `ROLLBACK` и останавливает release.

Подтверждение legacy-перехода передаётся только первому проверенному
Production deployment. После успешного перехода скрипт становится безопасным
идемпотентным no-op.

## Read-only аудит

GitHub workflow запускается только из `main`, после подтверждения
`AUDIT_PRODUCTION`, и выполняет:

```bash
npm run cms:migrate:audit
```

Скрипт использует `BEGIN READ ONLY`, читает `payload_migrations` и перечень
таблиц, затем выполняет `ROLLBACK`. Production credentials не передаются
остальным шагам workflow.

## Разработка миграций

После изменения Payload config:

```bash
npm run cms:migrate:create -- add_feature_name
```

Обязательно проверить `up`, `down`, JSON snapshot, lint, unit-тесты и
production build. Для удаления или переименования использовать
expand-contract: сначала добавить новую структуру и перенести данные, удаление
выпускать отдельно.

## Запрещено

- `migrate:fresh`, `migrate:reset`, `migrate:refresh` на Production.
- Миграции из Preview deployment или feature/PR workflow.
- Постоянные Vercel env-флаги, автоматически включающие миграции.
- Fallback на pooled Postgres URL для schema operations.
- Автоматический ответ `yes` на Payload data-loss prompt.
- Изменение неизвестного или неоднозначного legacy marker.
- Destructive migration без проверенного restore point и rehearsal.

## Откат

- Для приложения используется предыдущий подтверждённый Vercel deployment.
- Для схемы основной путь — forward-fix.
- `migrate:down` допустим только для заранее проверенной обратимой последней
  миграции.
- Baseline не откатывается.
- Для destructive-инцидента нужен проверенный Neon restore point или branch
  restore; откат приложения сам по себе не откатывает БД и Blob-файлы.
