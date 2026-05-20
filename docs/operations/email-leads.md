# Email delivery for leads

Дата: 2026-05-20

## Назначение

Email — основной внешний канал доставки заявок. Сайт отправляет письмо на `info@kbparus.ru`, а Bitrix24 может создавать лиды из входящей почты уже своими штатными правилами.

CMS-журнал `/admin/collections/leads` остается внутренней страховкой и историей заявок.

## Env для Vercel

```text
LEAD_EMAIL_TO=info@kbparus.ru
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

`SMTP_FROM` можно не задавать, тогда используется `SMTP_USER`.

## Что приходит в письме

- тип формы;
- имя, телефон, email, город;
- комментарий клиента;
- страница/товар/URL источника;
- UTM;
- параметры калькулятора;
- ориентировочная цена.

## Проверка

1. Добавить SMTP env в Vercel Production.
2. Redeploy.
3. Открыть `/api/health` и проверить `components.leadIntegrations.email.configured = true`.
4. Отправить тестовую заявку.
5. Проверить письмо на `info@kbparus.ru`.
6. Проверить, что запись появилась в `/admin/collections/leads`.

## Поведение при ошибках

- Если SMTP не настроен, заявка не падает: она сохраняется в CMS и может уйти в Telegram.
- Если SMTP вернул ошибку, она сохраняется в поле delivery errors в CMS.
- Bitrix24 webhook не нужен для этого сценария.
