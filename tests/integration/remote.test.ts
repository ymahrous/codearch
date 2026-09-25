import { rmSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readRemoteHistory, RemoteError } from "@/lib/git/remote";
import { buildFixtureRepo, serveRepo, type FixtureRepo } from "../support/git-server";

let repo: FixtureRepo;

beforeAll(async () => {
  repo = await serveRepo(buildFixtureRepo());
});
afterAll(async () => {
  await repo?.close();
  if (repo) rmSync(repo.dir, { recursive: true, force: true });
});

describe("readRemoteHistory against a real git server", () => {
  it("returns exactly what `git log --no-renames --name-status` reports", async () => {
    const { commits, headFiles, packBytes } = await readRemoteHistory(repo.url);
    const ours = commits.map((c) => ({ h: c.h, a: c.a, t: c.t, s: c.s, f: c.f.map(([s, p]) => `${s}:${p}`).sort() }));
    const byHash = (x: { h: string }, y: { h: string }) => x.h.localeCompare(y.h);
    expect(ours.sort(byHash)).toEqual([...repo.expected].sort(byHash));
    expect(headFiles.sort()).toEqual([...repo.headFiles].sort());
    expect(packBytes).toBeGreaterThan(0);
  });

  it("covers the tricky cases in the fixture", async () => {
    const { commits } = await readRemoteHistory(repo.url);
    const get = (s: string) => commits.find((c) => c.s === s)!;
    expect(get("feat: add strings | pipes in subject").a).toBe("Grace Hopper");
    expect(get("Merge branch 'feature'").f).toEqual([]);
    expect(get("chore: symlink and exec bit").f).toEqual(
      expect.arrayContaining([
        ["A", "src/link.ts"],
        ["M", "src/index.ts"],
      ]),
    );
    expect(get("Initial commit").f).toEqual(expect.arrayContaining([["A", "docs/café.md"]]));
    expect(get("replace lib folder with a file").f).toEqual(
      expect.arrayContaining([
        ["A", "src/lib"],
        ["D", "src/lib/helpers.ts"],
      ]),
    );
  });

  it("uses protocol v2 and never downloads blobs", async () => {
    repo.requests.length = 0;
    await readRemoteHistory(repo.url);
    expect(repo.requests).toEqual([
      "GET /repo.git/info/refs?service=git-upload-pack",
      "POST /repo.git/git-upload-pack",
      "POST /repo.git/git-upload-pack",
    ]);
  });

  it("reports missing repositories", async () => {
    await expect(readRemoteHistory(repo.url.replace("repo.git", "missing.git"))).rejects.toMatchObject({ code: "not_found" });
  });

  it("enforces the download size limit", async () => {
    await expect(readRemoteHistory(repo.url, { maxPackBytes: 100 })).rejects.toBeInstanceOf(RemoteError);
    await expect(readRemoteHistory(repo.url, { maxPackBytes: 100 })).rejects.toMatchObject({ code: "too_large" });
  });

  it("reports network failures and timeouts", async () => {
    await expect(readRemoteHistory("http://127.0.0.1:1/repo.git", { timeoutMs: 2000 })).rejects.toMatchObject({ code: "network" });
    const slow = () =>
      new Promise<Response>((_, reject) => setTimeout(() => reject(Object.assign(new Error("t"), { name: "TimeoutError" })), 10));
    await expect(readRemoteHistory(repo.url, { fetch: slow, timeoutMs: 5 })).rejects.toMatchObject({ code: "timeout" });
  });

  it("reports a timeout that fires while a response body is still downloading", async () => {
    // Headers arrive at once, but the body only fails when the request's signal aborts.
    const stalled = async (_url: string, init?: RequestInit) =>
      new Response(
        new ReadableStream({
          start(ctrl) {
            init?.signal?.addEventListener("abort", () => ctrl.error(init.signal!.reason));
          },
        }),
        { status: 200 },
      );
    await expect(readRemoteHistory(repo.url, { fetch: stalled, timeoutMs: 20 })).rejects.toMatchObject({ code: "timeout" });
  });

  it("rejects servers without protocol v2 or partial clone support", async () => {
    const v0 = async () => new Response("001e# service=git-upload-pack\n0000", { status: 200 });
    await expect(readRemoteHistory(repo.url, { fetch: v0 })).rejects.toMatchObject({ code: "unsupported" });
    const noFilter = async () => new Response("000eversion 2\n000afetch\n0000", { status: 200 });
    await expect(readRemoteHistory(repo.url, { fetch: noFilter })).rejects.toMatchObject({ code: "unsupported" });
  });
});
