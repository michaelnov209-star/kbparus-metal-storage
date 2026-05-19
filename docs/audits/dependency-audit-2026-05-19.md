# Dependency audit

Дата: 2026-05-19  
Команда: `npm audit --audit-level=moderate --json`  
Итог: 19 moderate, 0 high, 0 critical.

## Краткий вывод

`npm audit fix --force` не применять. Текущие предложения npm ведут к небезопасным для проекта откатам major/minor-цепочек (`next` до `9.3.3`, Payload-пакеты до `3.82.1`), что может сломать Next 16 / Payload 3.84 и CMS pipeline.

Безопасный путь: отдельный dependency sprint, проверка patch/minor-релизов Next, Payload CMS, `monaco-editor`, `ws`, затем полный `npm run lint`, `npm run test`, `npm run build`, CMS smoke и production validation.

## Найдено

| Пакет | Severity | Откуда приходит | Суть | Безопасный путь |
|---|---:|---|---|---|
| `postcss <8.5.10` | moderate | `next` | XSS в CSS stringify | Ждать/проверить Next patch, не откатывать Next |
| `dompurify <=3.3.3` | moderate | `monaco-editor` через Payload UI | XSS / bypass sanitization | Обновлять через совместимый Payload/Monaco release |
| `uuid >=11.0.0 <11.1.1` | moderate | Payload packages | bounds check issue для v3/v5/v6 с `buf` | Обновлять Payload stack, не патчить вручную |
| `esbuild <=0.24.2` | moderate | `@esbuild-kit/core-utils` -> `drizzle-kit` -> Payload DB | dev-server exposure | Обновлять через Payload/Drizzle chain |
| `ws >=8.0.0 <8.20.1` | moderate | transitive | memory disclosure | Проверить transitive owner и lockfile update |

## Затронутые цепочки

- `@payloadcms/db-postgres`
- `@payloadcms/drizzle`
- `@payloadcms/next`
- `@payloadcms/richtext-lexical`
- `@payloadcms/storage-vercel-blob`
- `payload`
- `next`
- `monaco-editor`
- `drizzle-kit`
- `ws`

## Решение

Сейчас не менять зависимости в рамках задачи Bitrix24 / Метрика / legal block. Уязвимости moderate, прямого production exploit в текущем пользовательском flow не подтверждено, но CMS/admin stack затронут и должен быть вынесен в отдельную задачу.

## Следующий безопасный этап

1. Проверить свежие совместимые версии `next`, `payload`, `@payloadcms/*`.
2. Обновлять только semver-compatible path без `--force`.
3. Сравнить `package-lock.json` на предмет откатов.
4. Прогнать:
   - `npm run lint`
   - `npm run test`
   - `npm run build`
   - `npm run cms:validate-deployment`
5. Проверить `/admin`, `/api/health`, `/api/leads`, медиа из Vercel Blob.
