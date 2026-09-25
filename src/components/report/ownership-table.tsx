"use client";

import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/segmented";
import type { Report, TerritoryRow } from "@/lib/archaeology/types";
import { formatMonth, formatNumber, formatPercent, strataColor } from "@/lib/format";

type SortKey = "commits" | "folder" | "busFactor" | "last";

const STATUS = {
  active: { tone: "success", label: "Active" },
  quiet: { tone: "warning", label: "Quiet" },
  fossil: { tone: "danger", label: "Fossil" },
} as const;

export function OwnershipTable({ report }: { report: Report }) {
  const [depth, setDepth] = useState<1 | 2>(1);
  const [bots, setBots] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "commits", dir: -1 });

  const rows = useMemo(() => {
    const all: TerritoryRow[] = report.territory[`${depth}|${bots ? "bots" : "nobots"}`] ?? [];
    const q = query.trim().toLowerCase();
    const filtered = q ? all.filter((r) => r.folder.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q)) : all;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key],
        bv = b[sort.key];
      return (typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number)) * sort.dir;
    });
  }, [report, depth, bots, query, sort]);

  const header = (key: SortKey, label: string, align: "left" | "right" = "left") => {
    const activeSort = sort.key === key;
    return (
      <th
        scope="col"
        aria-sort={activeSort ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
        className={`px-4 py-2.5 font-medium ${align === "right" ? "text-right" : "text-left"}`}
      >
        <button
          type="button"
          onClick={() => setSort((s) => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : key === "folder" ? 1 : -1 }))}
          className="inline-flex items-center gap-1 hover:text-fg"
        >
          {label}
          {activeSort && (sort.dir === 1 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}
        </button>
      </th>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 px-5 pb-4">
        <Segmented
          label="Folder depth"
          value={depth}
          onChange={setDepth}
          options={[
            { value: 1, label: "Top level" },
            { value: 2, label: "Two levels" },
          ]}
        />
        <label className="inline-flex items-center gap-2 text-sm text-fg-muted">
          <input type="checkbox" checked={bots} onChange={(e) => setBots(e.target.checked)} className="size-4 accent-[var(--accent)]" />
          Include bots
        </label>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
          <label htmlFor="ownership-filter" className="sr-only">
            Filter folders or owners
          </label>
          <input
            id="ownership-filter"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter folders or owners"
            className="h-9 w-full rounded-lg border border-border bg-surface pr-3 pl-9 text-sm placeholder:text-fg-subtle"
          />
        </div>
      </div>
      <div className="overflow-x-auto border-t border-border">
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Folder ownership</caption>
          <thead className="bg-surface-2 text-xs text-fg-muted">
            <tr>
              {header("folder", "Folder")}
              {header("commits", "Commits", "right")}
              <th scope="col" className="px-4 py-2.5 text-left font-medium">
                Main owner
              </th>
              {header("busFactor", "Bus factor", "right")}
              <th scope="col" className="px-4 py-2.5 text-left font-medium">
                First commit
              </th>
              {header("last", "Last commit")}
              <th scope="col" className="px-4 py-2.5 text-left font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.folder} className="border-t border-border hover:bg-surface-2/60">
                <td className="px-4 py-2.5 font-mono text-[13px] break-all">{r.folder}</td>
                <td className="px-4 py-2.5 text-right font-mono tabular">{formatNumber(r.commits)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-surface-3" aria-hidden>
                      <span
                        className="block h-full rounded-full"
                        style={{ width: formatPercent(r.share), background: strataColor(r.ownerIdx) }}
                      />
                    </span>
                    <span className="truncate">{r.owner}</span>
                    <span className="font-mono text-xs text-fg-subtle tabular">{formatPercent(r.share)}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {r.busFactor === 1 && r.authors > 1 ? (
                    <Badge tone="danger" title="One person made at least half of this folder's commits">
                      1 · at risk
                    </Badge>
                  ) : (
                    <span className="font-mono tabular">{r.busFactor}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-fg-muted">{formatMonth(r.first)}</td>
                <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-fg-muted">{formatMonth(r.last)}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-fg-muted">
                  {query.trim() ? `No folders match “${query.trim()}”.` : "No folder activity to show."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
