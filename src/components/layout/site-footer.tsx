import Link from "next/link";
import { Container } from "@/components/ui/container";
import { EXAMPLES, site } from "@/lib/site";
import { Logo } from "./logo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/#analyze", label: "Analyze a repository" },
      { href: "/analyze", label: "Paste a local git log" },
      { href: "/#examples", label: "Examples" },
    ],
  },
  {
    title: "Examples",
    links: EXAMPLES.slice(0, 4).map((e) => ({ href: `/${e.slug}`, label: e.slug })),
  },
  {
    title: "Resources",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/how-it-works#api", label: "API" },
      { href: site.repoUrl, label: "Source code", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms and conditions" },
      { href: "/cookies", label: "Cookie policy" },
      { href: "/accessibility", label: "Accessibility" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <Container className="grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm text-fg-muted">{site.description}</p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-xs font-semibold tracking-wider text-fg-subtle uppercase">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  {"external" in l && l.external ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-fg-muted hover:text-fg">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="text-sm break-all text-fg-muted hover:text-fg">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-border">
        <Container className="flex flex-col gap-2 py-5 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.author} · {site.name} is open source under the MIT License
          </p>
          <p>Not affiliated with GitHub, GitLab or Codeberg. Repository names belong to their owners.</p>
        </Container>
      </div>
    </footer>
  );
}
