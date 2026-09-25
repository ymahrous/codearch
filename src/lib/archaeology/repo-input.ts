export const ALLOWED_HOSTS = ["github.com", "gitlab.com", "codeberg.org"] as const;
export type RepoHost = (typeof ALLOWED_HOSTS)[number];

export interface RepoTarget {
  host: RepoHost;
  owner: string;
  repo: string;
  /** owner/repo */
  slug: string;
  /** HTTPS clone URL */
  cloneUrl: string;
  /** Web page for the repo */
  htmlUrl: string;
  /** Path of the report page in this app */
  appPath: string;
}

const SEGMENT = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,99})$/;

/**
 * Accepts `owner/repo`, `https://github.com/owner/repo(.git)`, `github.com/owner/repo`,
 * the same for GitLab and Codeberg, and GitHub URLs with extra path parts
 * (`/tree/main`, `/pulls`). Returns null for anything else.
 */
export function parseRepoInput(input: string | null | undefined): RepoTarget | null {
  let s = (input ?? "").trim();
  if (!s || s.length > 300) return null;
  s = s.replace(/^git@([^:]+):/, "$1/");
  s = s.replace(/^[a-z]+:\/\//i, "").replace(/^www\./i, "");
  s = s.split(/[?#]/)[0].replace(/\/+$/, "");
  let host: RepoHost = "github.com";
  const matched = ALLOWED_HOSTS.find((h) => s.toLowerCase().startsWith(h + "/"));
  if (matched) {
    host = matched;
    s = s.slice(matched.length + 1);
  } else if (/^[^/]+\.[a-z]{2,}\//i.test(s)) return null; // some other host
  const parts = s.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  if (!SEGMENT.test(owner) || !SEGMENT.test(repo) || repo.includes("..") || owner.includes("..")) return null;
  const slug = `${owner}/${repo}`;
  return {
    host,
    owner,
    repo,
    slug,
    cloneUrl: `https://${host}/${slug}.git`,
    htmlUrl: `https://${host}/${slug}`,
    appPath: host === "github.com" ? `/${slug}` : `/${slug}?host=${host}`,
  };
}
