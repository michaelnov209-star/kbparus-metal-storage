# Аудит безопасности и репозитория — 24 августа 2026

## Итог

Проверены зависимости, секреты в отслеживаемых файлах, публичные и
административные API, Payload RBAC, загрузка медиа, CI/CD и конфигурация
Vercel. Критических уязвимостей в коде проекта не обнаружено. Подтверждённые
проблемы устранены без ослабления проверок и без изменений production-БД.

## Исправлено

- Payload и все `@payloadcms/*` пакеты синхронно обновлены с `3.86.0` до
  `3.88.0`: закрыты 14 high-уязвимостей из прежнего дерева зависимостей.
- Транзитивные `dompurify` и `nanoid` закреплены на исправленных версиях.
- `esbuild` закреплён на совместимой версии, чтобы npm не создавал некорректное
  дерево peer-зависимостей для Vitest/Vite и Drizzle.
- GitHub Actions теперь читает Node-версию из `.nvmrc`; локальная среда,
  CI и Vercel используют единый Node 24.x.
- Кэш-заголовки перенесены в `next.config.mjs`; дублирующий набор удалён из
  `vercel.json`.
- HTML из заявок дополнительно экранируется перед отправкой в Telegram.
- Добавлены Dependabot, `.editorconfig`, `.gitattributes`, `SECURITY.md` и
  единые команды качества/аудита.

## Подтверждённые защитные механизмы

- Payload использует fail-closed RBAC; неактивный пользователь не получает
  роль даже при валидной cookie.
- Кастомные административные мутации требуют Payload-сессию, допустимую роль
  и same-origin проверку.
- Авторизация блокируется после пяти неудачных попыток; минимальная длина
  нового пароля — 12 символов; cookies — `Secure` и `SameSite=Lax`.
- Публичная форма ограничена 32 КБ, принимает только известные поля, проверяет
  телефон, согласие, origin, honeypot и время заполнения.
- Rate limit использует PostgreSQL или Redis и в production закрывает форму,
  если ожидаемый долговременный backend недоступен.
- Bitrix24 webhook допускает только HTTPS и ожидаемый REST-метод; localhost,
  IP-адреса и посторонние методы блокируются.
- Загрузка медиа ограничена разрешёнными MIME, 64 МБ и 40 млн пикселей;
  публичное хранилище явно помечено как непригодное для конфиденциальных файлов.
- CSP, HSTS, frame protection, MIME sniffing protection, Referrer Policy и
  Permissions Policy задаются централизованно.
- В текущих отслеживаемых файлах не найдены реальные ключи, токены, пароли,
  приватные ключи или строки webhook.

## Контроль зависимостей

Пять npm-предупреждений оказались одним advisory в цепочке
`@payloadcms/db-postgres -> drizzle-kit -> @esbuild-kit -> esbuild 0.18.20`.
Уязвимость относится к dev-server esbuild, который проект не запускает, но
предупреждение устранено без ослабления аудита: вложенная копия закреплена на
безопасной версии `0.25.12`. Совместимость используемых `transform` и
`transformSync` проверяется отдельным security contract. Vercel и CI теперь
блокируют любые уязвимости уровня moderate и выше.

Вне репозитория нужно проверить:

- включены ли 2FA и branch protection в GitHub;
- ограничен ли доступ участников к Vercel, Neon, Blob и Telegram-боту;
- настроены ли резервные копии PostgreSQL и периодическая ротация секретов;
- включён ли distributed rate limit, если нагрузка превысит возможности
PostgreSQL-счётчика.

## Проверки

Успешно выполнены:

- `npm ci --include=optional` и `npm ls`;
- `npm run cms:generate-importmap` и `npm run cms:generate-types`;
- `npm run lint`, `npm run test`, `npm run build`;
- `npm run test:e2e`: 33 сценария на mobile, tablet и desktop;
- `npm run perf:admin-bundle`;
- `npm run security:audit`: 0 moderate, 0 high, 0 critical и успешный
  контракт `@esbuild-kit/core-utils` с `esbuild 0.25.12`;
- сканирование отслеживаемых Git-файлов на токены, приватные ключи,
  пароли и webhook URL.

E2E-проверки покрывают главную, каталог, категории, товары, два типа
конфигураторов, формы, адаптивную навигацию, страницу входа, WCAG 2.1 AA и
визуальную регрессию. Запросы авторизации и заявок изолированы от реальных
production-сервисов.

## Проверка production

На `https://kbparus-metal-storage.vercel.app` подтверждено:

- deployment имеет статус `READY` и постоянный production alias;
- `/api/health` возвращает `status=ok`, CMS и обязательные globals читаются;
- Blob, Telegram, email и Bitrix24 распознаны как настроенные;
- все 51 URL из sitemap возвращают HTTP 200;
- hero-видео, poster, изображения категории и товара доступны и получают
  годовой immutable cache;
- закрытые users/leads API не читаются без авторизации;
- cross-origin POST на `/api/leads` отклоняется с HTTP 403;
- CSP, HSTS, frame protection, MIME protection, Referrer Policy и
  Permissions Policy присутствуют в ответе главной.

## Релизный минимум

```bash
npm ci
npm run security:audit
npm run quality
npm run test:e2e
npm run cms:generate-importmap
```

После deployment: проверить `/api/health`, `/admin`, заголовки главной и
отклонение некорректного запроса `/api/leads` без создания реальной заявки.
