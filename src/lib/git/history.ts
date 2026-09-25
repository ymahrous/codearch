import type { Commit, FileChange } from "@/lib/archaeology/types";
import { hexToKey, keyToHex, type GitObject } from "./pack";

/**
 * Turns the commits and trees of a blob-less pack into the same data
 * `git log --no-renames --name-status` would print: every commit reachable
 * from HEAD with its added / modified / deleted paths (merges list no files,
 * matching git's default), plus the file list at HEAD.
 */

export interface TreeEntry {
  mode: string;
  name: string;
  oid: string;
}
/** `tree` and `parents` are binary object keys (see hexToKey). */
export interface ParsedCommit {
  tree: string;
  parents: string[];
  author: string;
  time: number;
  subject: string;
}

const isDir = (mode: string) => mode === "40000" || mode === "040000";
/** Regular file, symlink or submodule: a change between these is a "T" (type change) in git. */
const kind = (mode: string) => (mode === "120000" ? "link" : mode === "160000" ? "gitlink" : "file");

/**
 * Git sorts tree entries by name, comparing directories as if they ended in "/".
 * Entries with the same name but a different kind (file vs directory) therefore
 * compare unequal, which yields a delete plus an add, exactly like git.
 */
export function compareEntries(l: TreeEntry, r: TreeEntry): number {
  const a = isDir(l.mode) ? l.name + "/" : l.name;
  const b = isDir(r.mode) ? r.name + "/" : r.name;
  return a < b ? -1 : a > b ? 1 : 0;
}

export function parseTree(data: Buffer): TreeEntry[] {
  const out: TreeEntry[] = [];
  let pos = 0;
  while (pos < data.length) {
    const sp = data.indexOf(0x20, pos);
    const nul = data.indexOf(0x00, sp);
    if (sp < 0 || nul < 0 || nul + 21 > data.length) throw new Error("Malformed tree object");
    out.push({
      mode: data.toString("latin1", pos, sp),
      name: data.toString("utf8", sp + 1, nul),
      oid: data.toString("latin1", nul + 1, nul + 21),
    });
    pos = nul + 21;
  }
  return out;
}

export function parseCommit(data: Buffer): ParsedCommit {
  const text = data.toString("utf8");
  const split = text.indexOf("\n\n");
  const head = split < 0 ? text : text.slice(0, split);
  const body = split < 0 ? "" : text.slice(split + 2);
  let tree = "",
    author = "Unknown",
    time = 0;
  const parents: string[] = [];
  for (const line of head.split("\n")) {
    if (line.startsWith(" ")) continue; // continuation of a multi-line header (e.g. gpgsig)
    if (line.startsWith("tree ")) tree = hexToKey(line.slice(5));
    else if (line.startsWith("parent ")) parents.push(hexToKey(line.slice(7)));
    else if (line.startsWith("author ")) {
      const m = /^author (.*) <[^>]*> (-?\d+) [+-]\d{4}$/.exec(line);
      if (m) {
        author = m[1].trim() || "Unknown";
        time = Number(m[2]);
      }
    }
  }
  // Like git's %s: the first paragraph, lines joined with spaces.
  const firstPara = body.replace(/^\n+/, "").split(/\n\s*\n/)[0] ?? "";
  const subject = firstPara
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ");
  return { tree, parents, author, time, subject };
}

export function buildHistory(objects: Map<string, GitObject>, headOidHex: string): { commits: Commit[]; headFiles: string[] } {
  const trees = new Map<string, TreeEntry[]>();
  const getTree = (oid: string): TreeEntry[] => {
    let t = trees.get(oid);
    if (!t) {
      const obj = objects.get(oid);
      if (!obj || obj.type !== "tree") throw new Error(`Tree ${keyToHex(oid)} missing from pack`);
      t = parseTree(obj.data);
      trees.set(oid, t);
    }
    return t;
  };

  const flatten = (oid: string, prefix: string, status: "A" | "D" | null, out: FileChange[] | string[]) => {
    for (const e of getTree(oid)) {
      const path = prefix + e.name;
      if (isDir(e.mode)) flatten(e.oid, path + "/", status, out);
      else if (status) (out as FileChange[]).push([status, path]);
      else (out as string[]).push(path);
    }
  };

  // Both trees are sorted in git's order, so walk them together like a merge.
  const diff = (a: string, b: string, prefix: string, out: FileChange[]) => {
    if (a === b) return;
    const L = getTree(a),
      R = getTree(b);
    let i = 0,
      j = 0;
    while (i < L.length || j < R.length) {
      const l = L[i],
        r = R[j];
      const cmp = !l ? 1 : !r ? -1 : compareEntries(l, r);
      if (cmp < 0) {
        const path = prefix + l.name;
        if (isDir(l.mode)) flatten(l.oid, path + "/", "D", out);
        else out.push(["D", path]);
        i++;
      } else if (cmp > 0) {
        const path = prefix + r.name;
        if (isDir(r.mode)) flatten(r.oid, path + "/", "A", out);
        else out.push(["A", path]);
        j++;
      } else {
        if (l.oid !== r.oid || l.mode !== r.mode) {
          const path = prefix + r.name;
          if (isDir(l.mode)) diff(l.oid, r.oid, path + "/", out);
          else out.push([kind(l.mode) === kind(r.mode) ? "M" : "T", path]);
        }
        i++;
        j++;
      }
    }
  };

  const parsed = new Map<string, ParsedCommit>();
  const getCommit = (oid: string) => {
    let c = parsed.get(oid);
    if (!c) {
      const obj = objects.get(oid);
      if (!obj || obj.type !== "commit") return null;
      c = parseCommit(obj.data);
      parsed.set(oid, c);
    }
    return c;
  };

  const headOid = hexToKey(headOidHex);
  const head = getCommit(headOid);
  if (!head) throw new Error("HEAD commit missing from pack");

  const commits: Commit[] = [];
  const seen = new Set<string>([headOid]);
  const stack = [headOid];
  while (stack.length) {
    const oid = stack.pop()!;
    const c = getCommit(oid)!;
    const present = c.parents.filter((p) => objects.has(p));
    const files: FileChange[] = [];
    if (present.length === 0) flatten(c.tree, "", "A", files);
    else if (present.length === 1) diff(getCommit(present[0])!.tree, c.tree, "", files);
    commits.push({ h: keyToHex(oid).slice(0, 8), a: c.author, t: c.time, s: c.subject, f: files });
    for (const p of present)
      if (!seen.has(p)) {
        seen.add(p);
        stack.push(p);
      }
  }

  const headFiles: string[] = [];
  flatten(head.tree, "", null, headFiles);
  commits.sort((x, y) => x.t - y.t);
  return { commits, headFiles };
}
