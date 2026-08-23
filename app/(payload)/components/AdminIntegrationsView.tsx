import { Suspense } from "react";
import type { AdminViewServerProps, Payload } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { redirect } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  CircleMinus,
  Clock3,
  ExternalLink,
  MailCheck,
  MessageCircle,
  Settings2,
  Workflow
} from "lucide-react";

import { isSmtpConfigured, smtpSettingsFromEnv } from "@/lib/email/smtp-config";
import { getBitrix24RuntimeConfig } from "@/lib/leads/bitrix24-config";
import { getCachedAdminValue } from "@/lib/admin/server-cache";
import { canManageIntegrations } from "@/payload/access/rbac";
import { AdminAccessDenied } from "./AdminAccessDenied";
import { AdminIntentLink } from "./AdminIntentLink";
import { AdminRouteStylesheet } from "./AdminRouteStylesheet";
import { LazyIntegrationProbeButton } from "./LazyAdminActions";

type IntegrationState = "connected" | "configured" | "disabled" | "error";
type ProbeKind = "email" | "telegram";

type IntegrationCard = {
  actionHref: string;
  actionLabel: string;
  description: string;
  icon: typeof MailCheck;
  probeKind?: ProbeKind;
  state: IntegrationState;
  status: string;
  title: string;
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow"
  }).format(date);
}

async function readLatestDeliveries(payload: Payload) {
  return getCachedAdminValue("integration-delivery-summary", 30_000, async () => {
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
      console.warn(
        "[admin-integrations] Delivery history unavailable",
        error instanceof Error ? error.name : "UnknownError"
      );
      return { email: null, telegram: null };
    }
  });
}

function IntegrationCardView({ card }: { card: IntegrationCard }) {
  const StatusIcon = card.state === "connected"
    ? CheckCircle2
    : card.state === "configured"
      ? Clock3
      : CircleMinus;

  return (
    <article className="kb-integrations__card" data-state={card.state}>
      <div className="kb-integrations__card-top">
        <span className="kb-integrations__icon"><card.icon size={22} aria-hidden /></span>
        <span className="kb-integrations__state" role="status">
          <StatusIcon size={14} aria-hidden />
          {card.status}
        </span>
      </div>
      <h2>{card.title}</h2>
      <p>{card.description}</p>
      {card.probeKind ? (
        <LazyIntegrationProbeButton kind={card.probeKind} />
      ) : null}
      <AdminIntentLink href={card.actionHref}>
        {card.actionLabel}
        <ExternalLink size={14} aria-hidden />
      </AdminIntentLink>
    </article>
  );
}

async function IntegrationGrid({
  dataPromise,
  smtpConfigured,
  telegramConfigured
}: {
  dataPromise: ReturnType<typeof readLatestDeliveries>;
  smtpConfigured: boolean;
  telegramConfigured: boolean;
}) {
  const deliveries = await dataPromise;
  const bitrix = getBitrix24RuntimeConfig(process.env);
  const emailDeliveryDate = formatDate(deliveries.email);
  const telegramDeliveryDate = formatDate(deliveries.telegram);

  const cards: IntegrationCard[] = [
    {
      title: "Telegram",
      description: telegramDeliveryDate
        ? `Фактическая доставка заявки подтверждена ${telegramDeliveryDate}. Проверка ниже подтверждает токен и доступ бота к чату.`
        : telegramConfigured
          ? "Бот и чат настроены. Запустите безопасную проверку доступа — сообщение в чат отправляться не будет."
          : "Для уведомлений нужны токен Telegram-бота и ID рабочего чата.",
      icon: MessageCircle,
      state: deliveries.telegram ? "connected" : telegramConfigured ? "configured" : "disabled",
      status: deliveries.telegram ? "Доставка подтверждена" : telegramConfigured ? "Настроен" : "Не настроен",
      probeKind: telegramConfigured ? "telegram" : undefined,
      actionHref: "/admin/globals/lead-management",
      actionLabel: "Настройки форм"
    },
    {
      title: "Яндекс Почта",
      description: emailDeliveryDate
        ? `Фактическая доставка заявки подтверждена ${emailDeliveryDate}. Пароль в интерфейсе не показывается.`
        : smtpConfigured
          ? "SMTP заполнен. Соединение проверяется только по кнопке, поэтому открытие админки больше не ждёт ответа Яндекса."
          : "Параметры почтового подключения заполнены не полностью.",
      icon: MailCheck,
      state: deliveries.email ? "connected" : smtpConfigured ? "configured" : "disabled",
      status: deliveries.email ? "Доставка подтверждена" : smtpConfigured ? "Настроена" : "Не настроена",
      probeKind: smtpConfigured ? "email" : undefined,
      actionHref: "/admin/collections/leads",
      actionLabel: "Открыть заявки"
    },
    {
      title: "Яндекс Метрика",
      description: "Посещения, цели, конверсии и динамика доступны прямо в SEO-разделе админки.",
      icon: BarChart3,
      state: process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID ? "connected" : "disabled",
      status: process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID ? "Сбор данных включён" : "Не настроена",
      actionHref: "/admin/seo?view=goals&period=30&provider=yandex&device=all",
      actionLabel: "Открыть конверсии"
    },
    {
      title: "Bitrix24",
      description: bitrix.enabled
        ? "Передача заявок в CRM включена."
        : "Bitrix24 не используется в текущем рабочем процессе. Заявки сохраняются в админке и дублируются в Telegram и на почту.",
      icon: Workflow,
      state: bitrix.enabled ? "connected" : "disabled",
      status: bitrix.enabled ? "Передача включена" : "Не используется",
      actionHref: "/admin/globals/lead-management",
      actionLabel: "Рабочий процесс заявок"
    }
  ];

  return (
    <div className="kb-integrations__grid" data-tour="integrations-grid">
      {cards.map((card) => <IntegrationCardView card={card} key={card.title} />)}
    </div>
  );
}

function IntegrationGridSkeleton() {
  return (
    <div
      aria-label="Загрузка статусов интеграций"
      aria-live="polite"
      className="kb-integrations__grid"
      role="status"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div className="kb-integrations__card kb-integrations__card--skeleton" key={index}>
          <span className="kb-integrations__skeleton-line kb-integrations__skeleton-line--short" />
          <span className="kb-integrations__skeleton-line kb-integrations__skeleton-line--medium" />
          <span className="kb-integrations__skeleton-line" />
          <span className="kb-integrations__skeleton-line kb-integrations__skeleton-line--action" />
        </div>
      ))}
    </div>
  );
}

export async function AdminIntegrationsView({
  initPageResult,
  params,
  searchParams,
  user,
  viewType
}: AdminViewServerProps) {
  const authenticatedUser = user ?? initPageResult.req.user;
  if (!authenticatedUser) {
    redirect("/admin/login?redirect=%2Fadmin%2Fintegrations");
  }

  const hasIntegrationAccess = canManageIntegrations(authenticatedUser);
  const smtpConfigured = isSmtpConfigured(smtpSettingsFromEnv(process.env));
  const telegramConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

  const content = !hasIntegrationAccess ? (
    <AdminAccessDenied
      description="У этого аккаунта нет прав на просмотр служебных подключений."
      icon={CircleMinus}
      title="Интеграции доступны администратору"
    />
  ) : (
    <section className="kb-integrations" aria-label="Интеграции сайта">
      <header className="kb-integrations__hero" data-tour="integrations-hero">
        <div>
          <span className="kb-integrations__eyebrow"><Settings2 size={15} aria-hidden />Системный контур</span>
          <h1>Интеграции и доставка заявок</h1>
          <p>Страница открывается быстро: внешние сервисы не проверяются во время загрузки. Живые проверки запускаются вручную и не отправляют тестовые заявки.</p>
        </div>
        <AdminIntentLink className="kb-integrations__refresh" href="/admin/system">
          <CheckCircle2 size={16} aria-hidden />
          Здоровье сайта
        </AdminIntentLink>
      </header>

      <Suspense fallback={<IntegrationGridSkeleton />}>
        <IntegrationGrid
          dataPromise={readLatestDeliveries(initPageResult.req.payload)}
          smtpConfigured={smtpConfigured}
          telegramConfigured={telegramConfigured}
        />
      </Suspense>

      <div className="kb-integrations__note" data-tour="integrations-note">
        <CheckCircle2 size={17} aria-hidden />
        <span>Пароли и токены хранятся в закрытых переменных Vercel и никогда не показываются в админке. Галочка «доставка подтверждена» берётся из реально сохранённой заявки.</span>
      </div>
    </section>
  );

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
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
      <AdminRouteStylesheet name="system-center" />
      {content}
    </DefaultTemplate>
  );
}
