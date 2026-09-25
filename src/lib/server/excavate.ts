import "server-only";
import { analyze } from "@/lib/archaeology/analyze";
import { parseRepoInput } from "@/lib/archaeology/repo-input";
import type { DigResponse, RepoMeta, Report } from "@/lib/archaeology/types";
import { readRemoteHistory, RemoteError, type FetchLike } from "@/lib/git/remote";
import { config } from "./config";
import { AppError } from "./errors";
import { githubRepoInfo } from "./github";
import { getStore } from "./store";

interface Cached {
  report: Report;
  meta: RepoMeta;
}

const inflight = new Map<string, Promise<Cached>>();

export const cacheKey = (host: string, slug: string) => `report:v1:${host}/${slug}`.toLowerCase();

/** The cached report for a repository, if there is one. Never starts an analysis. */
export async function cachedDig(input: string): Promise<DigResponse | null> {
  const t = parseRepoInput(input);
  if (!t) return null;
  try {
    const hit = await getStore().get<Cached>(cacheKey(t.host, t.slug));
    return hit ? { ...hit, cached: true } : null;
  } catch {
    return null;
  }
}

export const isCached = async (input: string) => !!(await cachedDig(input));

export interface ExcavateOptions {
  refresh?: boolean;
  /** Injected in tests to point at a local git server. */
  fetch?: FetchLike;
  /** Overrides the clone URL (tests). */
  cloneUrl?: string;
  /** Skip the GitHub API lookup (tests, non-GitHub hosts). */
  skipPreflight?: boolean;
  onTiming?: (phase: string, ms: number) => void;
}

/** Fetches, analyzes and caches a repository's history. */
export async function excavate(input: string, opts: ExcavateOptions = {}): Promise<DigResponse> {
  const target = parseRepoInput(input);
  if (!target) {
    throw new AppError("invalid_input", "Enter a repository as owner/name, or paste its GitHub, GitLab or Codeberg URL.");
  }
  const cfg = config();
  const store = getStore();
  const key = cacheKey(target.host, target.slug);

  if (!opts.refresh) {
    const hit = await store.get<Cached>(key).catch(() => null);
    if (hit) return { ...hit, cached: true };
  }

  let job = inflight.get(key);
  if (!job) {
    job = (async () => {
      let meta: RepoMeta = { htmlUrl: target.htmlUrl };
      let name = target.slug;
      if (target.host === "github.com" && !opts.skipPreflight) {
        const info = await githubRepoInfo(target.owner, target.repo, {
          token: cfg.githubToken,
          maxRepoMb: cfg.maxRepoMb,
          fetch: opts.fetch,
        });
        if (info) {
          name = info.fullName;
          meta = {
            htmlUrl: `https://github.com/${info.fullName}`,
            description: info.description,
            stars: info.stars,
            defaultBranch: info.defaultBranch,
          };
        }
      }
      let history;
      try {
        history = await readRemoteHistory(opts.cloneUrl ?? target.cloneUrl, {
          fetch: opts.fetch,
          timeoutMs: cfg.fetchTimeoutMs,
          maxPackBytes: cfg.maxPackBytes,
          onTiming: opts.onTiming,
        });
      } catch (e) {
        throw toAppError(e, target.slug);
      }
      const t0 = Date.now();
      const report = analyze(history.commits, { name, source: "git", head: history.headFiles });
      opts.onTiming?.("analyze", Date.now() - t0);
      const value = { report, meta };
      await store.set(key, value, cfg.cacheTtlSeconds).catch(() => undefined);
      return value;
    })().finally(() => inflight.delete(key));
    inflight.set(key, job);
  }
  return { ...(await job), cached: false };
}

function toAppError(e: unknown, slug: string): AppError {
  if (e instanceof AppError) return e;
  if (e instanceof RemoteError) {
    switch (e.code) {
      case "not_found":
        return new AppError(
          "not_found",
          `We couldn't find a public repository called ${slug}. Check the spelling; private repos aren't supported.`,
        );
      case "empty":
        return new AppError("empty", `${slug} has no commits yet.`);
      case "too_large":
        return new AppError("too_large", `${slug}'s history is too large to analyze here. Use paste mode with a local git log instead.`);
      case "timeout":
        return new AppError("timeout", `Downloading ${slug} took too long. Try again, or use paste mode with a local git log.`);
      case "unsupported":
        return new AppError("unsupported", e.message);
      default:
        return new AppError("upstream", "The git host didn't respond as expected. Try again in a minute.");
    }
  }
  console.error("excavate failed", e);
  return new AppError("internal", "Something went wrong while reading this repository.");
}
