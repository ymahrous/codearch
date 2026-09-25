import type { Commit } from "./types";

/**
 * The command users run locally for paste mode. Fields are separated by the ASCII
 * unit separator (%x1f) so author names and subjects may contain "|".
 */
export const LOG_COMMAND = "git -c core.quotePath=false log --no-renames --name-status --format='@@%h%x1f%aN%x1f%at%x1f%s' > history.txt";

const unquote = (x: string) => (x.length > 1 && x.startsWith('"') && x.endsWith('"') ? x.slice(1, -1) : x);

/**
 * Parses the output of {@link LOG_COMMAND}. Also accepts the older "|"-separated
 * format. Commits are returned oldest first.
 */
export function parseLog(text: string): Commit[] {
  const commits: Commit[] = [];
  let cur: Commit | null = null;
  for (const raw of text.split(/\r?\n/)) {
    if (raw.startsWith("@@")) {
      const line = raw.slice(2);
      const p = line.includes("\x1f") ? line.split("\x1f") : line.split("|");
      if (p.length < 4 || p[2].trim() === "" || Number.isNaN(Number(p[2]))) {
        cur = null;
        continue;
      }
      cur = { h: p[0], a: p[1].trim() || "Unknown", t: Number(p[2]), s: p.slice(3).join(line.includes("\x1f") ? "\x1f" : "|"), f: [] };
      commits.push(cur);
    } else if (cur && raw.includes("\t")) {
      const p = raw.split("\t").map(unquote);
      const st = p[0][0];
      if (st === "R" && p[2]) cur.f.push(["D", p[1]], ["A", p[2]]);
      else if (st === "C" && p[2]) cur.f.push(["A", p[2]]);
      else if (st && p[1]) cur.f.push([st, p[1]]);
    }
  }
  return commits.sort((a, b) => a.t - b.t);
}
