import { ArrowRight, Clock, FileSearch, GitBranch, Layers, Lock, ShieldAlert, Users } from "lucide-react";
import Link from "next/link";
import { StrataChart } from "@/components/report/strata-chart";
import { RepoSearch } from "@/components/search/repo-search";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { DigResponse } from "@/lib/archaeology/types";
import { formatNumber } from "@/lib/format";
import { EXAMPLES } from "@/lib/site";
import example from "@/data/example-report.json";

const sample = example as unknown as DigResponse;

const features = [
  { icon: Layers, title: "Rock layers", body: "Every year of commits drawn as a layer of sediment, colored by who laid it down." },
  { icon: Users, title: "Eras", body: "The stretches of years a single maintainer led the project, and how much of it they wrote." },
  {
    icon: ShieldAlert,
    title: "Ownership & bus factor",
    body: "Who owns each folder today, and which parts of the code depend on a single person.",
  },
  { icon: FileSearch, title: "Fossil record", body: "The oldest files still standing, and the ones nobody has touched in years." },
];

const steps = [
  { icon: GitBranch, title: "Enter a public repository", body: "Any GitHub, GitLab or Codeberg repo. Paste the URL or type owner/name." },
  {
    icon: Clock,
    title: "We read its history",
    body: "Only commits and folder listings are downloaded, never file contents. Most repos take a few seconds.",
  },
  { icon: Layers, title: "Explore the dig site", body: "Share the link. Reports are cached, so the next visitor gets them instantly." },
];

export default function HomePage() {
  const r = sample.report;
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <Container className="grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div id="analyze" className="min-w-0 scroll-mt-24">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-fg-muted">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden /> Free · No sign-up · Any public repository
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Every repository is a <span className="text-accent">dig site.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-fg-muted">
              See a codebase&apos;s whole history at a glance: who built it and when, who owns each folder today, and which files have
              survived since the beginning.
            </p>
            <div className="mt-8 max-w-xl">
              <RepoSearch />
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-fg-subtle">Try</span>
                {EXAMPLES.slice(0, 4).map((e) => (
                  <Link
                    key={e.slug}
                    href={`/${e.slug}`}
                    className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-fg-muted hover:border-border-strong hover:text-fg"
                  >
                    {e.slug}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <figure className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-xl shadow-black/5">
            <figcaption className="mb-4 flex items-baseline justify-between gap-3">
              <span className="font-mono text-sm font-medium">{r.name}</span>
              <span className="text-xs text-fg-subtle">
                {formatNumber(r.stats.commits)} commits · {r.years.length} years
              </span>
            </figcaption>
            <StrataChart report={r} compact />
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-4">
              {r.top.slice(0, 4).map((p, i) => (
                <span key={p.name} className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
                  <span className="size-2.5 rounded-sm" style={{ background: `var(--s${i})` }} aria-hidden />
                  {p.name}
                </span>
              ))}
            </div>
          </figure>
        </Container>
      </section>

      <section aria-labelledby="features-title" className="py-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-accent">What you&apos;ll uncover</p>
            <h2 id="features-title" className="mt-2 text-3xl font-semibold tracking-tight">
              Four views of a codebase&apos;s past
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-border bg-surface p-6">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-fg-muted">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="how-title" className="border-y border-border bg-surface py-20">
        <Container>
          <h2 id="how-title" className="text-3xl font-semibold tracking-tight">
            How it works
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="relative">
                <span className="font-mono text-xs text-fg-subtle">Step {i + 1}</span>
                <div className="mt-2 flex items-center gap-3">
                  <Icon className="size-5 text-accent" aria-hidden />
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <p className="mt-2 text-sm text-fg-muted">{body}</p>
              </li>
            ))}
          </ol>
          <Link href="/how-it-works" className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
            Read the methodology <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Container>
      </section>

      <section id="examples" aria-labelledby="examples-title" className="scroll-mt-20 py-20">
        <Container>
          <h2 id="examples-title" className="text-3xl font-semibold tracking-tight">
            Start with a famous dig
          </h2>
          <p className="mt-2 text-fg-muted">Popular open-source projects to explore.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLES.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/${e.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
                >
                  <span className="font-mono text-sm font-medium">{e.slug}</span>
                  <span className="mt-1.5 flex-1 text-sm text-fg-muted">{e.blurb}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                    Explore <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="private-title">
        <Container>
          <div className="flex flex-col items-start gap-6 rounded-2xl border border-border bg-surface p-8 sm:p-10 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <Lock className="mt-1 size-6 shrink-0 text-accent" aria-hidden />
              <div>
                <h2 id="private-title" className="text-xl font-semibold">
                  Private or internal repository?
                </h2>
                <p className="mt-1 max-w-xl text-fg-muted">
                  Run one git command locally and paste the output. It&apos;s analyzed entirely in your browser and never uploaded.
                </p>
              </div>
            </div>
            <ButtonLink href="/analyze" variant="secondary">
              Paste a local git log
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
