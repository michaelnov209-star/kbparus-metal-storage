export class SeoProviderError extends Error {
  readonly status: number | null;
  readonly reason: string | null;

  constructor(
    message: string,
    status: number | null = null,
    reason: string | null = null
  ) {
    super(message);
    this.name = "SeoProviderError";
    this.status = status;
    this.reason = reason;
  }
}

export function publicSeoProviderError(
  provider: "Google Search Console" | "Яндекс Вебмастер",
  error: unknown
): string {
  if (error instanceof SeoProviderError) {
    if (provider === "Google Search Console") {
      const isOauthFailure = error.message.startsWith("Google OAuth");
      if (
        isOauthFailure &&
        (error.status === 400 ||
          error.status === 401 ||
          error.status === 403)
      ) {
        return "Google не принял учётные данные service account. Проверьте email и закрытый ключ.";
      }
      if (error.status === 400) {
        return "Google отклонил параметры отчёта. Проверьте точное имя ресурса Search Console.";
      }
      if (error.status === 401) {
        return "Google не принял токен доступа. Обновите отчёт; если ошибка повторится, проверьте service account.";
      }
      if (
        error.reason === "accessNotConfigured" ||
        error.reason === "serviceDisabled" ||
        error.reason === "SERVICE_DISABLED" ||
        error.reason === "API_DISABLED"
      ) {
        return "Search Console API выключен в Google Cloud-проекте service account. Включите API, дождитесь применения настройки и обновите отчёт.";
      }
      if (
        error.reason === "rateLimitExceeded" ||
        error.reason === "userRateLimitExceeded" ||
        error.reason === "dailyLimitExceeded" ||
        error.reason === "quotaExceeded"
      ) {
        return "Google временно ограничил запросы Search Console API. Повторите обновление позже.";
      }
      if (error.status === 403) {
        return "Доступ к ресурсу Search Console не подтверждён. Добавьте служебный email пользователем именно этого ресурса с правом чтения и проверьте точный адрес ресурса.";
      }
      if (error.status === 404) {
        return "Ресурс Search Console не найден. Проверьте точное значение GOOGLE_SEARCH_CONSOLE_SITE_URL.";
      }
      if (error.status === 429) {
        return "Google временно ограничил частоту запросов. Повторите обновление позже.";
      }
    }

    if (error.status) {
      return `${provider} временно недоступен (HTTP ${error.status})`;
    }
    if (error.message) return error.message;
  }
  return `${provider} временно недоступен`;
}
