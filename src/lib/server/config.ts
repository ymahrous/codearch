import "server-only";
import { z } from "zod";

const int = (def: number) => z.coerce.number().int().min(0).default(def);

const schema = z.object({
  GITHUB_TOKEN: z.string().optional(),
  MAX_REPO_MB: int(400),
  MAX_PACK_MB: int(200),
  FETCH_TIMEOUT_SECONDS: int(120),
  CACHE_TTL_MINUTES: int(360),
  CACHE_ENTRIES: int(60),
  DIGS_PER_WINDOW: int(12),
  RATE_WINDOW_MINUTES: int(15),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
});

export type ServerConfig = ReturnType<typeof loadConfig>;

/** Reads and validates server settings from the environment. Empty strings count as unset. */
export function loadConfig(env: Record<string, string | undefined> = process.env) {
  const cleaned = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== ""));
  const e = schema.parse(cleaned);
  return {
    githubToken: e.GITHUB_TOKEN,
    maxRepoMb: e.MAX_REPO_MB,
    maxPackBytes: e.MAX_PACK_MB * 1_000_000,
    fetchTimeoutMs: e.FETCH_TIMEOUT_SECONDS * 1000,
    cacheTtlSeconds: e.CACHE_TTL_MINUTES * 60,
    cacheEntries: e.CACHE_ENTRIES,
    digsPerWindow: e.DIGS_PER_WINDOW,
    rateWindowSeconds: e.RATE_WINDOW_MINUTES * 60,
    redis:
      (e.UPSTASH_REDIS_REST_URL ?? e.KV_REST_API_URL) && (e.UPSTASH_REDIS_REST_TOKEN ?? e.KV_REST_API_TOKEN)
        ? { url: (e.UPSTASH_REDIS_REST_URL ?? e.KV_REST_API_URL)!, token: (e.UPSTASH_REDIS_REST_TOKEN ?? e.KV_REST_API_TOKEN)! }
        : null,
  };
}

let cached: ServerConfig | undefined;
export const config = () => (cached ??= loadConfig());
