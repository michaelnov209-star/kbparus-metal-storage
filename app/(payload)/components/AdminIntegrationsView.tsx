import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Link } from "@payloadcms/ui/elements/Link";
import { Suspense } from "react";
import {
  BarChart3,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  MailCheck,
  MessageCircle,
  RefreshCw,
  Settings2,
  Workflow
} from "lucide-react";

import {
  getSmtpTransport,
  isSmtpConfigured,
  smtpSettingsFromEnv
} from "@/lib/email/smtp";
import { normalizeSmtpFailure, smtpErrorLogDetails } from "@/lib/email/smtp-error";
import { getBitrix24RuntimeConfig } from "@/lib/leads/bitrix24-config";
import { getCmsRole } from "@/payload/access/rbac";

type IntegrationState = "connected" | "configured" | "disabled" | "error";

type IntegrationCard = {
  actionHref: string;
  actionLabel: string;
  description: string;
  icon: typeof MailCheck;
  state: IntegrationState;
  status: string;
  title: string;
};

async function readEmailState(): Promise<Pick<IntegrationCard, "state" | "status">> {
  const settings = smtpSettingsFromEnv(process.env);
  if (!isSmtpConfigured(settings)) {
    return { state: "disabled", status: "Не настроена" };
  }

  try {
    await getSmtpTransport(settings).verify();
    return { state: "connected", status: "Соединение подтверждено" };
  } catch (error) {
    console.error("[admin-integrations] SMTP verification failed", smtpErrorLogDetails(error));
    const code = normalizeSmtpFailure(error);
    return {
      state: "error",
      status:
        code === "smtp-auth-failed"
          ? "Яндекс ещё не принял пароль приложения"
          : "Нет соединения с почтовым сервером"
    };
  }
}

function getEmailCard(
  emailState: Pick<IntegrationCard, "state" | "status">
): IntegrationCard {
  return {
    title: "Яндекс Почта",
    description: "Заявки с сайта приходят на info@kbparus.ru через защищённый SMTP.",
    icon: MailCheck,
    state: emailState.state,
    status: emailState.status,
    actionHref: "/admin/collections/leads",
    actionLabel: "Открыть заявки"
  };
}

function IntegrationCardView({ card }: { card: IntegrationCard }) {
  return (
    <article className="kb-integrations__card" data-state={card.state}>
      <div className="kb-integrations__card-top">
        <span className="kb-integrations__icon">
          <card.icon size={22} aria-hidden />
        </span>
        <span className="kb-integrations__state">
          {card.state === "connected" ? (
            <CheckCircle2 size={14} aria-hidden />
          ) : (
            <CircleAlert size={14} aria-hidden />
          )}
          {card.status}
        </span>
      </div>
      <h2>{card.title}</h2>
      <p>{card.description}</p>
      <Link href={card.actionHref}>
        {card.actionLabel}
        <ExternalLink size={14} aria-hidden />
      </Link>
    </article>
  );
}

async function EmailIntegrationCard() {
  return <IntegrationCardView card={getEmailCard(await readEmailState())} />;
}

function EmailIntegrationCardLoading() {
  return (
    <IntegrationCardView
      card={getEmailCard({
        state: "configured",
        status: "Проверяем соединение…"
      })}
    />
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
  const isAdmin = getCmsRole(authenticatedUser) === "admin";
  const bitrix = getBitrix24RuntimeConfig(process.env);

  const cards: IntegrationCard[] = [
    {
      title: "Telegram",
      description: "Оперативные уведомления о новых обращениях клиентов.",
      icon: MessageCircle,
      state:
        process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
          ? "configured"
          : "disabled",
      status:
        process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
          ? "Настроен"
          : "Не настроен",
      actionHref: "/admin/globals/lead-management",
      actionLabel: "Настройки форм"
    },
    {
      title: "Яндекс Метрика",
      description: "Посещения, цели и конверсии доступны прямо в SEO-разделе.",
      icon: BarChart3,
      state: process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID
        ? "connected"
        : "disabled",
      status: process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID
        ? "Сбор данных включён"
        : "Не настроена",
      actionHref: "/admin/seo?view=conversions&period=30&provider=yandex&device=all",
      actionLabel: "Открыть конверсии"
    },
    {
      title: "Bitrix24",
      description: "Передача заявок в CRM подготовлена и включается отдельным переключателем.",
      icon: Workflow,
      state: bitrix.enabled
        ? "connected"
        : bitrix.webhookUrlConfigured
          ? "configured"
          : "disabled",
      status: bitrix.enabled
        ? "Передача включена"
        : bitrix.webhookUrlConfigured
          ? "Подготовлен, но выключен"
          : "Не настроен",
      actionHref: "/admin/globals/lead-management",
      actionLabel: "Управление заявками"
    }
  ];

  const content = !isAdmin ? (
    <section className="kb-integrations kb-integrations--denied">
      <CircleAlert size={26} aria-hidden />
      <h1>Интеграции доступны администратору</h1>
      <p>У этого аккаунта нет прав на просмотр служебных подключений.</p>
    </section>
  ) : (
    <section className="kb-integrations" aria-label="Интеграции сайта">
      <header className="kb-integrations__hero">
        <div>
          <span className="kb-integrations__eyebrow">
            <Settings2 size={15} aria-hidden />
            Системный контур
          </span>
          <h1>Интеграции и доставка заявок</h1>
          <p>
            Живой статус ключевых сервисов сайта. Почтовое соединение проверяется
            при каждом открытии этого экрана.
          </p>
        </div>
        <a className="kb-integrations__refresh" href="/admin/integrations">
          <RefreshCw size={16} aria-hidden />
          Проверить снова
        </a>
      </header>

      <div className="kb-integrations__grid">
        <Suspense fallback={<EmailIntegrationCardLoading />}>
          <EmailIntegrationCard />
        </Suspense>
        {cards.map((card) => (
          <IntegrationCardView card={card} key={card.title} />
        ))}
      </div>

      <div className="kb-integrations__note">
        <CheckCircle2 size={17} aria-hidden />
        <span>
          Пароли и токены хранятся в закрытых переменных Vercel и никогда не
          показываются в админке.
        </span>
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
      {content}
    </DefaultTemplate>
  );
}
