# Codebase Archaeology

> Every repository is a dig site.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React 19](https://img.shields.io/badge/React-19-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)

**Codebase Archaeology** turns the history of any public git repository into an interactive
report: commit activity drawn as rock layers, the eras each maintainer led, who owns every
folder today (with bus factor), and the oldest files still standing.

It runs on Vercel with zero configuration: no `git` binary, Docker image or external service is
required. Private repositories are supported through a paste mode that runs entirely in the
browser.

---

## Contents

- [Features](#features)
- [How it works](#how-it-works)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [API](#api)
- [Project structure](#project-structure)
- [Quality standards](#quality-standards)
- [Known limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

## Features

|                             |                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rock layers**             | One band per year, thickness scaled by commit volume, colored by the people who made those commits. Also available as an accessible table.  |
| **Eras**                    | Consecutive years led by the same maintainer, with their share of commits.                                                                  |
| **Ownership & bus factor**  | Main owner of each folder (one or two levels deep), bus factor, activity status, with sorting, filtering and a bot toggle.                  |
| **Fossil record**           | The oldest surviving files and the files left untouched the longest.                                                                        |
| **Notable finds**           | First commit, longest silence, biggest commit, busiest day, peak hour, one-time contributors, automation share.                             |
| **Paste mode**              | Analyze private or internal repositories from a local `git log`; nothing leaves the browser.                                                |
| **Shareable & cached**      | Every report has its own URL and Open Graph image, and is cached so repeat visits are instant.                                              |
| **Privacy-first analytics** | Optional Vercel Web Analytics that loads only after the visitor allows it, via an accessible consent banner. Honors Global Privacy Control. |

Supported hosts: **GitHub**, **GitLab** and **Codeberg**.

## How it works

```
Browser ──► /[owner]/[repo] page ──► GET /api/dig?repo=owner/name
                                        │
                                        ├─ GitHub API: exists? public? under the size limit?
                                        ├─ git smart-HTTP v2 (pure TypeScript, src/lib/git):
                                        │    ls-refs → HEAD, fetch with `filter blob:none`
                                        │    → packfile of commits + trees only (no file contents)
                                        ├─ decode pack, resolve deltas, diff trees per commit
                                        │    (identical to `git log --no-renames --name-status`)
                                        ├─ analyze → ~25 KB JSON report
                                        └─ cache (in memory, or Upstash Redis when configured)
```

Vercel's serverless functions don't ship a `git` executable, so the app implements git's wire
protocol itself. Only commits and folder listings are downloaded, never file contents, which
keeps transfers small and means source code is never seen. `npm run verify:git -- owner/repo`
compares the output against the real git CLI; it matches exactly on express, flask, jquery,
svelte, nuxt and the test fixture.

**Paste mode** (`/analyze`) handles private repositories: users run one command locally, then
paste or drop the output, and the same analyzer runs in the browser.

A full explanation of each metric is published on the site at `/how-it-works`.

## Getting started

**Prerequisites:** Node.js 20.9 or later (22 recommended, see `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # optional; every setting has a default
npm run dev
```

Open <http://localhost:3000> and try <http://localhost:3000/expressjs/express>.

To run a production build locally:

```bash
npm run build
npm start
```

## Scripts

| Command                            | Description                                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| `npm run dev`                      | Start the development server                                                            |
| `npm run build` / `npm start`      | Build and serve the production app                                                      |
| `npm run lint`                     | ESLint (Next.js core-web-vitals + TypeScript rules)                                     |
| `npm run typecheck`                | Generate route types and run `tsc`                                                      |
| `npm run format` / `format:check`  | Format with Prettier / verify formatting                                                |
| `npm test`                         | All Vitest suites (unit, integration, components)                                       |
| `npm run test:unit`                | Parsers, analyzer, packfile, pkt-line, store, rate limiter                              |
| `npm run test:integration`         | Real git server (`git upload-pack`) → fetcher → API route                               |
| `npm run test:components`          | React components in jsdom with Testing Library                                          |
| `npm run test:coverage`            | All Vitest suites with coverage                                                         |
| `npm run test:e2e`                 | Playwright against the production build, desktop and mobile (run `npm run build` first) |
| `npm run verify:git -- owner/repo` | Cross-check the TypeScript git reader against the git CLI                               |
| `npm run check`                    | Lint + typecheck + tests                                                                |

Integration tests need `git` installed locally and make no network requests. End-to-end tests
mock the API by default; set `E2E_LIVE=1` to also run one test against real GitHub. To use a
preinstalled Chromium instead of `npx playwright install`, set `PW_CHROMIUM_PATH`.

## Configuration

Every variable is optional. See [`.env.example`](.env.example).

| Variable                                  | Default       | Purpose                                                                                                                                                                        |
| ----------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GITHUB_TOKEN`                            | –             | GitHub token (no permissions needed) for repository metadata and size checks. Raises the limit from 60 to 5,000 lookups per hour.                                              |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN`       | –             | Shared cache and rate limit across instances. `KV_REST_API_URL` / `_TOKEN` are also accepted.                                                                                  |
| `MAX_REPO_MB`                             | `400`         | Refuse GitHub repositories larger than this (GitHub-reported size)                                                                                                             |
| `MAX_PACK_MB`                             | `200`         | Abort history downloads larger than this                                                                                                                                       |
| `FETCH_TIMEOUT_SECONDS`                   | `120`         | Give up on slow git hosts                                                                                                                                                      |
| `CACHE_TTL_MINUTES`                       | `360`         | How long reports are reused                                                                                                                                                    |
| `DIGS_PER_WINDOW` / `RATE_WINDOW_MINUTES` | `12` / `15`   | New analyses allowed per IP per window. Cached reports are free; `0` disables the limit.                                                                                       |
| `NEXT_PUBLIC_SITE_URL`                    | Vercel domain | Canonical URLs, sitemap and Open Graph                                                                                                                                         |
| `NEXT_PUBLIC_REPO_URL`                    | placeholder   | Your repository's URL. Used for the "Source code" links and, on every legal page, as the contact point (`/issues`) and security reporting channel. **Set this before launch.** |

## Deployment

### Vercel (recommended)

1. Push the repository to GitHub and choose **Add New → Project** in Vercel. The Next.js preset
   is detected automatically; no build settings are needed.
2. Under **Project → Settings → Environment Variables**, set:
   - `GITHUB_TOKEN`: a fine-grained token with no permissions (public data only).
   - `NEXT_PUBLIC_REPO_URL`: the URL of your repository.
   - `NEXT_PUBLIC_SITE_URL`: only when using a custom domain.
3. Add **Upstash Redis** from the Vercel Marketplace (free tier) and connect it to the project.
   It sets `KV_REST_API_URL` / `KV_REST_API_TOKEN`, which the app picks up automatically. Without
   it, each function instance keeps its own cache and rate-limit counters, which reset whenever
   the instance is recycled.
4. Enable **Web Analytics** under **Project → Analytics** and redeploy. The analytics script only
   loads for visitors who choose **Allow analytics** in the cookie banner.
5. On GitHub, turn on **Issues** and **Private vulnerability reporting** (Settings → Security).
   The legal pages send questions to the issue tracker and security reports to the private form.

`/api/dig` declares `maxDuration = 300`, within the Hobby plan's limit. Typical analyses take
1–7 seconds, and successful responses are also cached at Vercel's CDN for 5 minutes.

### Any Node.js host

```bash
npm ci && npm run build && npm start
```

## API

Reports are available as JSON:

```http
GET /api/dig?repo=expressjs/express
```

```jsonc
// 200 OK
{ "report": { /* ... */ }, "meta": { /* ... */ }, "cached": true }

// 4xx / 5xx
{ "error": { "code": "not_found", "message": "..." } }
```

- `repo` accepts `owner/name` or a full GitHub, GitLab or Codeberg URL.
- `refresh=1` bypasses the cache.
- New analyses are rate limited per IP; the `RateLimit-*` response headers show the remaining
  allowance. Cached reports don't count toward the limit.
- Error codes: `invalid_input`, `not_found`, `private`, `empty`, `too_large`, `timeout`,
  `unsupported`, `upstream`, `rate_limited`, `internal`.

A health check is available at `GET /api/health`.

## Project structure

```
src/
  app/                      Routes (App Router)
    page.tsx                Home
    [owner]/[repo]/         Report page + per-repository Open Graph image
    analyze/                Paste mode
    how-it-works/           Methodology
    privacy/, terms/, cookies/, accessibility/   Legal pages and accessibility statement
    api/dig/route.ts        Report API
    api/health/route.ts     Health check
    sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx, icon.svg, apple-icon.tsx
    not-found.tsx, error.tsx, global-error.tsx
  components/
    consent/                Cookie banner, consent-gated analytics, preference switch
    layout/                 Header, footer, logo, theme toggle
    report/                 Report view, strata chart, ownership table, loading/error states
    paste/, search/, ui/    Paste analyzer, repository search, design-system primitives
  lib/
    git/                    pkt-line, packfile reader, tree diffs, smart-HTTP client
    archaeology/            Log parser, analyzer, repository input parsing, types
    consent.ts              Analytics consent store (local storage, 12-month expiry, GPC)
    server/                 Config (zod), store (memory/Upstash), rate limit, GitHub lookup, excavate
tests/
  unit/, integration/, components/, e2e/, support/
scripts/verify-remote.ts    Compare against the git CLI
```

## Quality standards

- **Accessibility:** targets WCAG 2.2 AA (see the [accessibility statement](src/app/accessibility/page.tsx)):
  skip link, landmarks, labelled controls, visible focus, `aria-sort` on sortable columns, chart
  available as a table, keyboard-reachable chart rows, reduced-motion support, AA contrast in both
  themes, reflow at 320px. axe-core checks every page in both themes in CI (`tests/e2e/a11y.spec.ts`).
- **Privacy:** no cookies set by the app; analytics is opt-in, cookieless and withdrawable at any
  time on `/cookies`; paste mode never uploads data.
- **SEO:** per-page titles and descriptions, canonical URLs, Open Graph and Twitter cards with
  generated images, `sitemap.xml`, `robots.txt` (API disallowed), web app manifest and icons.
- **Security:** Content-Security-Policy, HSTS, `X-Frame-Options: DENY`, `nosniff`, strict
  referrer policy, Permissions-Policy, no `X-Powered-By`; strictly validated input;
  size- and time-limited downloads; per-IP rate limiting.
- **UX:** light/dark/system theme without flash, responsive down to 320px, loading and error
  states with recovery actions, custom 404 and error pages.
- **Engineering:** strict TypeScript, ESLint, Prettier, and CI on every push and pull request
  ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Known limitations

- Renames count as a delete plus an add, so a renamed file's age starts at the rename.
- Merge commits count toward activity but list no files (git's default).
- Authors are grouped by name, ignoring case; different spellings stay separate. `.mailmap` isn't
  applied for online analyses (paste mode's `%aN` does apply it).
- Folder status and file ages are measured from the repository's latest commit, not today's date.
- Only the default branch is analyzed. SHA-256 repositories aren't supported.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the development
setup, coding standards, testing requirements and pull request process.

The privacy policy, terms and conditions, cookie policy and accessibility statement (in
`src/app/`, dated in `LEGAL_UPDATED` in `src/lib/site.ts`) describe this deployment, operated by
Yousef Mahrous. If you run your own instance, update the operator and review them for your
situation: they are a starting point, not legal advice.

## License

Released under the [MIT License](LICENSE). Copyright © 2026 Yousef Mahrous.

Codebase Archaeology is not affiliated with GitHub, GitLab or Codeberg. Repository names and
content belong to their respective owners.
