import type { ReactNode } from "react";
import { Container } from "./container";

/** Layout for long-form text pages (methodology, legal). */
export function ProsePage({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <Container className="py-12 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <header className="border-b border-border pb-8">
          {eyebrow && <p className="text-sm font-medium text-accent">{eyebrow}</p>}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {intro && <p className="mt-4 text-lg text-fg-muted">{intro}</p>}
          {updated && <p className="mt-4 text-sm text-fg-subtle">Last updated {updated}</p>}
        </header>
        <div className="mt-8 space-y-5 leading-7 text-fg-muted [&_a]:font-medium [&_a]:text-accent [&_a:hover]:underline [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-fg [&_h2]:scroll-mt-24 [&_h2]:pt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-fg [&_h3]:pt-2 [&_h3]:font-semibold [&_h3]:text-fg [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-surface-2 [&_pre]:p-4 [&_pre]:text-[13px] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:text-fg [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </div>
      </article>
    </Container>
  );
}
