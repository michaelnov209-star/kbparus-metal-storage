import type { AdminViewServerProps, Payload } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Link } from "@payloadcms/ui/elements/Link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Cloud,
  Database,
  FileClock,
  Gauge,
  HardDrive,
  MailCheck,
  MessageCircle,
  SearchCheck,
  ServerCog,
  ShieldCheck,
  TriangleAlert
} from "lucide-react";

import { getBitrix24RuntimeConfig } from "@/lib/leads/bitrix24-config";
import { isSmtpConfigured, smtpSettingsFromEnv } from "@/lib/email/smtp-config";
import { getCmsRole } from "@/payload/access/rbac";
import { CalculatorProfileSyncButton } from "./CalculatorProfileSyncButton";

type HealthState = "healthy" | "configured" | "disabled" | "attention";

type HealthItem = {
  description: string;
  href?: string;
  icon: typeof Activity;
  label: string;
  state: HealthState;
  status: string;
};

type HistoryItem = {
  date: string;
  entity: string;
  href: string;
  id: string;
  state: "draft" | "published";
  title: string;
};

type VersionLike = {
  createdAt?: string;
  id?: string;
  parent?: number | string;
  updatedAt?: string;
  version?: {
    _status?: string;
    shortTitle?: string;
    slug?: string;
    title?: string;
  };
};

const historyCollections = [
  { slug: "products", entity: "Товар" },
  { slug: "categories", entity: "Раздел каталога" },
  { slug: "subcategories", entity: "Подраздел" },
  { slug: "calculator-profiles", entity: "Профиль калькулятора" }
] as const;

function formatDate(value?: string | null) {
  if (!value) return "Нет данных";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Нет данных";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow"
  }).format(date);
}

async function readVersionHistory(payload: Payload): Promise<HistoryItem[]> {
  const groups = await Promise.all(
    historyCollections.map(async ({ slug, entity }) => {
      try {
        const response = await payload.findVersions({
          collection: slug,
          depth: 0,
          limit: 5,
          overrideAccess: true,
          pagination: false,
          sort: "-updatedAt"
        });

        return (response.docs as unknown as VersionLike[]).map((item) => {
          const version = item.version ?? {};
          const parent = String(item.parent ?? "");
          return {
            id: `${slug}-${String(item.id ?? parent)}-${String(item.updatedAt ?? item.createdAt ?? "")}`,
            entity,
            title: version.shortTitle || version.title || version.slug || `${entity} #${parent}`,
            date: item.updatedAt || item.createdAt || new Date(0).toISOString(),
            href: parent ? `/admin/collections/${slug}/${parent}` : `/admin/collections/${slug}`,
            state: version._status === "draft" ? "draft" : "published"
          } satisfies HistoryItem;
        });
      } catch (error) {
        console.warn(`[admin-system] Version history unavailable for ${slug}`, error instanceof Error ? error.name : "UnknownError");
        return [];
      }
    })
  );

  return groups
    .flat()
    .sort((left, right) => Date.parse(right.date) - Date.parse(left.date))
    .slice(0, 14);
}

async function readLeadDelivery(payload: Payload) {
  try {
    const response = await payload.find({
      collection: "leads",
      depth: 0,
      limit: 30,
      overrideAccess: true,
      pagination: false,
      select: {
        createdAt: true,
        emailDelivered: true,
        telegramDelivered: true
      },
      sort: "-createdAt"
    });

    return {
      email: response.docs.find((lead) => lead.emailDelivered)?.createdAt ?? null,
      telegram: response.docs.find((lead) => lead.telegramDelivered)?.createdAt ?? null
    };
  } catch (error) {
    console.warn("[admin-system] Lead delivery history unavailable", error instanceof Error ? error.name : "UnknownError");
    return { email: null, telegram: null };
  }
}

function HealthCard({ item }: { item: HealthItem }) {
  const Icon = item.icon;
  const StatusIcon = item.state === "healthy"
    ? CheckCircle2
    : item.state === "attention"
      ? TriangleAlert
      : item.state === "configured"
        ? Clock3
        : CircleAlert;

  const card = (
    <article className="kb-system__health-card" data-state={item.state}>
      <div className="kb-system__health-card-top">
        <span className="kb-system__health-icon"><Icon size={20} aria-hidden /></span>
        <span className="kb-system__health-state"><StatusIcon size={14} aria-hidden />{item.status}</span>
      </div>
      <h3>{item.label}</h3>
      <p>{item.description}</p>
      {item.href ? <span className="kb-system__health-link">Открыть <ArrowRight size={14} aria-hidden /></span> : null}
    </article>
  );

  return item.href ? <Link href={item.href}>{card}</Link> : card;
}

export async function AdminSystemView({
  initPageResult,
  params,
  searchParams,
  user,
  viewType
}: AdminViewServerProps) {
  const authenticatedUser = user ?? initPageResult.req.user;
  const isAdmin = getCmsRole(authenticatedUser) === "admin";
  const payload = initPageResult.req.payload;

  let history: HistoryItem[] = [];
  let profileCount = 0;
  let leadDelivery: { email: string | null; telegram: string | null } = { email: null, telegram: null };

  if (isAdmin) {
    const [historyResult, profileResult, deliveryResult] = await Promise.all([
      readVersionHistory(payload),
      payload.count({ collection: "calculator-profiles", overrideAccess: true }).catch(() => ({ totalDocs: 0 })),
      readLeadDelivery(payload)
    ]);
    history = historyResult;
    profileCount = profileResult.totalDocs;
    leadDelivery = deliveryResult;
  }

  const smtpConfigured = isSmtpConfigured(smtpSettingsFromEnv(process.env));
  const telegramConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  const storageConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const metrikaConfigured = Boolean(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID);
  const bitrix = getBitrix24RuntimeConfig(process.env);

  const healthItems: HealthItem[] = [
    {
      label: "Сайт и CMS",
      description: "Админка открыта, авторизация и база данных ответили на текущий запрос.",
      status: "Работает",
      state: "healthy",
      icon: ServerCog
    },
    {
      label: "Медиа-хранилище",
      description: storageConfigured ? "Vercel Blob подключён для изображений, видео и документов." : "Не найдено подключение к файловому хранилищу.",
      status: storageConfigured ? "Подключено" : "Нужно внимание",
      state: storageConfigured ? "healthy" : "attention",
      icon: HardDrive,
      href: "/admin/collections/media"
    },
    {
      label: "Telegram",
      description: leadDelivery.telegram
        ? `Последняя подтверждённая доставка заявки: ${formatDate(leadDelivery.telegram)}.`
        : telegramConfigured
          ? "Бот и чат настроены. Живую проверку можно запустить в разделе интеграций."
          : "Токен бота или чат не настроены.",
      status: leadDelivery.telegram ? "Доставка подтверждена" : telegramConfigured ? "Настроен" : "Не настроен",
      state: leadDelivery.telegram ? "healthy" : telegramConfigured ? "configured" : "disabled",
      icon: MessageCircle,
      href: "/admin/integrations"
    },
    {
      label: "Яндекс Почта",
      description: leadDelivery.email
        ? `Последняя подтверждённая доставка заявки: ${formatDate(leadDelivery.email)}.`
        : smtpConfigured
          ? "SMTP настроен. Проверка соединения запускается вручную без задержки админки."
          : "Почтовое подключение не заполнено.",
      status: leadDelivery.email ? "Доставка подтверждена" : smtpConfigured ? "Настроена" : "Не настроена",
      state: leadDelivery.email ? "healthy" : smtpConfigured ? "configured" : "disabled",
      icon: MailCheck,
      href: "/admin/integrations"
    },
    {
      label: "Яндекс Метрика",
      description: metrikaConfigured ? "Счётчик, цели и отчёты доступны в SEO-разделе." : "Идентификатор счётчика не настроен.",
      status: metrikaConfigured ? "Сбор включён" : "Не настроена",
      state: metrikaConfigured ? "healthy" : "disabled",
      icon: SearchCheck,
      href: "/admin/seo?view=conversions&period=30&provider=yandex&device=all"
    },
    {
      label: "Bitrix24",
      description: bitrix.enabled
        ? "Передача заявок в CRM включена."
        : bitrix.webhookUrlConfigured
          ? "Webhook сохранён, но автоматическая передача отключена."
          : "Интеграция подготовлена к будущему подключению.",
      status: bitrix.enabled ? "Работает" : bitrix.webhookUrlConfigured ? "Готов к включению" : "Не подключён",
      state: bitrix.enabled ? "healthy" : bitrix.webhookUrlConfigured ? "configured" : "disabled",
      icon: Cloud,
      href: "/admin/integrations"
    }
  ];

  const healthyCount = healthItems.filter((item) => item.state === "healthy").length;
  const attentionCount = healthItems.filter((item) => item.state === "attention").length;
  const deploySha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "локальная сборка";

  const content = !isAdmin ? (
    <section className="kb-system kb-system--denied">
      <ShieldCheck size={26} aria-hidden />
      <h1>Системный контроль доступен администратору</h1>
      <p>У этого аккаунта нет прав на статусы сервисов и историю изменений.</p>
    </section>
  ) : (
    <section className="kb-system" aria-label="Здоровье сайта и история изменений">
      <header className="kb-system__hero">
        <div>
          <span className="kb-system__eyebrow"><Gauge size={15} aria-hidden />Системный контроль</span>
          <h1>Здоровье сайта и история изменений</h1>
          <p>Быстрый снимок ключевых сервисов, доставок заявок, профилей калькулятора и последних правок контента.</p>
        </div>
        <div className="kb-system__score" data-state={attentionCount ? "attention" : "healthy"}>
          <strong>{healthyCount}/{healthItems.length}</strong>
          <span>{attentionCount ? "Есть критичный сигнал" : "Критичных сбоев нет"}</span>
          <small>Сборка {deploySha}</small>
        </div>
      </header>

      <section className="kb-system__section">
        <div className="kb-system__section-head">
          <div><span>Текущий снимок</span><h2>Ключевые системы</h2></div>
          <Activity size={20} aria-hidden />
        </div>
        <div className="kb-system__health-grid">
          {healthItems.map((item) => <HealthCard item={item} key={item.label} />)}
        </div>
      </section>

      <div className="kb-system__columns">
        <section className="kb-system__section kb-system__history">
          <div className="kb-system__section-head">
            <div><span>История CMS</span><h2>Последние изменения</h2></div>
            <FileClock size={20} aria-hidden />
          </div>
          {history.length ? (
            <div className="kb-system__timeline">
              {history.map((item) => (
                <Link href={item.href} className="kb-system__timeline-row" key={item.id}>
                  <span className="kb-system__timeline-dot" data-state={item.state} />
                  <div><strong>{item.title}</strong><small>{item.entity}</small></div>
                  <div className="kb-system__timeline-meta">
                    <span data-state={item.state}>{item.state === "draft" ? "Черновик" : "Опубликовано"}</span>
                    <time>{formatDate(item.date)}</time>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="kb-system__empty"><Clock3 size={20} aria-hidden /><p>История появится после сохранения товаров, разделов или профилей калькулятора.</p></div>
          )}
        </section>

        <aside className="kb-system__section kb-system__calculator">
          <div className="kb-system__section-head">
            <div><span>Контроль расчётов</span><h2>Профили калькулятора</h2></div>
            <Database size={20} aria-hidden />
          </div>
          <div className="kb-system__calculator-count">
            <strong>{profileCount}/6</strong>
            <span>базовых профилей установлено</span>
          </div>
          <p>Синхронизация добавляет только отсутствующие профили из проверенной модели Excel. Уже сохранённые правки не перезаписываются.</p>
          <CalculatorProfileSyncButton existingCount={profileCount} />
          <Link className="kb-system__secondary-link" href="/admin/collections/calculator-profiles">
            Открыть настройки расчётов <ArrowRight size={14} aria-hidden />
          </Link>
          <div className="kb-system__warning">
            <CircleAlert size={16} aria-hidden />
            <span>Цены предварительные. Инженерная проверка перед коммерческим предложением обязательна.</span>
          </div>
        </aside>
      </div>
    </section>
  );

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={payload}
      permissions={initPageResult.permissions}
      req={initPageResult.req}
      searchParams={searchParams}
      user={authenticatedUser || undefined}
      viewType={viewType}
      visibleEntities={{
        collections: initPageResult.visibleEntities?.collections,
        globals: initPageResult.visibleEntities?.globals
      }}
    >
      {content}
    </DefaultTemplate>
  );
}