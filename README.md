# Codebase Archaeology

Explore any public git repository's history: commit activity drawn as rock layers, the eras each
maintainer led, who owns every folder (with bus factor), and the oldest files still standing.

Built with **Next.js 16** (App Router), React 19, Tailwind CSS 4 and TypeScript. Deploys to
**Vercel** with zero configuration: no git binary, Docker image or external service required.

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
                                        └─ cache (memory, or Upstash Redis when configured)
```

Vercel's serverless functions don't ship a `git` executable, so the app speaks git's wire protocol
itself. `npm run verify:git -- owner/repo` compares its output with the real git CLI; it matches
exactly on express, flask, jquery, svelte, nuxt and the test fixture.

Private repositories are handled by **paste mode** (`/analyze`): users export their log with one
command and it's analyzed entirely in the browser.

## Getting started

Requires Node.js 20.9+ (22 recommended, see `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # optional; everything has defaults
npm run dev                  # http://localhost:3000
```

Try `http://localhost:3000/expressjs/express`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | Generates route types and runs `tsc` |
| `npm test` | All Vitest suites (unit, integration, components) |
| `npm run test:unit` | Pure logic: parsers, analyzer, packfile, pkt-line, store, rate limiter |
| `npm run test:integration` | Real git server (`git upload-pack`) → fetcher → API route |
| `npm run test:components` | React components in jsdom with Testing Library |
| `npm run test:coverage` | All Vitest suites with coverage (currently ~91% statements) |
| `npm run test:e2e` | Playwright against the production build, desktop + mobile (run `npm run build` first) |
| `npm run verify:git -- owner/repo` | Cross-check the TypeScript git reader against the git CLI (needs git + network) |
| `npm run check` | Lint + typecheck + tests |

The integration tests need `git` installed locally (it's used to build and serve a fixture repo);
they make no network requests. E2E tests mock the API by default; set `E2E_LIVE=1` to also run one
test against real GitHub. To use a preinstalled Chromium instead of `npx playwright install`, set
`PW_CHROMIUM_PATH`.

## Deploying to Vercel

1. Push this repository to GitHub and click **Add New → Project** in Vercel. The Next.js preset is
   detected automatically; no build settings are needed.
2. Recommended environment variables (Project → Settings → Environment Variables):
   - `GITHUB_TOKEN`: a fine-grained token with **no permissions** (public data only). Raises the
     GitHub metadata lookup from 60 to 5,000 requests per hour.
   - `NEXT_PUBLIC_REPO_URL`: your repository URL, used by the header and footer links.
   - `NEXT_PUBLIC_SITE_URL`: only if you use a custom domain and want it in canonical links
     (defaults to the Vercel production domain).
3. Recommended: add **Upstash Redis** from the Vercel Marketplace (free tier) and connect it to the
   project. It sets `KV_REST_API_URL` / `KV_REST_API_TOKEN`, which the app picks up automatically.
   Without it, each function instance keeps its own cache and rate-limit counters, which reset
   whenever Vercel scales the instance down.

`/api/dig` declares `maxDuration = 300`, within the Hobby plan's limit. Typical analyses take
1–7 seconds; successful responses are also cached at Vercel's CDN for 5 minutes.

The app also runs anywhere Node.js does (`npm run build && npm start`).

## Configuration

All optional. See `.env.example`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | – | GitHub API token for repo metadata and size checks |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | – | Shared cache + rate limit (also reads `KV_REST_API_URL` / `_TOKEN`) |
| `MAX_REPO_MB` | 400 | Refuse GitHub repos larger than this (GitHub-reported size) |
| `MAX_PACK_MB` | 200 | Abort downloads of commit history larger than this |
| `FETCH_TIMEOUT_SECONDS` | 120 | Give up on slow git hosts |
| `CACHE_TTL_MINUTES` | 360 | How long reports are reused |
| `DIGS_PER_WINDOW` / `RATE_WINDOW_MINUTES` | 12 / 15 | New analyses per IP per window (cached reports are free; 0 disables) |
| `NEXT_PUBLIC_SITE_URL` | Vercel domain | Canonical URLs, sitemap, Open Graph |
| `NEXT_PUBLIC_REPO_URL` | placeholder | "Source code" links |

## Project structure

```
src/
  app/                      Routes (App Router)
    page.tsx                Home
    [owner]/[repo]/         Report page + per-repo Open Graph image
    analyze/                Paste mode
    how-it-works/, privacy/, terms/
    api/dig/route.ts        Report API
    api/health/route.ts     Health check
    sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx, icon.svg, apple-icon.tsx
    not-found.tsx, error.tsx, global-error.tsx
  components/
    layout/                 Header, footer, logo, theme toggle
    report/                 Report view, strata chart, ownership table, loading/error states
    paste/, search/, ui/    Paste analyzer, repo search, design-system primitives
  lib/
    git/                    pkt-line, packfile reader, tree diffs, smart-HTTP client
    archaeology/            Log parser, analyzer, repo input parsing, types
    server/                 Config (zod), store (memory/Upstash), rate limit, GitHub lookup, excavate
tests/
  unit/, integration/, components/, e2e/, support/
scripts/verify-remote.ts    Compare against the git CLI
```

## Standards checklist

- **Accessibility:** skip link, landmarks, labelled controls, visible focus, `aria-sort` on
  sortable columns, chart available as a table, keyboard-reachable chart rows, reduced-motion support.
- **SEO:** per-page titles and descriptions, canonical URLs, Open Graph and Twitter cards with
  generated images, `sitemap.xml`, `robots.txt` (API disallowed), web app manifest and icons.
- **Security:** Content-Security-Policy, HSTS, `X-Frame-Options: DENY`, `nosniff`, strict referrer
  policy, Permissions-Policy, no `X-Powered-By`; repo input is strictly validated; downloads are
  size- and time-limited; per-IP rate limiting.
- **UX:** light/dark/system theme without flash, responsive down to 360px, loading and error
  states with recovery actions, 404 and error pages.
- **Quality:** strict TypeScript, ESLint, Prettier, CI on every push and pull request (`.github/workflows/ci.yml`).

## Before you launch

- Review `src/app/privacy/page.tsx` and `src/app/terms/page.tsx`. They describe what this code
  does, but they're a starting point, not legal advice.
- Set `NEXT_PUBLIC_REPO_URL`, and add a `LICENSE` file if you're open-sourcing the project.

## Known limits

- Renames count as delete + add, so a renamed file's age starts at the rename.
- Merge commits count toward activity but list no files (git's default).
- Authors are grouped by name, ignoring case; different spellings stay separate. `.mailmap` isn't
  applied for online analyses (paste mode's `%aN` does apply it).
- Only the default branch is analyzed. SHA-256 repositories aren't supported.
