import "server-only";
import type { Store } from "./store";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets */
  resetIn: number;
}

/** Fixed-window limiter keyed by client id (IP). A limit of 0 disables it. */
export async function rateLimit(
  store: Store,
  clientId: string,
  limit: number,
  windowSeconds: number,
  nowMs = Date.now(),
): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000;
  const windowStart = Math.floor(nowMs / windowMs) * windowMs;
  const resetIn = Math.ceil((windowStart + windowMs - nowMs) / 1000);
  if (!limit) return { allowed: true, limit, remaining: Infinity, resetIn };
  let count: number;
  try {
    count = await store.incr(`rl:${clientId}:${windowStart}`, windowSeconds);
  } catch {
    // If the store is unavailable, fail open rather than blocking everyone.
    return { allowed: true, limit, remaining: limit, resetIn };
  }
  return { allowed: count <= limit, limit, remaining: Math.max(0, limit - count), resetIn };
}

export function clientIdFrom(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || headers.get("x-real-ip") || "unknown";
}
