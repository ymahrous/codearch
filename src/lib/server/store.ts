import "server-only";
import { Redis } from "@upstash/redis";
import { config } from "./config";

/**
 * Small key-value store with TTLs. Uses Upstash Redis when configured, so the
 * cache and rate limits are shared across serverless instances; otherwise an
 * in-process LRU map (fine for local dev or a single server).
 */
export interface Store {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  /** Increments a counter, setting its TTL when it is first created. Returns the new value. */
  incr(key: string, ttlSeconds: number): Promise<number>;
}

export class MemoryStore implements Store {
  private map = new Map<string, { value: unknown; expires: number }>();
  constructor(
    private maxEntries = 500,
    private now = () => Date.now(),
  ) {}

  private live(key: string) {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expires <= this.now()) {
      this.map.delete(key);
      return undefined;
    }
    return hit;
  }
  async get<T>(key: string) {
    const hit = this.live(key);
    if (!hit) return null;
    this.map.delete(key); // refresh LRU position
    this.map.set(key, hit);
    return hit.value as T;
  }
  async set<T>(key: string, value: T, ttlSeconds: number) {
    this.map.delete(key);
    this.map.set(key, { value, expires: this.now() + ttlSeconds * 1000 });
    while (this.map.size > this.maxEntries) this.map.delete(this.map.keys().next().value!);
  }
  async incr(key: string, ttlSeconds: number) {
    const hit = this.live(key);
    const n = ((hit?.value as number) ?? 0) + 1;
    this.map.set(key, { value: n, expires: hit?.expires ?? this.now() + ttlSeconds * 1000 });
    return n;
  }
}

export class RedisStore implements Store {
  constructor(
    private redis: Redis,
    private prefix = "archaeology:",
  ) {}
  async get<T>(key: string) {
    return (await this.redis.get<T>(this.prefix + key)) ?? null;
  }
  async set<T>(key: string, value: T, ttlSeconds: number) {
    await this.redis.set(this.prefix + key, value, { ex: Math.max(1, Math.ceil(ttlSeconds)) });
  }
  async incr(key: string, ttlSeconds: number) {
    const k = this.prefix + key;
    const n = await this.redis.incr(k);
    if (n === 1) await this.redis.expire(k, Math.max(1, Math.ceil(ttlSeconds)));
    return n;
  }
}

// One store per server process. Next.js bundles route handlers and pages separately, each
// with its own copy of this module, so the store lives on globalThis: that way a report the
// API cached is also visible to the page that server-renders it.
const shared = globalThis as typeof globalThis & { __archaeologyStore?: Store };

export function getStore(): Store {
  if (shared.__archaeologyStore) return shared.__archaeologyStore;
  const { redis, cacheEntries } = config();
  shared.__archaeologyStore = redis ? new RedisStore(new Redis(redis)) : new MemoryStore(cacheEntries + 5000);
  return shared.__archaeologyStore;
}

/** For tests. */
export function setStore(s: Store | undefined) {
  shared.__archaeologyStore = s;
}
