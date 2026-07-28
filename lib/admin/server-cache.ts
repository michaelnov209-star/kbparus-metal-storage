type CacheEntry<T> = {
  expiresAt: number;
  pending?: Promise<T>;
  value?: T;
};

type AdminCacheGlobal = typeof globalThis & {
  __kbparusAdminCache?: Map<string, CacheEntry<unknown>>;
};

const adminCacheGlobal = globalThis as AdminCacheGlobal;
const adminCache =
  adminCacheGlobal.__kbparusAdminCache ??
  (adminCacheGlobal.__kbparusAdminCache = new Map());

/**
 * Deduplicates concurrent read-only admin summaries and keeps short-lived
 * results in a warm server instance. Mutating Payload pages are never cached.
 */
export async function getCachedAdminValue<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = adminCache.get(key) as CacheEntry<T> | undefined;
  if (cached?.value !== undefined && cached.expiresAt > now) {
    return cached.value;
  }
  if (cached?.pending) return cached.pending;

  const pending = loader();
  adminCache.set(key, {
    expiresAt: cached?.expiresAt ?? 0,
    pending,
    value: cached?.value
  });

  try {
    const value = await pending;
    adminCache.set(key, { expiresAt: Date.now() + ttlMs, value });
    return value;
  } catch (error) {
    adminCache.delete(key);
    throw error;
  }
}
