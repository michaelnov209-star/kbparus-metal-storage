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
  if (error instanceof SeoProviderError && error.status) {
    return `${provider} временно недоступен (HTTP ${error.status})`;
  }
  return `${provider} временно недоступен`;
}
