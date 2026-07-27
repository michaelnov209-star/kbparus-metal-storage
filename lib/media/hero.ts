export const DEFAULT_HERO_VIDEO = {
  desktopUrl: "/assets/videos/metal-storage-hero-trimmed.mp4",
  mobileUrl: "/assets/videos/optimized/metal-storage-hero-mobile-a1f4c8d3c57a.mp4",
  posterUrl: "/assets/images/home/optimized/metal-storage-hero-poster-e2b60a440bad.webp"
} as const;

export function resolveMobileHeroVideo(
  videoUrl: string,
  configuredMobileUrl?: string
): string | undefined {
  if (configuredMobileUrl) return configuredMobileUrl;

  // Optimizes the existing CMS hero immediately. Other uploaded videos only
  // receive a mobile source after an editor provides a matching rendition.
  return videoUrl.includes("metal-storage-hero-trimmed.mp4")
    ? DEFAULT_HERO_VIDEO.mobileUrl
    : undefined;
}
