import "server-only";
import { AppError } from "./errors";
import type { FetchLike } from "@/lib/git/remote";

export interface GithubRepoInfo {
  fullName: string;
  description: string | null;
  stars: number;
  defaultBranch: string;
  sizeMb: number;
}

/**
 * Looks up a GitHub repo before downloading it: confirms it exists and is public,
 * gets its canonical name and rejects repos above the size limit. Returns null if
 * the API is unavailable (for example rate limited), so the dig can still proceed.
 */
export async function githubRepoInfo(
  owner: string,
  repo: string,
  opts: { token?: string; maxRepoMb: number; fetch?: FetchLike },
): Promise<GithubRepoInfo | null> {
  const doFetch = opts.fetch ?? ((i, init) => fetch(i, init));
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "codebase-archaeology",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let res: Response;
  try {
    res = await doFetch(`https://api.github.com/repos/${owner}/${repo}`, { headers, signal: AbortSignal.timeout(8000) });
  } catch {
    return null;
  }
  if (res.status === 404) {
    throw new AppError(
      "not_found",
      `We couldn't find a public repository called ${owner}/${repo}. Check the spelling; private repos aren't supported.`,
    );
  }
  if (!res.ok) return null;
  const j = (await res.json()) as {
    full_name: string;
    description: string | null;
    stargazers_count: number;
    default_branch: string;
    size: number;
    private: boolean;
  };
  if (j.private) throw new AppError("private", "Private repositories aren't supported. Use paste mode with a local git log instead.");
  const sizeMb = j.size / 1024;
  if (sizeMb > opts.maxRepoMb) {
    throw new AppError(
      "too_large",
      `${j.full_name} is about ${Math.round(sizeMb).toLocaleString("en-US")} MB, above this site's ${opts.maxRepoMb} MB limit. Use paste mode with a local git log instead.`,
    );
  }
  return { fullName: j.full_name, description: j.description, stars: j.stargazers_count, defaultBranch: j.default_branch, sizeMb };
}
