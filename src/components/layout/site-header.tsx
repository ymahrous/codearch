"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import { nav, site } from "@/lib/site";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

function GithubIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  // The menu remembers which page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (fn: (o: boolean) => boolean) => setOpenOn(fn(open) ? pathname : null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => !href.includes("#") && pathname === href;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70 transition-colors",
        scrolled ? "border-border" : "border-transparent",
      )}
    >
      <Container className="flex h-16 items-center gap-6">
        <Link href="/" className="rounded-md" aria-label={`${site.name} home`}>
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition-colors",
                    isActive(item.href) ? "text-fg" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <a
            href={site.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden size-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg sm:inline-flex"
            aria-label="Source code on GitHub (opens in a new tab)"
          >
            <GithubIcon className="size-4" />
          </a>
          <ThemeToggle />
          <ButtonLink href="/#analyze" size="sm" className="ml-2 max-sm:hidden">
            Analyze a repo
          </ButtonLink>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </Container>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-border bg-bg md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-2.5 text-fg hover:bg-surface-2">
                {item.label}
              </Link>
            ))}
            <ButtonLink href="/#analyze" className="mt-2">
              Analyze a repo
            </ButtonLink>
          </Container>
        </nav>
      )}
    </header>
  );
}

export { GithubIcon };
