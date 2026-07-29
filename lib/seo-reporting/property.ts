import type { SeoProvider, SeoReportingConfig } from "./types";

export function formatYandexWebmasterHostId(hostId: string): string {
  const normalized = hostId.trim();
  const match = /^(https?):(.+):(\d+)$/i.exec(normalized);
  if (!match) return normalized;

  const [, protocol, hostname, rawPort] = match;
  const port = Number.parseInt(rawPort, 10);
  const isDefaultPort =
    (protocol.toLowerCase() === "https" && port === 443) ||
    (protocol.toLowerCase() === "http" && port === 80);

  return `${protocol.toLowerCase()}://${hostname}${isDefaultPort ? "" : `:${port}`}`;
}

export function getTrackedSeoProperty(
  config: SeoReportingConfig,
  provider: SeoProvider
): string | null {
  if (provider === "yandex") {
    const source = config.yandex;
    return source.configured
      ? formatYandexWebmasterHostId(source.hostId)
      : null;
  }

  const source = config.google;
  return source.configured ? source.siteUrl : null;
}
