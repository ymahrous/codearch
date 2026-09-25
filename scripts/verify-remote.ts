/**
 * Cross-checks the pure-TypeScript git reader against the real git CLI.
 *   npx tsx scripts/verify-remote.ts expressjs/express
 * Requires git on PATH and network access.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readRemoteHistory } from "../src/lib/git/remote";
import { parseLog } from "../src/lib/archaeology/log-format";

async function main() {
  const slug = process.argv[2] ?? "expressjs/express";
  const host = process.argv[3] ?? "github.com";
  const url = `https://${host}/${slug}.git`;

  let t = Date.now();
  const mine = await readRemoteHistory(url, { timeoutMs: 120_000 });
  const ours = Date.now() - t;

  const dir = mkdtempSync(join(tmpdir(), "verify-"));
  try {
    t = Date.now();
    execFileSync("git", ["clone", "-q", "--bare", "--filter=blob:none", "--single-branch", "--no-tags", url, dir]);
    const log = execFileSync(
      "git",
      ["-C", dir, "-c", "core.quotePath=false", "log", "--no-renames", "--name-status", "--format=@@%H%x1f%an%x1f%at%x1f%s", "HEAD"],
      { maxBuffer: 1 << 30 },
    ).toString();
    const head = execFileSync("git", ["-C", dir, "-c", "core.quotePath=false", "ls-tree", "-r", "--name-only", "HEAD"], {
      maxBuffer: 1 << 28,
    })
      .toString()
      .split("\n")
      .filter(Boolean);
    const theirs = Date.now() - t;
    const ref = parseLog(log);

    const key = (c: { h: string; a: string; t: number; s: string; f: [string, string][] }) =>
      `${c.h.slice(0, 8)}|${c.a}|${c.t}|${c.s.replace(/\s+/g, " ").trim()}|${c.f
        .map(([s, p]) => s + ":" + p)
        .sort()
        .join(",")}`;
    const a = new Set(mine.commits.map(key));
    const b = new Set(ref.map(key));
    const onlyMine = [...a].filter((x) => !b.has(x));
    const onlyGit = [...b].filter((x) => !a.has(x));
    const headSame = JSON.stringify([...mine.headFiles].sort()) === JSON.stringify([...head].sort());

    console.log(
      `${slug}: ours ${mine.commits.length} commits in ${ours}ms (${(mine.packBytes / 1e6).toFixed(1)} MB pack); git ${ref.length} in ${theirs}ms`,
    );
    console.log(`  mismatches: ${onlyMine.length} only-ours, ${onlyGit.length} only-git; HEAD files match: ${headSame}`);
    for (const x of onlyMine.slice(0, 3)) console.log("  ours:", x.slice(0, 300));
    for (const x of onlyGit.slice(0, 3)) console.log("  git: ", x.slice(0, 300));
    if (onlyMine.length || onlyGit.length || !headSame) process.exitCode = 1;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
main();
