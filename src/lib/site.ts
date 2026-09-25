const repoUrl = (process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/your-org/codearch").replace(/\/+$/, "");

export const site = {
  name: "Codebase Archaeology",
  shortName: "Archaeology",
  tagline: "Every repository is a dig site.",
  author: "Yousef Mahrous",
  description:
    "See any public git repository's history at a glance: commits as rock layers, the eras each maintainer led, who owns each folder, and the oldest surviving files.",
  repoUrl,
  /** The author's profile: the owner of the repository URL (e.g. https://github.com/ymahrous). */
  authorUrl: repoUrl.split("/").slice(0, 4).join("/"),
  /** Where visitors send questions and privacy, accessibility or legal requests. */
  contactUrl: `${repoUrl}/issues`,
  /** GitHub's private vulnerability reporting form for the repository. */
  securityUrl: `${repoUrl}/security/advisories/new`,
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
};

/** When the methodology and about pages last changed (YYYY-MM-DD). */
export const CONTENT_UPDATED = "2026-09-25";

/** When the privacy policy, terms, cookie policy and accessibility statement last changed (YYYY-MM-DD). */
export const LEGAL_UPDATED = "2026-09-25";

export const nav = [
  { href: "/#examples", label: "Examples" },
  { href: "/analyze", label: "Paste a log" },
  { href: "/how-it-works", label: "How it works" },
] as const;

export const EXAMPLES = [
  { slug: "expressjs/express", blurb: "The Node.js web framework that started in 2009." },
  { slug: "pallets/flask", blurb: "Python's lightweight web framework." },
  { slug: "jquery/jquery", blurb: "Two decades of DOM history." },
  { slug: "sveltejs/svelte", blurb: "A compiler-first UI framework monorepo." },
  { slug: "nuxt/nuxt", blurb: "The Vue meta-framework, 15,000+ commits." },
  { slug: "vuejs/core", blurb: "Vue 3, rewritten from scratch in TypeScript." },
] as const;
