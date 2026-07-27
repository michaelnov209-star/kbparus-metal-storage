export interface ImageSrcSetEntry {
  src?: string;
  width: number;
}

export function buildImageSrcSet(entries: ImageSrcSetEntry[]): string | undefined {
  const bySource = new Map<string, number>();

  for (const entry of entries) {
    if (!entry.src || entry.width <= 0) continue;
    bySource.set(entry.src, Math.max(entry.width, bySource.get(entry.src) ?? 0));
  }

  const srcSet = Array.from(bySource, ([src, width]) => ({ src, width }))
    .sort((a, b) => a.width - b.width)
    .map(({ src, width }) => `${src} ${width}w`)
    .join(", ");

  return srcSet || undefined;
}
