export class SeoProviderError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "SeoProviderError";
    this.status = status;
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
      if (error.status === 403) {
        return "Service account не имеет доступа к выбранному ресурсу Search Console. Добавьте его email в список пользователей ресурса.";
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
