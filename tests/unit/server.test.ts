import { describe, expect, it } from "vitest";
import { loadConfig } from "@/lib/server/config";
import { AppError } from "@/lib/server/errors";
import { clientIdFrom, rateLimit } from "@/lib/server/rate-limit";
import { MemoryStore } from "@/lib/server/store";

describe("MemoryStore", () => {
  it("expires entries after their TTL", async () => {
    let now = 0;
    const s = new MemoryStore(10, () => now);
    await s.set("k", { a: 1 }, 60);
    expect(await s.get("k")).toEqual({ a: 1 });
    now = 61_000;
    expect(await s.get("k")).toBeNull();
  });

  it("evicts the least recently used entry", async () => {
    const s = new MemoryStore(2);
    await s.set("a", 1, 60);
    await s.set("b", 2, 60);
    await s.get("a"); // a is now most recent
    await s.set("c", 3, 60);
    expect(await s.get("b")).toBeNull();
    expect(await s.get("a")).toBe(1);
  });

  it("increments counters within their TTL", async () => {
    let now = 0;
    const s = new MemoryStore(10, () => now);
    expect(await s.incr("n", 10)).toBe(1);
    expect(await s.incr("n", 10)).toBe(2);
    now = 11_000;
    expect(await s.incr("n", 10)).toBe(1);
  });
});

describe("rateLimit", () => {
  it("allows up to the limit per window, then blocks", async () => {
    const s = new MemoryStore();
    const t = 1_000_000_000_000;
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimit(s, "1.2.3.4", 3, 60, t));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[1].remaining).toBe(1);
    expect(results[3].resetIn).toBeGreaterThan(0);
    expect((await rateLimit(s, "5.6.7.8", 3, 60, t)).allowed).toBe(true);
    expect((await rateLimit(s, "1.2.3.4", 3, 60, t + 60_000)).allowed).toBe(true);
  });

  it("is disabled with a limit of 0 and fails open if the store errors", async () => {
    expect((await rateLimit(new MemoryStore(), "x", 0, 60)).allowed).toBe(true);
    const broken = {
      get: async () => null,
      set: async () => {},
      incr: async () => {
        throw new Error("down");
      },
    };
    expect((await rateLimit(broken, "x", 1, 60)).allowed).toBe(true);
  });

  it("reads the client IP from proxy headers", () => {
    expect(clientIdFrom(new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
    expect(clientIdFrom(new Headers({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(clientIdFrom(new Headers())).toBe("unknown");
  });
});

describe("loadConfig", () => {
  it("applies defaults and ignores empty strings", () => {
    const c = loadConfig({ GITHUB_TOKEN: "", MAX_REPO_MB: "" });
    expect(c.githubToken).toBeUndefined();
    expect(c.maxRepoMb).toBe(400);
    expect(c.cacheTtlSeconds).toBe(360 * 60);
    expect(c.redis).toBeNull();
  });

  it("reads Upstash settings from either naming scheme", () => {
    expect(loadConfig({ KV_REST_API_URL: "https://x.upstash.io", KV_REST_API_TOKEN: "t" }).redis).toEqual({
      url: "https://x.upstash.io",
      token: "t",
    });
    expect(loadConfig({ UPSTASH_REDIS_REST_URL: "https://y.upstash.io", UPSTASH_REDIS_REST_TOKEN: "u" }).redis?.url).toBe(
      "https://y.upstash.io",
    );
  });

  it("rejects invalid values", () => {
    expect(() => loadConfig({ MAX_REPO_MB: "lots" })).toThrow();
  });
});

describe("AppError", () => {
  it("maps codes to HTTP statuses", () => {
    expect(new AppError("not_found", "x").status).toBe(404);
    expect(new AppError("rate_limited", "x").status).toBe(429);
    expect(new AppError("too_large", "x").status).toBe(413);
  });
});
