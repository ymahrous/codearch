import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { ProsePage } from "@/components/ui/prose";
import { LOG_COMMAND } from "@/lib/archaeology/log-format";
import { breadcrumbNode, graph, pageMetadata, webPageNode } from "@/lib/seo";
import { CONTENT_UPDATED, site } from "@/lib/site";

const title = "How it works";
const description =
  "How Codebase Archaeology reads a git repository without downloading its code, how rock layers, eras, bus factor and fossils are calculated, and their limits.";

export const metadata = pageMetadata({ title, description, path: "/how-it-works", type: "article" });

export default function HowItWorksPage() {
  return (
    <ProsePage
      eyebrow="Methodology"
      title={title}
      intro="What we download, how each number is calculated, and where the analysis has limits."
      author={site.author}
      updated={CONTENT_UPDATED}
    >
      <JsonLd
        data={graph(
          webPageNode({ path: "/how-it-works", title, description, type: "TechArticle", dateModified: CONTENT_UPDATED, author: true }),
          breadcrumbNode([
            ["Home", "/"],
            [title, "/how-it-works"],
          ]),
        )}
      />

      <h2 id="fetching">How does it read a repository?</h2>
      <p>
        {site.name} reads a repository&apos;s history over git&apos;s own{" "}
        <a href="https://git-scm.com/docs/protocol-v2">HTTP protocol (version 2)</a>, without cloning it. The server asks the git host for a{" "}
        <a href="https://git-scm.com/docs/partial-clone">blob-less</a> copy of the default branch: every commit and every folder listing,
        but no file contents. That keeps downloads small (a few megabytes for most projects) and means we never see your code.
      </p>
      <p>
        The download is decoded in TypeScript, without a git program, and turned into the same list of changed files per commit that{" "}
        <a href="https://git-scm.com/docs/git-log">
          <code>git log --name-status</code>
        </a>{" "}
        would print. Nothing is written to disk; only the finished report is kept, in a cache, for up to six hours.
      </p>

      <h2 id="metrics">What do the metrics mean?</h2>
      <h3>How are the rock layers drawn?</h3>
      <p>
        Each rock layer is one calendar year (UTC) of commits, with the newest year on top. A layer&apos;s thickness grows with the square
        root of its commit count, so busy years stand out without flattening quiet ones. The colored segments are the eight most active
        people across the whole history; everyone else is grey. Bots are never counted among them.
      </p>
      <h3>What is an era?</h3>
      <p>
        An era is a run of consecutive years in which the same person made the most commits. We find each year&apos;s leader, join the years
        they led in a row, and show eras that last two or more years, or single years where the leader made over 30% of commits.
      </p>
      <h3>What is a bus factor?</h3>
      <p>
        A folder&apos;s <a href="https://en.wikipedia.org/wiki/Bus_factor">bus factor</a> is the smallest number of people who together made
        at least half of the commits touching it. A bus factor of 1 on a folder with several contributors means one person holds most of its
        history. A commit counts toward every folder it touches, and a folder&apos;s <strong>main owner</strong> is whoever made the most of
        those commits. Folders are <strong>active</strong> if touched within a year of the latest commit, <strong>quiet</strong> within
        three years, and <strong>fossils</strong> after that.
      </p>
      <h3>What is the fossil record?</h3>
      <p>
        The fossil record lists the oldest files still in the repository and the files left untouched the longest. We replay every commit in
        order, tracking when each file was added and last changed, then keep the files that still exist at the latest commit.
      </p>

      <h2 id="limits">What are the known limits?</h2>
      <ul>
        <li>Renames are treated as a delete plus an add, so a renamed file&apos;s age starts at the rename.</li>
        <li>Merge commits count toward activity but carry no file changes, matching git&apos;s default output.</li>
        <li>Authors are grouped by name, ignoring letter case. Two spellings of one person&apos;s name appear as two people.</li>
        <li>Only the default branch is analyzed. Very large repositories are refused to keep the service fast for everyone.</li>
      </ul>

      <h2 id="paste">Can it analyze private repositories?</h2>
      <p>
        Yes. <Link href="/analyze">Paste mode</Link> runs the same analysis in your browser, on the output of this command run inside your
        repository, and never uploads it:
      </p>
      <pre>
        <code>{LOG_COMMAND}</code>
      </pre>

      <h2 id="api">Is there an API?</h2>
      <p>Yes. Every report is available as JSON:</p>
      <pre>
        <code>{`GET /api/dig?repo=expressjs/express

200  { "report": { ... }, "meta": { ... }, "cached": true }
4xx  { "error": { "code": "not_found", "message": "..." } }`}</code>
      </pre>
      <p>
        <code>repo</code> accepts <code>owner/name</code> or a full GitHub, GitLab or Codeberg URL. Add <code>refresh=1</code> to bypass the
        cache. New analyses are rate limited per IP address; the <code>RateLimit-*</code> response headers show your remaining allowance.
        Cached reports don&apos;t count toward the limit. A summary for AI assistants is published at <a href="/llms.txt">/llms.txt</a>.
      </p>
    </ProsePage>
  );
}
