export const YANDEX_METRIKA_INIT_OPTIONS = {
  defer: true,
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: true,
  ecommerce: "dataLayer"
} as const;

export type YandexMetrikaFunction = (
  counterId: number,
  action: string,
  ...args: unknown[]
) => void;

type PageViewInput = {
  counterId: number;
  consent: boolean;
  url: string;
  title: string;
  referer?: string;
  ym?: YandexMetrikaFunction;
};

export function shouldRenderYandexMetrika(
  counterId: number,
  consent: boolean
): boolean {
  return consent && Number.isSafeInteger(counterId) && counterId > 0;
}

export function dispatchYandexPageView({
  counterId,
  consent,
  url,
  title,
  referer,
  ym
}: PageViewInput): boolean {
  if (
    !shouldRenderYandexMetrika(counterId, consent) ||
    typeof ym !== "function" ||
    !/^https?:\/\//i.test(url)
  ) {
    return false;
  }

  try {
    ym(counterId, "hit", url, {
      title,
      ...(referer ? { referer } : {})
    });
    return true;
  } catch {
    return false;
  }
}
