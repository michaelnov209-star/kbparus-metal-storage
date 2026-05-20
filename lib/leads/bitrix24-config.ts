export interface Bitrix24RuntimeConfig {
  enabled: boolean;
  webhookUrlConfigured: boolean;
}

export function getBitrix24RuntimeConfig(env: Record<string, string | undefined>): Bitrix24RuntimeConfig {
  return {
    enabled: env.BITRIX24_ENABLED === "true",
    webhookUrlConfigured: Boolean(env.BITRIX24_WEBHOOK_URL)
  };
}
