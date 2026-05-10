import { getCmsClient } from "./client";
import { visualAssets } from "@/data/storageSystems/visualAssets";

/**
 * Структура hero-блока главной страницы для рендера.
 * Все поля имеют разумные дефолты, чтобы сайт работал даже когда CMS пуста.
 */
export interface HeroData {
  eyebrow: string;
  title: string;
  description?: string;
  background:
    | { type: "video"; videoUrl: string; posterUrl: string }
    | { type: "image"; imageUrl: string; imageSrcSet?: string; alt: string };
  metrics: Array<{ value: string; label: string }>;
}

/** Дефолты — то, что показывается если CMS пуста или недоступна. */
const DEFAULT_HERO: HeroData = {
  eyebrow: "КБ Парус / складские системы для металла",
  title: "Системы хранения металла",
  background: {
    type: "video",
    videoUrl: "/assets/videos/metal-storage-hero-trimmed.mp4",
    posterUrl: visualAssets.hero
  },
  metrics: [
    { value: "500+", label: "проектов" },
    { value: "20+", label: "лет на рынке" },
    { value: "12 000+", label: "тонн металла под управлением" }
  ]
};

interface MediaDoc {
  url?: string | null;
  filename?: string | null;
  alt?: string | null;
  sizes?: Record<string, { url?: string | null; width?: number | null }> | null;
}

function pickUrl(media: MediaDoc | number | null | undefined): string | undefined {
  if (!media || typeof media === "number") return undefined;
  return media.url ?? undefined;
}

/** Собирает srcset для адаптивных картинок (использует размеры sharp от Payload). */
function buildSrcSet(media: MediaDoc | number | null | undefined): string | undefined {
  if (!media || typeof media === "number" || !media.sizes) return undefined;
  const entries: string[] = [];
  for (const size of Object.values(media.sizes)) {
    if (size?.url && size?.width) entries.push(`${size.url} ${size.width}w`);
  }
  return entries.length > 0 ? entries.join(", ") : undefined;
}

/**
 * Возвращает hero-данные из CMS с fallback на дефолт.
 * Вызывается на server side в app/page.tsx.
 */
export async function getHeroContent(): Promise<HeroData> {
  const cms = await getCmsClient();
  if (!cms) return DEFAULT_HERO;

  try {
    const home = (await cms.findGlobal({ slug: "home-content", depth: 2 })) as
      | {
          hero?: {
            eyebrow?: string | null;
            title?: string | null;
            description?: string | null;
            background?: {
              type?: "video" | "image" | null;
              video?: MediaDoc | number | null;
              poster?: MediaDoc | number | null;
              image?: MediaDoc | number | null;
            } | null;
            metrics?: Array<{ value?: string | null; label?: string | null }> | null;
          } | null;
        }
      | null;

    const hero = home?.hero;
    if (!hero) return DEFAULT_HERO;

    const eyebrow = hero.eyebrow ?? DEFAULT_HERO.eyebrow;
    const title = hero.title ?? DEFAULT_HERO.title;
    const description = hero.description ?? undefined;
    const metrics =
      hero.metrics && hero.metrics.length > 0
        ? hero.metrics
            .filter((m): m is { value: string; label: string } => Boolean(m.value && m.label))
            .map((m) => ({ value: m.value, label: m.label }))
        : DEFAULT_HERO.metrics;

    const bg = hero.background;
    const wantVideo = bg?.type === "video" || !bg?.type;

    if (wantVideo) {
      const videoUrl = pickUrl(bg?.video ?? null) ?? (DEFAULT_HERO.background as { videoUrl: string }).videoUrl;
      const posterUrl =
        pickUrl(bg?.poster ?? null) ?? (DEFAULT_HERO.background as { posterUrl: string }).posterUrl;
      return {
        eyebrow,
        title,
        description,
        background: { type: "video", videoUrl, posterUrl },
        metrics
      };
    }

    // image mode
    const imageUrl = pickUrl(bg?.image ?? null);
    const imageSrcSet = buildSrcSet(bg?.image ?? null);
    if (imageUrl) {
      return {
        eyebrow,
        title,
        description,
        background: {
          type: "image",
          imageUrl,
          imageSrcSet,
          alt:
            (typeof bg?.image === "object" && bg?.image?.alt) ||
            "Производство КБ Парус — системы хранения металла"
        },
        metrics
      };
    }

    // image mode выбран, но картинка не загружена — fallback на дефолт-видео
    return DEFAULT_HERO;
  } catch (error) {
    console.warn("[cms] getHeroContent failed:", error);
    return DEFAULT_HERO;
  }
}
