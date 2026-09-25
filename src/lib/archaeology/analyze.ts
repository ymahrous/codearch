import type { Commit, Era, FossilRow, Report, TerritoryKey, TerritoryRow, YearLayer } from "./types";

export const YEAR_SECONDS = 365.25 * 86400;
export const TOP_AUTHORS = 8;

export const isBot = (author: string) => /\[bot\]|^dependabot|^renovate|^github-actions|greenkeeper|^snyk-bot/i.test(author);

/**
 * Merges author names that differ only by letter case ("Tj" / "TJ"), using the
 * spelling that appears on the most commits (ties go to the earliest).
 */
export function mergeAuthorCase(commits: Commit[]): Commit[] {
  const counts = new Map<string, Map<string, number>>();
  for (const c of commits) {
    const name = c.a.trim();
    const key = name.toLowerCase();
    let m = counts.get(key);
    if (!m) {
      m = new Map();
      counts.set(key, m);
    }
    m.set(name, (m.get(name) ?? 0) + 1);
  }
  const canonical = new Map<string, string>();
  for (const [key, m] of counts) {
    let best = "",
      bestN = -1;
    for (const [name, n] of m)
      if (n > bestN) {
        best = name;
        bestN = n;
      }
    canonical.set(key, best);
  }
  return commits.map((c) => ({ ...c, a: canonical.get(c.a.trim().toLowerCase())! }));
}

export function folderOf(path: string, depth: number): string {
  const parts = path.split("/");
  parts.pop();
  return parts.length ? parts.slice(0, depth).join("/") + "/" : "(root files)";
}

/** Smallest number of authors who together made at least half of the commits. */
export function busFactor(counts: number[]): number {
  const sorted = [...counts].sort((a, b) => b - a);
  const total = sorted.reduce((s, n) => s + n, 0);
  let cum = 0,
    n = 0;
  for (const c of sorted) {
    cum += c;
    n++;
    if (cum >= total / 2) break;
  }
  return n;
}

export function folderStatus(secondsSinceLastTouch: number): TerritoryRow["status"] {
  if (secondsSinceLastTouch < YEAR_SECONDS) return "active";
  if (secondsSinceLastTouch < 3 * YEAR_SECONDS) return "quiet";
  return "fossil";
}

interface FileInfo {
  ct: number;
  ca: string;
  cs: string;
  lt: number;
  la: string;
  ls: string;
  n: number;
  partial?: boolean;
}

function territory(commits: Commit[], depth: number, ignoreBots: boolean, topIdx: Map<string, number>, now: number): TerritoryRow[] {
  const map = new Map<string, { n: number; by: Map<string, number>; first: number; last: number }>();
  for (const c of commits) {
    if (ignoreBots && isBot(c.a)) continue;
    for (const k of new Set(c.f.map(([, p]) => folderOf(p, depth)))) {
      let F = map.get(k);
      if (!F) {
        F = { n: 0, by: new Map(), first: c.t, last: c.t };
        map.set(k, F);
      }
      F.n++;
      F.by.set(c.a, (F.by.get(c.a) ?? 0) + 1);
      F.first = Math.min(F.first, c.t);
      F.last = Math.max(F.last, c.t);
    }
  }
  return [...map.entries()]
    .map(([folder, F]) => {
      const sorted = [...F.by.entries()].sort((a, b) => b[1] - a[1]);
      return {
        folder,
        commits: F.n,
        owner: sorted[0][0],
        ownerIdx: topIdx.get(sorted[0][0]) ?? -1,
        share: sorted[0][1] / F.n,
        busFactor: busFactor(sorted.map(([, n]) => n)),
        authors: sorted.length,
        first: F.first,
        last: F.last,
        status: folderStatus(now - F.last),
      };
    })
    .sort((a, b) => b.commits - a.commits || a.folder.localeCompare(b.folder))
    .slice(0, 30);
}

export interface AnalyzeOptions {
  name: string;
  source: "git" | "paste";
  /** Paths present at HEAD. When given, fossils are limited to these. */
  head?: string[];
  now?: number;
}

export function analyze(input: Commit[], opts: AnalyzeOptions): Report {
  if (!input.length) throw new Error("No commits found.");
  const commits = mergeAuthorCase([...input].sort((a, b) => a.t - b.t));
  const files = new Map<string, FileInfo>();
  const authors = new Map<string, number>();
  const years = new Map<number, { n: number; by: Map<string, number> }>();

  for (const c of commits) {
    authors.set(c.a, (authors.get(c.a) ?? 0) + 1);
    const y = new Date(c.t * 1000).getUTCFullYear();
    let Y = years.get(y);
    if (!Y) {
      Y = { n: 0, by: new Map() };
      years.set(y, Y);
    }
    Y.n++;
    Y.by.set(c.a, (Y.by.get(c.a) ?? 0) + 1);
    for (const [st, p] of c.f) {
      if (st === "A") files.set(p, { ct: c.t, ca: c.a, cs: c.s, lt: c.t, la: c.a, ls: c.s, n: 1 });
      else if (st === "D") files.delete(p);
      else {
        const f = files.get(p);
        if (f) {
          f.lt = c.t;
          f.la = c.a;
          f.ls = c.s;
          f.n++;
        } else files.set(p, { ct: c.t, ca: c.a, cs: c.s, lt: c.t, la: c.a, ls: c.s, n: 1, partial: true });
      }
    }
  }

  let alive = [...files.entries()];
  if (opts.head?.length) {
    const hs = new Set(opts.head);
    alive = alive.filter(([p]) => hs.has(p));
  }

  const first = commits[0];
  const last = commits[commits.length - 1];
  const now = last.t;
  const humans = [...authors.entries()].filter(([a]) => !isBot(a)).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = humans.slice(0, TOP_AUTHORS);
  const topIdx = new Map(top.map(([a], i) => [a, i]));

  const minY = Math.min(...years.keys());
  const maxY = Math.max(...years.keys());
  const layers: YearLayer[] = [];
  for (let y = maxY; y >= minY; y--) {
    const Y = years.get(y);
    if (!Y) {
      layers.push({ year: y, commits: 0, people: 0, segments: [], topPeople: [] });
      continue;
    }
    const segs: YearLayer["segments"] = [];
    let other = 0;
    for (const [a, n] of Y.by) {
      const i = topIdx.get(a);
      if (i === undefined) other += n;
      else segs.push({ idx: i, n });
    }
    segs.sort((a, b) => a.idx - b.idx);
    if (other) segs.push({ idx: -1, n: other });
    layers.push({
      year: y,
      commits: Y.n,
      people: Y.by.size,
      segments: segs,
      topPeople: [...Y.by.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, n]) => ({ name, n })),
    });
  }

  const eras: Era[] = [];
  for (let y = minY; y <= maxY; y++) {
    const Y = years.get(y);
    if (!Y) continue;
    const lead = [...Y.by.entries()].filter(([a]) => !isBot(a)).sort((a, b) => b[1] - a[1])[0];
    if (!lead) continue;
    const e = eras[eras.length - 1];
    if (e && e.name === lead[0] && e.to === y - 1) e.to = y;
    else eras.push({ name: lead[0], idx: topIdx.get(lead[0]) ?? -1, from: y, to: y, share: 0 });
  }
  for (const e of eras) {
    let tot = 0,
      mine = 0;
    for (let y = e.from; y <= e.to; y++) {
      const Y = years.get(y);
      if (Y) {
        tot += Y.n;
        mine += Y.by.get(e.name) ?? 0;
      }
    }
    e.share = tot ? mine / tot : 0;
  }
  const notableEras = eras
    .filter((e) => e.to - e.from >= 1 || e.share > 0.3)
    .reverse()
    .slice(0, 8);

  const terr = {} as Record<TerritoryKey, TerritoryRow[]>;
  for (const d of [1, 2] as const) {
    for (const b of [true, false]) terr[`${d}|${b ? "nobots" : "bots"}`] = territory(commits, d, b, topIdx, now);
  }

  const fossil = (path: string, ts: number, author: string, message: string): FossilRow => ({ path, ts, author, message, age: now - ts });
  const oldest = alive
    .filter(([, f]) => !f.partial)
    .sort((a, b) => a[1].ct - b[1].ct || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([p, f]) => fossil(p, f.ct, f.ca, f.cs));
  const untouched = [...alive]
    .sort((a, b) => a[1].lt - b[1].lt || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([p, f]) => fossil(p, f.lt, f.la, f.ls));

  let gap: Report["notes"]["gap"] = null;
  for (let i = 1; i < commits.length; i++) {
    const d = commits[i].t - commits[i - 1].t;
    if (!gap || d > gap.seconds) gap = { seconds: d, from: commits[i - 1].t, to: commits[i].t };
  }
  const biggest = commits.reduce((m, c) => (c.f.length > m.f.length ? c : m), commits[0]);
  const days = new Map<string, number>();
  const hours = new Array<number>(24).fill(0);
  for (const c of commits) {
    const d = new Date(c.t * 1000);
    const k = d.toISOString().slice(0, 10);
    days.set(k, (days.get(k) ?? 0) + 1);
    hours[d.getUTCHours()]++;
  }
  const busy = [...days.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const peak = hours.indexOf(Math.max(...hours));
  const mostEdited = [...alive].sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]))[0];

  return {
    name: opts.name,
    source: opts.source,
    generatedAt: opts.now ?? Math.floor(Date.now() / 1000),
    stats: { commits: commits.length, contributors: authors.size, survivingFiles: alive.length, firstTs: first.t, lastTs: last.t },
    top: top.map(([name, n]) => ({ name, commits: n })),
    otherCommits: commits.length - top.reduce((s, [, n]) => s + n, 0),
    years: layers,
    eras: notableEras,
    territory: terr,
    oldest,
    untouched,
    notes: {
      first: { ts: first.t, author: first.a, message: first.s },
      gap,
      biggest: { files: biggest.f.length, author: biggest.a, ts: biggest.t, message: biggest.s },
      busiestDay: { day: busy[0], commits: busy[1] },
      oneTimers: [...authors.values()].filter((n) => n === 1).length,
      peakHourUtc: peak,
      peakHourCommits: hours[peak],
      mostEdited: mostEdited ? { path: mostEdited[0], edits: mostEdited[1].n } : null,
      botCommits: [...authors.entries()].filter(([a]) => isBot(a)).reduce((s, [, n]) => s + n, 0),
    },
  };
}
