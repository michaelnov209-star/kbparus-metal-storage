# Authenticated Admin Smoke

Цель: безопасно проверить залогиненную Payload-админку без создания пользователей, загрузок, удаления или изменения контента.

## Где безопасно задать credentials

Вариант 1, предпочтительно для разового запуска: temporary shell env. Значения живут только в текущем PowerShell-окне и не попадают в git.

```powershell
$env:CMS_ADMIN_EMAIL="..."
$env:CMS_ADMIN_PASSWORD="..."
$env:VERCEL_AUTOMATION_BYPASS_SECRET="..."
npm run cms:admin-smoke -- https://<preview-url>
Remove-Item Env:CMS_ADMIN_EMAIL,Env:CMS_ADMIN_PASSWORD,Env:VERCEL_AUTOMATION_BYPASS_SECRET -ErrorAction SilentlyContinue
```

Вариант 2: локальный `.env.local`. Файл уже находится в `.gitignore`; скрипт читает только нужные ключи и не печатает значения.

```env
CMS_ADMIN_EMAIL=...
CMS_ADMIN_PASSWORD=...
VERCEL_AUTOMATION_BYPASS_SECRET=...
```

## Запуск

```bash
CMS_ADMIN_EMAIL=... CMS_ADMIN_PASSWORD=... npm run cms:admin-smoke -- https://<preview-url>
```

Поддерживаемые alias-переменные:

- `CMS_ADMIN_EMAIL` / `CMS_ADMIN_PASSWORD`
- `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`
- `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`
- `PAYLOAD_ADMIN_EMAIL` / `PAYLOAD_ADMIN_PASSWORD`

Если Preview закрыт Vercel Deployment Protection, можно передать:

```bash
VERCEL_AUTOMATION_BYPASS_SECRET=...
```

Секреты нельзя коммитить или выводить в логи.

## Что проверяет скрипт

- login через `/api/users/login`;
- существующий admin auth через `/api/users/me`;
- `/admin` возвращает HTML;
- light theme активна;
- нет видимого runtime error в admin shell;
- доступны CMS routes:
  - `Администраторы и редакторы`;
  - `Медиа-библиотека`;
  - `Каталог: товары`;
  - `Главная страница`;
  - `Контакты`;
  - `Заявки и интеграции`;
- фиксируются примерные времена ответа;
- severe slowness флагируется при ответе дольше 15 секунд.

## Что скрипт не делает

- не создает admin users;
- не загружает media;
- не меняет globals;
- не удаляет данные;
- не выполняет destructive DB operations;
- не печатает credentials.

## Текущий safety вывод

Preview и Production используют одинаковые DB/storage/auth env. Поэтому auto-create admin, upload media и write persistence checks на Preview небезопасны до выделения отдельной Preview DB/storage или явного тестового поля с утвержденным процессом отката.
