export type FileStatus = "A" | "M" | "D" | string;
export type FileChange = [FileStatus, string];

/** One commit, as `git log --name-status` describes it. */
export interface Commit {
  /** Abbreviated hash */
  h: string;
  /** Author name */
  a: string;
  /** Author time, unix seconds */
  t: number;
  /** Subject line */
  s: string;
  /** Changed files */
  f: FileChange[];
}

export type FolderStatus = "active" | "quiet" | "fossil";

export interface TerritoryRow {
  folder: string;
  commits: number;
  owner: string;
  ownerIdx: number;
  share: number;
  busFactor: number;
  authors: number;
  first: number;
  last: number;
  status: FolderStatus;
}

export interface FossilRow {
  path: string;
  ts: number;
  author: string;
  message: string;
  age: number;
}

export interface YearLayer {
  year: number;
  commits: number;
  people: number;
  segments: Array<{ idx: number; n: number }>;
  topPeople: Array<{ name: string; n: number }>;
}

export interface Era {
  name: string;
  idx: number;
  from: number;
  to: number;
  share: number;
}

export type TerritoryKey = `${1 | 2}|${"bots" | "nobots"}`;

export interface Report {
  name: string;
  source: "git" | "paste";
  generatedAt: number;
  stats: { commits: number; contributors: number; survivingFiles: number; firstTs: number; lastTs: number };
  top: Array<{ name: string; commits: number }>;
  otherCommits: number;
  years: YearLayer[];
  eras: Era[];
  territory: Record<TerritoryKey, TerritoryRow[]>;
  oldest: FossilRow[];
  untouched: FossilRow[];
  notes: {
    first: { ts: number; author: string; message: string };
    gap: { seconds: number; from: number; to: number } | null;
    biggest: { files: number; author: string; ts: number; message: string };
    busiestDay: { day: string; commits: number };
    oneTimers: number;
    peakHourUtc: number;
    peakHourCommits: number;
    mostEdited: { path: string; edits: number } | null;
    botCommits: number;
  };
}

export interface RepoMeta {
  htmlUrl: string;
  description?: string | null;
  stars?: number;
  defaultBranch?: string;
}

export interface DigResponse {
  report: Report;
  meta: RepoMeta;
  cached: boolean;
}

export interface ApiError {
  error: { code: string; message: string };
}
