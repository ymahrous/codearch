import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ui/prose";
import { LOG_COMMAND } from "@/lib/archaeology/log-format";

export const metadata: Metadata = {
  title: "How it works",
  description: "How Codebase Archaeology reads a repository's history, and how each metric is calculated.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <ProsePage
      eyebrow="Methodology"
      title="How it works"
      intro="What we download, how each number is calculated, and where the analysis has limits."
    >
      <h2 id="fetching">Reading a repository</h2>
      <p>
        When you enter a public repository, the server talks to the git host using git&apos;s own HTTP protocol (version 2) and asks for a{" "}
        <strong>blob-less</strong> copy of the default branch: every commit and every folder listing, but no file contents. That keeps
        downloads small (a few megabytes for most projects) and means we never see your code.
      </p>
      <p>
        The download is decoded in TypeScript, without a git program, and turned into the same list of changed files per commit that{" "}
        <code>git log --name-status</code> would print. Nothing is written to disk; only the finished report is kept, in a cache, for up to
        six hours.
      </p>

      <h2 id="metrics">The metrics</h2>
      <h3>Rock layers</h3>
      <p>
        One layer per calendar year (UTC), newest on top. A layer&apos;s thickness grows with the square root of its commit count, so busy
        years stand out without flattening quiet ones. The colored segments are the eight most active people across the whole history;
        everyone else is grey. Bots are never counted among them.
      </p>
      <h3>Eras</h3>
      <p>
        For each year we find the person with the most commits. Consecutive years led by the same person form an era; we show eras that last
        two or more years, or single years where the leader made over 30% of commits.
      </p>
      <h3>Ownership and bus factor</h3>
      <p>
        A commit counts toward every folder it touches. A folder&apos;s <strong>main owner</strong> is whoever made the most of those
        commits. Its <strong>bus factor</strong> is the smallest number of people who together made at least half of them. A bus factor of 1
        on a folder with several contributors means one person holds most of its history. Folders are <strong>active</strong> if touched
        within a year of the latest commit, <strong>quiet</strong> within three years, and <strong>fossils</strong> after that.
      </p>
      <h3>Fossil record</h3>
      <p>
        We replay every commit in order, tracking when each file was added and last changed, then keep the files that still exist at the
        latest commit.
      </p>

      <h2 id="limits">Known limits</h2>
      <ul>
        <li>Renames are treated as a delete plus an add, so a renamed file&apos;s age starts at the rename.</li>
        <li>Merge commits count toward activity but carry no file changes, matching git&apos;s default output.</li>
        <li>Authors are grouped by name, ignoring letter case. Two spellings of one person&apos;s name appear as two people.</li>
        <li>Only the default branch is analyzed. Very large repositories are refused to keep the service fast for everyone.</li>
      </ul>

      <h2 id="paste">Private repositories</h2>
      <p>
        <Link href="/analyze">Paste mode</Link> runs the same analysis in your browser on the output of this command, run inside your
        repository:
      </p>
      <pre>
        <code>{LOG_COMMAND}</code>
      </pre>

      <h2 id="api">API</h2>
      <p>Reports are available as JSON:</p>
      <pre>
        <code>{`GET /api/dig?repo=expressjs/express

200  { "report": { ... }, "meta": { ... }, "cached": true }
4xx  { "error": { "code": "not_found", "message": "..." } }`}</code>
      </pre>
      <p>
        <code>repo</code> accepts <code>owner/name</code> or a full GitHub, GitLab or Codeberg URL. Add <code>refresh=1</code> to bypass the
        cache. New analyses are rate limited per IP address; the <code>RateLimit-*</code> response headers show your remaining allowance.
        Cached reports don&apos;t count toward the limit.
      </p>
    </ProsePage>
  );
}
