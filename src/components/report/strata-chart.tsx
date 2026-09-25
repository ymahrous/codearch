"use client";

import { useMemo, useState } from "react";
import type { Report } from "@/lib/archaeology/types";
import { formatNumber, strataColor } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Tip {
  year: number;
  x: number;
  y: number;
}

/**
 * One horizontal band per year, newest on top. Thickness scales with the square
 * root of that year's commits; colored segments show each principal contributor's share.
 */
export function StrataChart({ report, compact = false }: { report: Report; compact?: boolean }) {
  const [tip, setTip] = useState<Tip | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const max = useMemo(() => Math.max(1, ...report.years.map((y) => y.commits)), [report]);
  const eraByEnd = useMemo(() => new Map(report.eras.map((e) => [e.to, e])), [report]);
  const height = (n: number) => (n ? Math.round((compact ? 8 : 12) + (compact ? 36 : 60) * Math.sqrt(n / max)) : 4);
  const active = tip?.year ?? focused;
  const activeYear = report.years.find((y) => y.year === active);

  return (
    <div className="relative" onMouseLeave={() => setTip(null)}>
      {!compact && (
        <div className="mb-2 flex justify-between text-[11px] font-medium tracking-wider text-fg-subtle uppercase">
          <span>Surface · today</span>
          <span>Commits</span>
        </div>
      )}
      <ol className="border-t-2 border-fg" aria-label="Commits per year, newest first">
        {report.years.map((y) => {
          const h = height(y.commits);
          const era = eraByEnd.get(y.year);
          const label = `${y.year}: ${formatNumber(y.commits)} commits by ${y.people} ${y.people === 1 ? "person" : "people"}${
            y.topPeople[0] ? `, led by ${y.topPeople[0].name}` : ""
          }`;
          return (
            <li
              key={y.year}
              tabIndex={compact ? -1 : 0}
              aria-label={label}
              onFocus={() => setFocused(y.year)}
              onBlur={() => setFocused(null)}
              onMouseMove={(e) => !compact && setTip({ year: y.year, x: e.clientX, y: e.clientY })}
              className={cn(
                "group relative grid items-center gap-3 outline-none",
                compact ? "grid-cols-[2.5rem_1fr]" : "grid-cols-[3rem_1fr_3.5rem]",
              )}
            >
              <span className={cn("text-right font-mono tabular text-fg-muted", compact ? "text-[11px]" : "text-xs")}>{y.year}</span>
              <span
                className="sediment relative flex overflow-hidden border-b border-bg transition-[filter] group-hover:brightness-110 group-focus-visible:ring-2 group-focus-visible:ring-ring"
                style={{ height: h }}
              >
                {y.segments.length ? (
                  y.segments.map((s, i) => (
                    <span key={i} className="block h-full min-w-px" style={{ flex: s.n, background: strataColor(s.idx) }} />
                  ))
                ) : (
                  <span className="block h-full flex-1 bg-border" />
                )}
                {!compact && era && h >= 24 && (
                  <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-xs font-medium whitespace-nowrap text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">
                    {era.name.split(" ")[0]} era
                  </span>
                )}
              </span>
              {!compact && <span className="font-mono text-xs tabular text-fg-muted">{formatNumber(y.commits)}</span>}
            </li>
          );
        })}
      </ol>
      {!compact && (
        <p className="mt-2 border-t-2 border-dashed border-fg-subtle pt-2 text-[11px] font-medium tracking-wider text-fg-subtle uppercase">
          Bedrock · first commit by {report.notes.first.author}
        </p>
      )}

      {!compact && activeYear && activeYear.commits > 0 && (
        <div
          role="status"
          className={cn(
            "pointer-events-none z-30 w-64 rounded-lg border border-border bg-surface p-3 text-sm shadow-xl",
            tip ? "fixed" : "absolute top-8 right-0",
          )}
          style={
            tip
              ? { left: Math.min(tip.x + 16, (typeof window !== "undefined" ? window.innerWidth : 1000) - 272), top: tip.y + 16 }
              : undefined
          }
        >
          <p className="font-semibold text-fg">
            {activeYear.year}{" "}
            <span className="font-normal text-fg-muted">
              · {formatNumber(activeYear.commits)} commits, {activeYear.people} people
            </span>
          </p>
          <ul className="mt-2 space-y-1">
            {activeYear.topPeople.map((p) => (
              <li key={p.name} className="flex justify-between gap-3 font-mono text-xs">
                <span className="truncate text-fg-muted">{p.name}</span>
                <span className="tabular text-fg">{formatNumber(p.n)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function StrataTable({ report }: { report: Report }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Commits per year</caption>
        <thead>
          <tr className="text-left text-xs text-fg-subtle">
            <th scope="col" className="py-2 pr-4 font-medium">
              Year
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              Commits
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              People
            </th>
            <th scope="col" className="py-2 font-medium">
              Most active
            </th>
          </tr>
        </thead>
        <tbody>
          {report.years.map((y) => (
            <tr key={y.year} className="border-t border-border">
              <td className="py-1.5 pr-4 font-mono tabular">{y.year}</td>
              <td className="py-1.5 pr-4 text-right font-mono tabular">{formatNumber(y.commits)}</td>
              <td className="py-1.5 pr-4 text-right font-mono tabular">{y.people}</td>
              <td className="py-1.5 text-fg-muted">{y.topPeople[0]?.name ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
