export const site = {
  name: "Codebase Archaeology",
  shortName: "Archaeology",
  tagline: "Every repository is a dig site.",
  description:
    "Explore any public git repository's history: commit activity as rock layers, the eras each maintainer led, who owns every folder, and the oldest files still standing.",
  repoUrl: process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/your-org/codebase-archaeology",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
};

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
