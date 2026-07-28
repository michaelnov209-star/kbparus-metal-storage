import { createHash } from "node:crypto";
import type { Pool } from "pg";

interface MemoryEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  backend: "database" | "redis" | "memory" | "unavailable";
}

type RateLimitGlobal = typeof globalThis & {
  __kbparusLeadRateLimitStore?: Map<string, MemoryEntry>;
};

const globalRateLimit = globalThis as RateLimitGlobal;
const memoryStore =
  globalRateLimit.__kbparusLeadRateLimitStore ??
  (globalRateLimit.__kbparusLeadRateLimitStore = new Map<string, MemoryEntry>());

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function getSettings(env: NodeJS.ProcessEnv) {
  return {
    limit: boundedInteger(env.LEAD_RATE_LIMIT_MAX, 5, 1, 50),
    windowMs: boundedInteger(env.LEAD_RATE_LIMIT_WINDOW_MS, 60_000, 10_000, 3_600_000)
  };
}

export function getLeadClientIdentity(request: Request): string {
  const vercelForwarded = request.headers
    .get("x-vercel-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const userAgent = request.headers.get("user-agent")?.slice(0, 200) || "unknown-agent";
  const clientIp = vercelForwarded || forwarded || realIp;

  // Vercel overwrites its forwarding header, so one IP must share one bucket.
  // User-Agent stays only as a local/dev fallback and cannot reset a real
  // visitor's production limit.
  return clientIp || `unknown-ip|${userAgent}`;
}

function hashIdentity(identity: string, env: NodeJS.ProcessEnv) {
  const salt = env.LEAD_RATE_LIMIT_SALT || env.PAYLOAD_SECRET || "kbparus-lead-rate-limit";
  return createHash("sha256").update(salt).update("\0").update(identity).digest("hex").slice(0, 32);
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number
): RateLimitResult {
  const previous = memoryStore.get(key);
  const entry =
    !previous || previous.resetAt <= now
      ? { count: 1, resetAt: now + windowMs }
      : { count: previous.count + 1, resetAt: previous.resetAt };
  memoryStore.set(key, entry);

  if (memoryStore.size > 2_000) {
    for (const [storedKey, stored] of memoryStore) {
      if (stored.resetAt <= now) memoryStore.delete(storedKey);
    }
    while (memoryStore.size > 2_000) {
      const oldest = memoryStore.keys().next().value as string | undefined;
      if (!oldest) break;
      memoryStore.delete(oldest);
    }
  }

  return {
    allowed: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    backend: "memory"
  };
}

async function redisRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number,
  env: NodeJS.ProcessEnv
): Promise<RateLimitResult | undefined> {
  const baseUrl = env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "");
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!baseUrl || !token) return undefined;

  try {
    const response = await fetch(`${baseUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, windowMs, "NX"],
        ["PTTL", key]
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(1_500)
    });
    if (!response.ok) return undefined;

    const result = (await response.json()) as Array<{ result?: number | string }>;
    const count = Number(result[0]?.result);
    const ttl = Number(result[2]?.result);
    if (!Number.isFinite(count) || !Number.isFinite(ttl) || ttl <= 0) return undefined;

    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt: now + ttl,
      retryAfterSeconds: Math.max(1, Math.ceil(ttl / 1000)),
      backend: "redis"
    };
  } catch {
    return undefined;
  }
}

async function databaseRateLimit(
  pool: Pool,
  key: string,
  limit: number,
  windowMs: number,
  now: number
): Promise<RateLimitResult | undefined> {
  try {
    const resetAt = now + windowMs;
    const response = await pool.query<{
      count: number | string;
      reset_at_ms: number | string;
    }>(
      `
        INSERT INTO "lead_rate_limits"
          ("rate_limit_key", "count", "reset_at", "updated_at")
        VALUES ($1, 1, to_timestamp($2 / 1000.0), now())
        ON CONFLICT ("rate_limit_key") DO UPDATE
        SET
          "count" = CASE
            WHEN "lead_rate_limits"."reset_at" <= now() THEN 1
            ELSE "lead_rate_limits"."count" + 1
          END,
          "reset_at" = CASE
            WHEN "lead_rate_limits"."reset_at" <= now()
              THEN EXCLUDED."reset_at"
            ELSE "lead_rate_limits"."reset_at"
          END,
          "updated_at" = now()
        RETURNING
          "count",
          (extract(epoch FROM "reset_at") * 1000)::bigint AS "reset_at_ms"
      `,
      [key, resetAt]
    );
    const count = Number(response.rows[0]?.count);
    const persistedResetAt = Number(response.rows[0]?.reset_at_ms);
    if (!Number.isFinite(count) || !Number.isFinite(persistedResetAt)) {
      return undefined;
    }

    // Opportunistic bounded cleanup without adding a cron job. A deterministic
    // 1/256 sample keeps the table compact while avoiding work on every lead.
    if (key.endsWith("00")) {
      await pool
        .query(
          `DELETE FROM "lead_rate_limits"
           WHERE "updated_at" < now() - interval '1 day'`
        )
        .catch(() => undefined);
    }

    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt: persistedResetAt,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((persistedResetAt - now) / 1000)
      ),
      backend: "database"
    };
  } catch {
    return undefined;
  }
}

export async function checkLeadRateLimit(
  identity: string,
  env: NodeJS.ProcessEnv = process.env,
  now = Date.now(),
  pool?: Pool
): Promise<RateLimitResult> {
  const { limit, windowMs } = getSettings(env);
  const key = `kbparus:lead:${hashIdentity(identity, env)}`;
  const durableResult =
    (pool
      ? await databaseRateLimit(pool, key, limit, windowMs, now)
      : undefined) ??
    (await redisRateLimit(key, limit, windowMs, now, env));
  if (durableResult) return durableResult;

  const durableBackendExpected =
    env.NODE_ENV === "production" &&
    Boolean(
      env.DATABASE_URL ||
        env.DATABASE_POSTGRES_URL ||
        env.POSTGRES_URL ||
        env.DATABASE_URL_UNPOOLED ||
        env.DATABASE_POSTGRES_URL_NON_POOLING ||
        env.POSTGRES_URL_NON_POOLING ||
        env.UPSTASH_REDIS_REST_URL
    );
  if (durableBackendExpected) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: now + 30_000,
      retryAfterSeconds: 30,
      backend: "unavailable"
    };
  }

  return memoryRateLimit(key, limit, windowMs, now);
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    ...(result.allowed ? {} : { "Retry-After": String(result.retryAfterSeconds) }),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000))
  };
}
