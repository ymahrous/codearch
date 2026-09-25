import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync, chmodSync, renameSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Creates a real git repository with a scripted history and serves it over
 * git's smart HTTP protocol v2 (via `git upload-pack --stateless-rpc`), so the
 * fetcher can be tested end to end without network access.
 */
export interface FixtureRepo {
  dir: string;
  url: string;
  /** `git log` output for comparison: [hash8, author, time, subject, sorted "S:path" list] */
  expected: Array<{ h: string; a: string; t: number; s: string; f: string[] }>;
  headFiles: string[];
  requests: string[];
  close(): Promise<void>;
}

function git(dir: string, args: string[], env: Record<string, string> = {}) {
  return execFileSync("git", args, {
    cwd: dir,
    env: { ...process.env, ...env, GIT_CONFIG_NOSYSTEM: "1", HOME: dir },
    maxBuffer: 1 << 26,
  }).toString();
}

export function buildFixtureRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "arch-fixture-"));
  git(dir, ["init", "-q", "-b", "main"]);
  git(dir, ["config", "uploadpack.allowFilter", "true"]);
  git(dir, ["config", "commit.gpgsign", "false"]);
  let t = Date.UTC(2019, 0, 1) / 1000;
  const commit = (author: string, msg: string, days = 30) => {
    t += days * 86400;
    const date = `${t} +0000`;
    git(dir, ["add", "-A"]);
    git(dir, ["commit", "-q", "--allow-empty", "-m", msg], {
      GIT_AUTHOR_NAME: author,
      GIT_AUTHOR_EMAIL: `${author.split(" ")[0].toLowerCase()}@example.com`,
      GIT_AUTHOR_DATE: date,
      GIT_COMMITTER_NAME: author,
      GIT_COMMITTER_EMAIL: "c@example.com",
      GIT_COMMITTER_DATE: date,
    });
  };
  const w = (p: string, s: string) => {
    mkdirSync(join(dir, p, ".."), { recursive: true });
    writeFileSync(join(dir, p), s);
  };

  w("README.md", "# Fixture\n");
  w("src/index.ts", "export {}\n");
  w("src/lib/util.ts", "export const a = 1\n");
  w("docs/intro.md", "intro\n");
  w("docs/café.md", "unicode path\n");
  commit("Ada Lovelace", "Initial commit");

  w("src/index.ts", "export const x = 1\n");
  w("src/lib/strings.ts", "export const s = ''\n");
  commit("Grace Hopper", "feat: add strings | pipes in subject");

  git(dir, ["checkout", "-q", "-b", "feature"]);
  w("src/feature.ts", "feature\n");
  commit("Linus Torvalds", "feature work");
  git(dir, ["checkout", "-q", "main"]);

  renameSync(join(dir, "src/lib/util.ts"), join(dir, "src/lib/helpers.ts"));
  unlinkSync(join(dir, "docs/intro.md"));
  commit("ada lovelace", "refactor: rename util, drop intro");

  symlinkSync("index.ts", join(dir, "src/link.ts"));
  chmodSync(join(dir, "src/index.ts"), 0o755);
  commit("Grace Hopper", "chore: symlink and exec bit");

  git(dir, ["merge", "-q", "--no-ff", "feature", "-m", "Merge branch 'feature'"], {
    GIT_AUTHOR_NAME: "Ada Lovelace",
    GIT_AUTHOR_EMAIL: "ada@example.com",
    GIT_AUTHOR_DATE: `${(t += 86400)} +0000`,
    GIT_COMMITTER_NAME: "Ada Lovelace",
    GIT_COMMITTER_EMAIL: "ada@example.com",
    GIT_COMMITTER_DATE: `${t} +0000`,
  });

  for (let i = 0; i < 30; i++) {
    w(`src/gen/file${i % 7}.ts`, `// ${i}\n`.repeat(i + 1));
    commit(i % 3 ? "Grace Hopper" : "dependabot[bot]", `update ${i}`, 20);
  }
  rmSync(join(dir, "src/lib/strings.ts"));
  rmSync(join(dir, "src/lib"), { recursive: true, force: true });
  w("src/lib", "now a file, not a folder\n");
  commit("Linus Torvalds", "replace lib folder with a file");
  return dir;
}

function upload(dir: string, args: string[], input?: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const p = spawn("git", ["upload-pack", "--stateless-rpc", ...args, dir], { env: { ...process.env, GIT_PROTOCOL: "version=2" } });
    const out: Buffer[] = [];
    p.stdout.on("data", (d) => out.push(d));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(`upload-pack exited ${code}`))));
    p.stdin.end(input);
  });
}

export async function serveRepo(dir: string): Promise<FixtureRepo> {
  const requests: string[] = [];
  const server: Server = createServer(async (req, res) => {
    requests.push(`${req.method} ${req.url}`);
    try {
      if (req.method === "GET" && req.url?.startsWith("/repo.git/info/refs?service=git-upload-pack")) {
        const body = await upload(dir, ["--http-backend-info-refs"]);
        res.writeHead(200, { "Content-Type": "application/x-git-upload-pack-advertisement" });
        res.end(Buffer.concat([Buffer.from("001e# service=git-upload-pack\n0000"), body]));
        return;
      }
      if (req.method === "POST" && req.url === "/repo.git/git-upload-pack") {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const body = await upload(dir, [], Buffer.concat(chunks));
        res.writeHead(200, { "Content-Type": "application/x-git-upload-pack-result" });
        res.end(body);
        return;
      }
      res.writeHead(404).end("not found");
    } catch (e) {
      res.writeHead(500).end(String(e));
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;

  const log = git(dir, ["-c", "core.quotePath=false", "log", "--no-renames", "--name-status", "--format=@@%H%x1f%an%x1f%at%x1f%s", "HEAD"]);
  const expected: FixtureRepo["expected"] = [];
  for (const block of log.split("@@").filter(Boolean)) {
    const [head, ...rest] = block.split("\n");
    const [h, a, t, s] = head.split("\x1f");
    const f = rest
      .filter((l) => l.includes("\t"))
      .map((l) => {
        const [st, p] = l.split("\t");
        return `${st}:${p}`;
      })
      .sort();
    expected.push({ h: h.slice(0, 8), a, t: Number(t), s, f });
  }
  const headFiles = git(dir, ["-c", "core.quotePath=false", "ls-tree", "-r", "--name-only", "HEAD"]).split("\n").filter(Boolean);

  return {
    dir,
    url: `http://127.0.0.1:${port}/repo.git`,
    expected,
    headFiles,
    requests,
    close: () => new Promise((r) => server.close(() => r())),
  };
}
