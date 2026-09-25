import { HOME_FAQ } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";
import { EXAMPLES, site } from "@/lib/site";

export const dynamic = "force-static";

/** A plain-markdown guide to the site for AI assistants and answer engines (https://llmstxt.org). */
export function GET() {
  const body = `# ${site.name}

> ${site.description}

${site.name} is a free, open-source web app by ${site.author}. It reads a repository's history over git's HTTP protocol (version 2) and downloads only commits and folder listings, never file contents. Reports are cached for up to six hours. Private repositories can be analyzed in the browser from a pasted \`git log\`, which is never uploaded.

Supported hosts: GitHub, GitLab and Codeberg (public repositories only).

## Pages

- [Home](${absoluteUrl("/")}): search for a repository, see an example report and answers to common questions
- [How it works](${absoluteUrl("/how-it-works")}): how repositories are read, how every metric is calculated, and known limits
- [Paste mode](${absoluteUrl("/analyze")}): analyze a private repository from its git log, entirely in the browser
- [About](${absoluteUrl("/about")}): who makes the site and how it's built

## Reports

A report for any public repository is at \`${absoluteUrl("/")}{owner}/{repo}\` (GitHub). For GitLab or Codeberg, add \`?host=gitlab.com\` or \`?host=codeberg.org\`. Each report shows commits per year (rock layers), eras led by one maintainer, folder ownership with bus factor, the oldest surviving files, and a summary with direct answers about the repository.

${EXAMPLES.map((e) => `- [${e.slug}](${absoluteUrl(`/${e.slug}`)}): ${e.blurb}`).join("\n")}

## API

\`GET ${absoluteUrl("/api/dig")}?repo={owner}/{repo}\` returns the report as JSON: \`{ "report": { ... }, "meta": { ... }, "cached": true }\`. \`repo\` also accepts a full GitHub, GitLab or Codeberg URL. New analyses are rate limited per IP address; cached reports are not. Errors are \`{ "error": { "code", "message" } }\`.

## Definitions

- Rock layers: one layer per calendar year (UTC) of commits, newest on top; thickness grows with the square root of the commit count.
- Era: a run of consecutive years in which the same person made the most commits.
- Bus factor: the smallest number of people who together made at least half of the commits touching a folder.
- Fossil record: the oldest files still present, and the files left untouched the longest.

## FAQ

${HOME_FAQ.map((qa) => `### ${qa.question}\n\n${qa.answer}`).join("\n\n")}

## Optional

- [Privacy policy](${absoluteUrl("/privacy")})
- [Terms and conditions](${absoluteUrl("/terms")})
- [Cookie policy](${absoluteUrl("/cookies")})
- [Accessibility statement](${absoluteUrl("/accessibility")})
- [Source code](${site.repoUrl}) (MIT License)
`;
  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
