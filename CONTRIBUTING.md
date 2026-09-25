# Contributing to Codebase Archaeology

Thanks for your interest in improving Codebase Archaeology. Bug reports, fixes, new insights and
documentation improvements are all welcome. This guide explains how to get set up and what a
good contribution looks like.

## Ground rules

- Be respectful and constructive. Assume good intent in issues and reviews.
- For anything larger than a small fix, open an issue first to discuss the approach. It saves
  everyone from reworking a pull request.
- Keep pull requests focused: one bug or feature per PR.
- By contributing, you agree that your contributions are licensed under the project's
  [MIT License](LICENSE).

## Reporting bugs

Open an issue and include:

1. What you did (the repository you analyzed, or a minimal pasted log that reproduces it).
2. What you expected to happen, and what happened instead.
3. Browser and OS for UI issues; Node.js version for local or server issues.
4. Any error message, the `Reference:` code from the error page, or relevant console output.

Please **do not** open public issues for security vulnerabilities. Report them privately instead
(see [Security](#security)).

## Suggesting features

Describe the problem you want solved before the solution you have in mind. For new metrics,
explain how the value is calculated and how it should behave on edge cases (empty folders,
merge commits, bots, renamed files).

## Development setup

Requirements: **Node.js 20.9+** (22 recommended, see `.nvmrc`) and **git** (used by the
integration tests to build and serve a fixture repository).

```bash
git clone <your-fork-url>
cd codearch
npm install
cp .env.example .env.local   # optional; every setting has a default
npm run dev                  # http://localhost:3000
```

> This project uses **Next.js 16**, whose APIs and conventions differ from earlier versions.
> Before changing framework-level code (routing, metadata, error boundaries, caching), read the
> relevant guide in `node_modules/next/dist/docs/`.

## Project layout

| Path                   | Contents                                                                       |
| ---------------------- | ------------------------------------------------------------------------------ |
| `src/app/`             | Routes (App Router), API handlers, metadata, error pages                       |
| `src/components/`      | React components: `layout/`, `report/`, `paste/`, `search/`, `ui/`             |
| `src/lib/git/`         | Pure TypeScript git client: pkt-line, packfile reader, tree diffs, smart HTTP  |
| `src/lib/archaeology/` | Log parsing, input parsing and the analysis itself                             |
| `src/lib/server/`      | Server-only code: config, cache store, rate limiting, GitHub lookup            |
| `tests/`               | `unit/`, `integration/`, `components/`, `e2e/`, plus shared `support/` helpers |

The analysis in `src/lib/archaeology/analyze.ts` runs both on the server (public repositories)
and in the browser (paste mode), so it must stay free of Node.js-only APIs.

## Making changes

1. Fork the repository and create a branch from `master`:
   `git checkout -b fix/short-description`
2. Make your change, following the conventions below.
3. Add or update tests that cover it.
4. Run the full check suite (see below) and make sure it passes.
5. Open a pull request.

### Code style

- **TypeScript** in strict mode. Avoid `any`; prefer precise types.
- **Formatting** is handled by Prettier (`npm run format`). Don't hand-format.
- **Linting** uses ESLint with the Next.js core-web-vitals and TypeScript rules.
- **Styling** uses Tailwind CSS 4 with the design tokens in `src/app/globals.css`
  (`bg-surface`, `text-fg-muted`, `border-border`, …). Don't hard-code colors.
- Match the surrounding code: naming, comment density and component structure.
- Server-only modules import `server-only` so they can't leak into client bundles.

### Accessibility, privacy and UX

The site targets WCAG 2.2 AA, and `tests/e2e/a11y.spec.ts` runs axe-core on every page in both
themes. Every UI change should keep the existing standards:

- All controls are reachable and usable by keyboard, with a visible focus state.
- Inputs have labels; icon-only buttons have an `aria-label`.
- Charts have a text or table alternative.
- Layouts work from 320px wide upward, in both light and dark themes.
- Loading, empty and error states are handled, with a way to recover.
- Anything new stored in the browser, or any new third-party script or data processor, is
  documented in the privacy and cookie policies, and optional ones load only after consent.

## Testing

| Command                             | Purpose                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `npm run check`                     | Lint, typecheck and all Vitest suites. **Run before every PR.**               |
| `npm run test:unit`                 | Pure logic: parsers, analyzer, packfile, pkt-line, store, rate limiter        |
| `npm run test:integration`          | A real `git upload-pack` server → fetcher → API route (needs git, no network) |
| `npm run test:components`           | React components in jsdom with Testing Library                                |
| `npm run test:coverage`             | All Vitest suites with a coverage report                                      |
| `npm run build && npm run test:e2e` | Playwright against the production build, desktop and mobile                   |
| `npm run verify:git -- owner/repo`  | Cross-check the TypeScript git reader against the git CLI (needs network)     |

Guidelines:

- Bug fixes should include a test that fails without the fix.
- Changes to the git reader (`src/lib/git/`) should also be checked with
  `npm run verify:git` against at least one real repository.
- E2E tests mock the API by default. Set `E2E_LIVE=1` to include a test against real GitHub.

## Commit messages

Use short, imperative subjects, optionally with a
[Conventional Commits](https://www.conventionalcommits.org/) prefix:

```
fix: keep full file contents when re-analyzing a pasted log
feat: show bus factor trend per year
docs: clarify Upstash setup
```

Explain _why_ in the body when the change isn't obvious.

## Pull request checklist

- [ ] The PR describes what changed and why, and links the related issue.
- [ ] `npm run check` passes locally.
- [ ] New behavior is covered by tests.
- [ ] UI changes include before/after screenshots (desktop and mobile).
- [ ] Documentation (`README.md`, `/how-it-works`) is updated if behavior changed.

CI runs lint, typecheck, all Vitest suites and the Playwright tests on every pull request. A
maintainer will review your PR; please respond to feedback, and don't worry about getting
everything perfect on the first try.

## Security

If you find a security issue (for example a way to bypass input validation, rate limits or the
download size limits), please report it privately through GitHub's **private vulnerability
reporting** (the repository's **Security** tab → **Report a vulnerability**) rather than opening a
public issue. You'll get an acknowledgement, and a fix will be coordinated before any public
disclosure.

## License

Codebase Archaeology is released under the [MIT License](LICENSE). Copyright © 2026 Yousef Mahrous.
