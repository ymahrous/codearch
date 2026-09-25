"use client";

import { Check, ExternalLink, Link2, RefreshCw, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FossilRow, RepoMeta, Report } from "@/lib/archaeology/types";
import {
  formatAgo,
  formatCompact,
  formatDate,
  formatDay,
  formatDuration,
  formatHour,
  formatNumber,
  formatPercent,
  strataColor,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import { OwnershipTable } from "./ownership-table";
import { StrataChart, StrataTable } from "./strata-chart";

const SECTIONS = [
  { id: "timeline", label: "Timeline" },
  { id: "ownership", label: "Ownership" },
  { id: "fossils", label: "Fossils" },
  { id: "insights", label: "Insights" },
] as const;

export interface ReportViewProps {
  report: Report;
  meta?: RepoMeta;
  cached?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function ReportView({ report, meta, cached, onRefresh, refreshing }: ReportViewProps) {
  const [asTable, setAsTable] = useState(false);
  const [copied, setCopied] = useState(false);
  const r = report;

  const riskFolders = useMemo(() => r.territory["1|nobots"].filter((t) => t.busFactor === 1 && t.authors > 1).length, [r]);
  const activeYears = r.years.filter((y) => y.commits > 0).length;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: the URL bar still has the link */
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={r.source === "git" ? "accent" : "neutral"}>{r.source === "git" ? "Public repository" : "From pasted log"}</Badge>
            {r.source === "git" && <Badge>{cached ? `Analyzed ${formatAgo(r.generatedAt)}` : "Freshly analyzed"}</Badge>}
          </div>
          <h1 className="mt-3 truncate font-mono text-2xl font-semibold tracking-tight sm:text-3xl">{r.name}</h1>
          {meta?.description && <p className="mt-2 max-w-2xl text-fg-muted">{meta.description}</p>}
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
            <span>
              {formatDate(r.stats.firstTs)} – {formatDate(r.stats.lastTs)}
            </span>
            {meta?.stars !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5" aria-hidden /> {formatCompact(meta.stars)} stars
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {r.source === "git" && (
            <Button variant="outline" size="sm" onClick={copyLink} aria-live="polite">
              {copied ? <Check aria-hidden /> : <Link2 aria-hidden />}
              {copied ? "Link copied" : "Copy link"}
            </Button>
          )}
          {meta?.htmlUrl && (
            <a
              href={meta.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-surface-2"
            >
              <ExternalLink className="size-4" aria-hidden /> View source
            </a>
          )}
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={refreshing}>
              <RefreshCw className={refreshing ? "animate-spin" : undefined} aria-hidden />
              {refreshing ? "Re-analyzing…" : "Re-analyze"}
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-6 lg:grid-cols-5">
        {[
          [
            "Commits",
            formatNumber(r.stats.commits),
            `${formatNumber(Math.round(r.stats.commits / Math.max(1, activeYears)))} per active year`,
          ],
          [
            "Contributors",
            formatNumber(r.stats.contributors),
            `${formatPercent(r.notes.oneTimers / r.stats.contributors)} made one commit`,
          ],
          [
            "Active years",
            String(activeYears),
            `${new Date(r.stats.firstTs * 1000).getUTCFullYear()} → ${new Date(r.stats.lastTs * 1000).getUTCFullYear()}`,
          ],
          ["Surviving files", formatNumber(r.stats.survivingFiles), "Still present today"],
          [
            "Single-owner folders",
            String(riskFolders),
            riskFolders ? "Top-level folders with bus factor 1" : "No top-level folder depends on one person",
          ],
        ].map(([k, v, d], i) => (
          <div key={k} className={cn("bg-surface p-4 lg:col-span-1", i < 3 ? "sm:col-span-2" : "sm:col-span-3", i === 4 && "col-span-2")}>
            <dt className="text-xs font-medium text-fg-muted">{k}</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-tight tabular">{v}</dd>
            <dd className="mt-1 text-xs text-fg-subtle">{d}</dd>
          </div>
        ))}
      </dl>

      {/* On this page */}
      <nav
        aria-label="Report sections"
        className="sticky top-16 z-20 -mx-4 border-b border-border bg-bg/90 px-4 backdrop-blur sm:mx-0 sm:px-0"
      >
        <ul className="flex gap-1 overflow-x-auto py-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="block rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-fg-muted hover:bg-surface-2 hover:text-fg"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Timeline */}
      <section id="timeline" aria-labelledby="timeline-title" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle id="timeline-title">Rock layers</CardTitle>
              <CardDescription>One layer per year. Thicker layers had more commits; colors show who made them.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAsTable((t) => !t)} aria-pressed={asTable}>
              {asTable ? "Show chart" : "Show as table"}
            </Button>
          </CardHeader>
          <CardBody>{asTable ? <StrataTable report={r} /> : <StrataChart report={r} />}</CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Principal contributors</CardTitle>
            </CardHeader>
            <CardBody>
              <ul className="space-y-2">
                {r.top.map((p, i) => (
                  <li key={p.name} className="flex items-center gap-3 text-sm">
                    <span className="size-3 shrink-0 rounded-sm" style={{ background: strataColor(i) }} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="font-mono text-xs text-fg-muted tabular">{formatNumber(p.commits)}</span>
                  </li>
                ))}
                <li className="flex items-center gap-3 text-sm">
                  <span className="size-3 shrink-0 rounded-sm" style={{ background: strataColor(-1) }} aria-hidden />
                  <span className="flex-1 text-fg-muted">Everyone else</span>
                  <span className="font-mono text-xs text-fg-muted tabular">{formatNumber(r.otherCommits)}</span>
                </li>
              </ul>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Eras</CardTitle>
                <CardDescription>Stretches of years led by one person.</CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              <ol className="space-y-3">
                {r.eras.map((e) => (
                  <li key={`${e.name}-${e.from}`} className="border-l-[3px] pl-3" style={{ borderColor: strataColor(e.idx) }}>
                    <p className="text-sm font-medium">{e.name}</p>
                    <p className="font-mono text-xs text-fg-muted">
                      {e.from === e.to ? e.from : `${e.from}–${e.to}`} · {formatPercent(e.share)} of commits
                    </p>
                  </li>
                ))}
                {!r.eras.length && <li className="text-sm text-fg-muted">No single person led for long.</li>}
              </ol>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Ownership */}
      <section id="ownership" aria-labelledby="ownership-title">
        <Card>
          <CardHeader className="border-b-0">
            <div>
              <CardTitle id="ownership-title">Who owns which folder</CardTitle>
              <CardDescription>
                Main owner by share of commits touching each folder. Bus factor is how many people made half of those commits.
              </CardDescription>
            </div>
          </CardHeader>
          <OwnershipTable report={r} />
        </Card>
      </section>

      {/* Fossils */}
      <section id="fossils" aria-labelledby="fossils-title" className="space-y-4">
        <div>
          <h2 id="fossils-title" className="text-xl font-semibold">
            Fossil record
          </h2>
          <p className="mt-1 text-sm text-fg-muted">Files still present today. Renamed files count from their rename.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <FossilCard title="Earliest still standing" verb="Added" rows={r.oldest} />
          <FossilCard title="Untouched the longest" verb="Last changed" rows={r.untouched} />
        </div>
      </section>

      {/* Insights */}
      <section id="insights" aria-labelledby="insights-title" className="space-y-4">
        <h2 id="insights-title" className="text-xl font-semibold">
          Notable finds
        </h2>
        <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {insights(r).map(([k, v, d]) => (
            <div key={k} className="bg-surface p-4">
              <dt className="text-xs font-medium text-fg-muted">{k}</dt>
              <dd className="mt-1 text-lg font-semibold tracking-tight">{v}</dd>
              <dd className="mt-1 text-sm break-words text-fg-muted">{d}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function FossilCard({ title, verb, rows }: { title: string; verb: string; rows: FossilRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <ol className="divide-y divide-border">
        {rows.map((f) => (
          <li key={f.path} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 px-5 py-3">
            <span className="font-mono text-[13px] break-all">{f.path}</span>
            <span className="font-mono text-xs font-medium text-accent tabular">{formatDuration(f.age)}</span>
            <span className="col-span-2 truncate text-xs text-fg-muted" title={f.message}>
              {verb} {formatDate(f.ts)} by {f.author} · {f.message}
            </span>
          </li>
        ))}
        {!rows.length && <li className="px-5 py-6 text-sm text-fg-muted">No surviving files found.</li>}
      </ol>
    </Card>
  );
}

function insights(r: Report): Array<[string, string, string]> {
  const n = r.notes;
  return [
    ["First commit", formatDate(n.first.ts), `${n.first.author}: “${n.first.message}”`],
    [
      "Longest silence",
      n.gap ? formatDuration(n.gap.seconds) : "–",
      n.gap ? `${formatDate(n.gap.from)} → ${formatDate(n.gap.to)}` : "Only one commit",
    ],
    [
      "Biggest commit",
      `${formatNumber(n.biggest.files)} files`,
      `${n.biggest.author}, ${formatDate(n.biggest.ts)}: “${n.biggest.message}”`,
    ],
    ["Busiest day", `${formatNumber(n.busiestDay.commits)} commits`, formatDay(n.busiestDay.day)],
    [
      "One-time contributors",
      formatNumber(n.oneTimers),
      `${formatPercent(n.oneTimers / r.stats.contributors)} of everyone who contributed`,
    ],
    ["Peak commit hour", formatHour(n.peakHourUtc), `${formatNumber(n.peakHourCommits)} commits landed in that hour`],
    ["Most-edited file", n.mostEdited ? `${formatNumber(n.mostEdited.edits)} edits` : "–", n.mostEdited?.path ?? ""],
    ["Automation share", formatPercent(n.botCommits / r.stats.commits), `${formatNumber(n.botCommits)} commits from bots`],
  ];
}
