import { resolveBitrix24WebhookUrl } from "./bitrix24";

export interface Bitrix24RuntimeConfig {
  enabled: boolean;
  webhookUrlConfigured: boolean;
}

export function getBitrix24RuntimeConfig(env: Record<string, string | undefined>): Bitrix24RuntimeConfig {
  const webhookUrlConfigured = Boolean(
    resolveBitrix24WebhookUrl(env.BITRIX24_WEBHOOK_URL)
  );
  return {
    enabled: env.BITRIX24_ENABLED === "true" && webhookUrlConfigured,
    webhookUrlConfigured
  };
}
