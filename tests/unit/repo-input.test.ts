import { describe, expect, it } from "vitest";
import { parseRepoInput } from "@/lib/archaeology/repo-input";

describe("parseRepoInput", () => {
  it.each([
    ["expressjs/express", "github.com", "expressjs/express"],
    ["  expressjs/express  ", "github.com", "expressjs/express"],
    ["https://github.com/expressjs/express", "github.com", "expressjs/express"],
    ["https://github.com/expressjs/express.git", "github.com", "expressjs/express"],
    ["http://www.github.com/expressjs/express/", "github.com", "expressjs/express"],
    ["github.com/vercel/next.js", "github.com", "vercel/next.js"],
    ["https://github.com/vercel/next.js/tree/canary/packages", "github.com", "vercel/next.js"],
    ["https://github.com/pallets/flask?tab=readme#top", "github.com", "pallets/flask"],
    ["git@github.com:sveltejs/svelte.git", "github.com", "sveltejs/svelte"],
    ["https://gitlab.com/gitlab-org/gitlab-runner", "gitlab.com", "gitlab-org/gitlab-runner"],
    ["codeberg.org/forgejo/forgejo", "codeberg.org", "forgejo/forgejo"],
  ])("accepts %s", (input, host, slug) => {
    const t = parseRepoInput(input);
    expect(t).not.toBeNull();
    expect(t!.host).toBe(host);
    expect(t!.slug).toBe(slug);
    expect(t!.cloneUrl).toBe(`https://${host}/${slug}.git`);
  });

  it.each([
    "",
    "express",
    "/express",
    "https://example.com/owner/repo",
    "bitbucket.org/owner/repo",
    "owner/..",
    "../etc/passwd",
    "owner/repo;rm -rf",
    "own er/repo",
    "-owner/repo",
    "a".repeat(301),
    null,
    undefined,
  ])("rejects %s", (input) => {
    expect(parseRepoInput(input as string)).toBeNull();
  });

  it("builds the app path, adding the host for non-GitHub repos", () => {
    expect(parseRepoInput("a/b")!.appPath).toBe("/a/b");
    expect(parseRepoInput("gitlab.com/a/b")!.appPath).toBe("/a/b?host=gitlab.com");
  });
});
