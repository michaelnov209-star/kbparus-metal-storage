# Документация — КБ Парус «Системы хранения металла»

Индекс документации проекта. Если ты новый разработчик, AI-ассистент или менеджер — начни с релевантного handoff и переходи по ссылкам.

## С чего начать

| Вы | Читайте сначала |
|----|-----------------|
| Новый разработчик-человек | [`handoffs/developer-handoff.md`](handoffs/developer-handoff.md) |
| AI-агент / нейросеть-помощник | [`handoffs/claude-code-handoff.md`](handoffs/claude-code-handoff.md) → [`handoffs/developer-handoff.md`](handoffs/developer-handoff.md) |
| Продакт-менеджер / руководитель | [`reports/report-for-director.md`](reports/report-for-director.md) → [`planning/roadmap.md`](planning/roadmap.md) |
| Контент-менеджер / маркетолог | [`operations/content-collection-workflow.md`](operations/content-collection-workflow.md) → [`architecture/cms-admin-ux.md`](architecture/cms-admin-ux.md) |
| DevOps / SRE | [`operations/deployment-guide.md`](operations/deployment-guide.md) → [`operations/deployment-checklist.md`](operations/deployment-checklist.md) → [`operations/cms-setup.md`](operations/cms-setup.md) |

## Структура

```
docs/
├── README.md                       # этот файл
├── architecture/                   # как устроен проект и почему
│   ├── project-context.md          # бизнес-цели и стратегия
│   ├── site-processes.md           # операционные процессы сайта
│   ├── cms-admin-ux.md             # архитектура и UX админки Payload
│   └── cms-content-architecture.md # план перехода контента в CMS
│
├── audits/                         # независимые оценки состояния
│   ├── project-audit.md            # общий аудит проекта
│   ├── calculator-audit.md         # детальный аудит калькулятора
│   ├── customer-journey-audit.md   # путь клиента, точки потери конверсии
│   └── dependency-audit-2026-05-19.md # npm audit без force-fix
│
├── operations/                     # как эксплуатировать систему
│   ├── deployment-guide.md         # процесс деплоя
│   ├── deployment-checklist.md     # чек-лист перед релизом
│   ├── production-validation.md    # валидация после deploy
│   ├── admin-smoke.md              # авторизованный smoke-тест админки
│   ├── cms-setup.md                # настройка Payload с нуля
│   ├── telegram-bot.md             # настройка Telegram-уведомлений
│   ├── bitrix24-fields.md          # настройка полей Bitrix24 для заявок
│   └── content-collection-workflow.md # процесс сбора контента
│
├── planning/                       # что и в каком порядке делать
│   └── roadmap.md                  # приоритезированные спринты
│
├── handoffs/                       # передача проекта
│   ├── developer-handoff.md        # для нового разработчика (RU)
│   └── claude-code-handoff.md      # для AI-агента
│
└── reports/                        # отчёты руководству
    └── report-for-director.md      # отчёт для директора
```

## Внешние ссылки

- Production: https://kbparus-metal-storage.vercel.app
- Admin: https://kbparus-metal-storage.vercel.app/admin
- Health: https://kbparus-metal-storage.vercel.app/api/health
- Repository: https://github.com/michaelnov209-star/kbparus-metal-storage
- CHANGELOG: [`../CHANGELOG.md`](../CHANGELOG.md)

## Соглашения

- Все файлы — Markdown (GFM).
- Русский язык там, где документ обращён к команде; технические handoff-документы могут смешивать RU/EN, если этого требует контекст.
- Имена файлов — `lower-kebab-case.md`.
- Изменения важных решений архитектуры синхронизируются в `CHANGELOG.md`.
