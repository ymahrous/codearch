import type { ReactNode } from "react";
import { formatDay } from "@/lib/format";
import { Container } from "./container";

export interface TocItem {
  id: string;
  label: string;
}

/** Layout for long-form text pages (methodology, legal). */
export function ProsePage({
  eyebrow,
  title,
  intro,
  updated,
  author,
  toc,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  /** Last-updated date as YYYY-MM-DD. */
  updated?: string;
  /** Shown as a byline next to the date. */
  author?: string;
  /** Links to the page's sections, shown under the header. Each id must match an h2 on the page. */
  toc?: readonly TocItem[];
  children: ReactNode;
}) {
  return (
    <Container className="py-12 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <header className="border-b border-border pb-8">
          {eyebrow && <p className="text-sm font-medium text-accent">{eyebrow}</p>}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {intro && <p className="mt-4 text-lg text-fg-muted">{intro}</p>}
          {(updated || author) && (
            <p className="mt-4 text-sm text-fg-subtle">
              {author && <>By {author}</>}
              {author && updated && " · "}
              {updated && (
                <>
                  Last updated <time dateTime={updated}>{formatDay(updated)}</time>
                </>
              )}
            </p>
          )}
        </header>
        {toc && (
          <nav aria-labelledby="toc-title" className="mt-8 rounded-xl border border-border bg-surface p-5">
            <h2 id="toc-title" className="text-sm font-semibold text-fg">
              On this page
            </h2>
            <ol className="mt-3 grid list-decimal gap-x-8 gap-y-1.5 pl-5 text-sm marker:text-fg-subtle sm:grid-cols-2">
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="text-fg-muted underline-offset-2 hover:text-fg hover:underline">
                    {t.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="mt-8 space-y-5 leading-7 text-fg-muted [&_a]:font-medium [&_a]:text-accent [&_a]:underline [&_a]:decoration-accent/40 [&_a]:underline-offset-2 [&_a:hover]:decoration-accent [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-fg [&_h2]:pt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-fg [&_h3]:pt-2 [&_h3]:font-semibold [&_h3]:text-fg [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_pre]:whitespace-pre-wrap [&_pre]:wrap-anywhere [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-surface-2 [&_pre]:p-4 [&_pre]:text-[13px] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:text-fg [&_table]:w-full [&_table]:text-sm [&_td]:border-t [&_td]:border-border [&_td]:py-2.5 [&_td]:pr-4 [&_td]:align-top [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-medium [&_th]:text-fg [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </div>
      </article>
    </Container>
  );
}

/** A table inside a prose page that scrolls sideways on narrow screens instead of widening the page. */
export function ProseTable({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    // Focusable so keyboard users can scroll it; labelled by its caption.
    <div className="overflow-x-auto rounded-lg border border-border px-4" tabIndex={0} role="region" aria-label={caption}>
      <table className="min-w-xl">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}
