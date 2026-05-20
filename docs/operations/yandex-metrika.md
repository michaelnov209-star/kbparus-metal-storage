# Yandex Metrika

Дата: 2026-05-20

## Env

`NEXT_PUBLIC_YANDEX_METRIKA_ID` — ID счетчика. Если переменная пустая, скрипт Метрики и цели не выполняются, пользовательские сценарии не ломаются.

После добавления переменной в Vercel нужен redeploy: значение встраивается в client bundle.

## Цели

| Goal | Когда отправляется |
|---|---|
| `form_submit` | Попытка отправить форму |
| `lead_submit_success` | Успешная отправка заявки |
| `calculator_start` | Первое взаимодействие с калькулятором |
| `calculator_parameter_change` | Изменение ключевого параметра калькулятора |
| `calculator_step_change` | Переход между шагами калькулятора |
| `phone_click` | Клик по телефону |
| `email_click` | Клик по email |
| `messenger_click` | Клик по Telegram/WhatsApp/MAX |
| `scroll_depth` | Достижение 50% и 100% страницы |

## Проверка

1. Задать `NEXT_PUBLIC_YANDEX_METRIKA_ID` в Vercel Production.
2. Redeploy.
3. Открыть `/api/health` и проверить `components.analytics.yandexMetrika.configured = true`.
4. В режиме отладки Метрики проверить цели на главной странице и в калькуляторе.

## Ограничения

- События намеренно не блокируют UI и заявки.
- Без ID счетчика все вызовы `trackYandexGoal` становятся no-op.
- Для Bitrix24/CRM-аналитики UTM передаются отдельно в `/api/leads`.
