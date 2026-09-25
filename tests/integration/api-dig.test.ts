import { rmSync } from "node:fs";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiError, DigResponse } from "@/lib/archaeology/types";
import { buildFixtureRepo, serveRepo, type FixtureRepo } from "../support/git-server";

// Settings are read once per process, so set them before the route module loads.
vi.hoisted(() => {
  process.env.DIGS_PER_WINDOW = "3";
  process.env.MAX_REPO_MB = "50";
});

// Point every repository at the local fixture server instead of the real host.
const fixture = vi.hoisted(() => ({ url: "" }));
vi.mock("@/lib/archaeology/repo-input", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/archaeology/repo-input")>();
  return {
    ...mod,
    parseRepoInput: (input: string) => {
      const t = mod.parseRepoInput(input);
      return t && { ...t, cloneUrl: fixture.url };
    },
  };
});

const { GET } = await import("@/app/api/dig/route");
const { setStore, MemoryStore } = await import("@/lib/server/store");

let repo: FixtureRepo;
const realFetch = globalThis.fetch;
let githubApi: (url: string) => Response | null = () => null;

beforeAll(async () => {
  repo = await serveRepo(buildFixtureRepo());
  fixture.url = repo.url;
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith("https://api.github.com/")) return githubApi(url) ?? new Response("{}", { status: 503 });
    return realFetch(input, init);
  });
});
afterAll(async () => {
  vi.restoreAllMocks();
  await repo?.close();
  if (repo) rmSync(repo.dir, { recursive: true, force: true });
});
beforeEach(() => {
  setStore(new MemoryStore());
  githubApi = () => null;
});

const call = async (qs: string, ip = "203.0.113.7") => {
  const res = await GET(new NextRequest(`http://localhost/api/dig?${qs}`, { headers: { "x-forwarded-for": ip } }));
  return { res, body: (await res.json()) as DigResponse & ApiError };
};

describe("GET /api/dig", () => {
  it("rejects invalid input with a 400", async () => {
    const { res, body } = await call("repo=not-a-repo");
    expect(res.status).toBe(400);
    expect(body.error.code).toBe("invalid_input");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("analyzes a repository end to end, then serves it from the cache", async () => {
    const first = await call("repo=codeberg.org/fixture/repo");
    expect(first.res.status).toBe(200);
    expect(first.body.cached).toBe(false);
    expect(first.body.report.name).toBe("fixture/repo");
    expect(first.body.report.stats.commits).toBe(repo.expected.length);
    expect(first.body.report.stats.survivingFiles).toBe(repo.headFiles.length);
    expect(first.body.report.top[0].name).toBe("Grace Hopper");
    expect(first.body.meta.htmlUrl).toBe("https://codeberg.org/fixture/repo");
    expect(first.res.headers.get("server-timing")).toMatch(/download;dur=\d+/);
    expect(first.res.headers.get("cache-control")).toContain("s-maxage=300");
    expect(first.res.headers.get("ratelimit-remaining")).toBe("2");

    const second = await call("repo=https://codeberg.org/fixture/repo");
    expect(second.body.cached).toBe(true);
    expect(second.res.headers.get("ratelimit-remaining")).toBeNull(); // cache hits aren't counted
  });

  it("merges author name casing in the report", async () => {
    const { body } = await call("repo=codeberg.org/fixture/case");
    const names = body.report.top.map((t) => t.name);
    expect(names).toContain("Ada Lovelace");
    expect(names).not.toContain("ada lovelace");
  });

  it("rate limits new analyses per IP", async () => {
    const ip = "198.51.100.1";
    const statuses = [];
    for (let i = 0; i < 4; i++) statuses.push((await call(`repo=codeberg.org/fixture/r${i}`, ip)).res.status);
    expect(statuses).toEqual([200, 200, 200, 429]);
    const blocked = await call("repo=codeberg.org/fixture/r9", ip);
    expect(blocked.body.error.code).toBe("rate_limited");
    expect(Number(blocked.res.headers.get("retry-after"))).toBeGreaterThan(0);
    // A cached repo is still available to the same visitor.
    expect((await call("repo=codeberg.org/fixture/r0", ip)).res.status).toBe(200);
  });

  it("uses GitHub metadata when available", async () => {
    githubApi = () =>
      Response.json({
        full_name: "Fixture/Repo",
        description: "A test repo",
        stargazers_count: 1234,
        default_branch: "main",
        size: 100,
        private: false,
      });
    const { res, body } = await call("repo=fixture/repo");
    expect(res.status).toBe(200);
    expect(body.report.name).toBe("Fixture/Repo");
    expect(body.meta).toMatchObject({ description: "A test repo", stars: 1234, htmlUrl: "https://github.com/Fixture/Repo" });
  });

  it("maps GitHub lookups to clear errors", async () => {
    githubApi = () => new Response("{}", { status: 404 });
    let r = await call("repo=fixture/missing");
    expect(r.res.status).toBe(404);
    expect(r.body.error.message).toMatch(/couldn't find a public repository/);

    githubApi = () =>
      Response.json({ full_name: "a/b", size: 200 * 1024, private: false, description: null, stargazers_count: 0, default_branch: "main" });
    r = await call("repo=fixture/huge");
    expect(r.res.status).toBe(413);
    expect(r.body.error.message).toMatch(/200 MB, above this site's 50 MB limit/);

    githubApi = () =>
      Response.json({ full_name: "a/b", size: 1, private: true, description: null, stargazers_count: 0, default_branch: "main" });
    r = await call("repo=fixture/secret");
    expect(r.res.status).toBe(403);
  });

  it("still works when the GitHub API is unavailable", async () => {
    githubApi = () => new Response("rate limited", { status: 403 });
    const { res, body } = await call("repo=fixture/fallback");
    expect(res.status).toBe(200);
    expect(body.report.name).toBe("fixture/fallback");
  });

  it("bypasses the cache with refresh=1", async () => {
    await call("repo=codeberg.org/fixture/fresh");
    const { body, res } = await call("repo=codeberg.org/fixture/fresh&refresh=1");
    expect(body.cached).toBe(false);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
