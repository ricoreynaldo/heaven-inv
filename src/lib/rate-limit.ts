import "server-only";

/**
 * Rate limit fixed-window per kunci (mis. "login:<ip>").
 *
 * Store:
 *   - Upstash Redis (REST) bila UPSTASH_REDIS_REST_URL & _TOKEN diisi —
 *     disarankan di serverless karena memori tiap instance terpisah.
 *   - Memori proses sebagai default / fallback bila Redis tidak terjangkau.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

async function redisLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const namespaced = `heaven-inv:rl:${key}`;
  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", namespaced],
        ["PEXPIRE", namespaced, String(windowMs), "NX"],
        ["PTTL", namespaced],
      ]),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { result?: unknown }[];
    const count = Number(payload[0]?.result ?? 0);
    const ttl = Number(payload[2]?.result ?? windowMs);
    if (!Number.isFinite(count) || count <= 0) return null;
    if (count > limit) return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(ttl / 1000)) };
    return { ok: true, retryAfterSeconds: 0 };
  } catch {
    return null;
  }
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  return (await redisLimit(key, limit, windowMs)) ?? memoryLimit(key, limit, windowMs);
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "unknown";
}

export const LIMITS = {
  login: { limit: 8, windowMs: 10 * 60_000 },
  upload: { limit: 80, windowMs: 10 * 60_000 },
  password: { limit: 5, windowMs: 10 * 60_000 },
} as const;
