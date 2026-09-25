import { describe, expect, it } from "vitest";
import { buildHistory, compareEntries, parseCommit, parseTree } from "@/lib/git/history";
import { keyToHex } from "@/lib/git/pack";
import { blobId, commit, ObjectDb, tree } from "../support/git-objects";

const files = (c: { f: [string, string][] }) => [...c.f].sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));

describe("parseTree / parseCommit", () => {
  it("parses tree entries", () => {
    const id = blobId("x");
    const entries = parseTree(
      tree([
        ["100644", "a.txt", id],
        ["40000", "src", id],
      ]),
    );
    expect(entries.map((e) => [e.mode, e.name, keyToHex(e.oid)])).toEqual([
      ["100644", "a.txt", id],
      ["40000", "src", id],
    ]);
  });

  it("parses commit headers and the subject like git's %s", () => {
    const raw = Buffer.from(
      [
        "tree " + "a".repeat(40),
        "parent " + "b".repeat(40),
        "parent " + "c".repeat(40),
        "author Ada Lovelace <ada@example.com> 1700000000 +0100",
        "committer X <x@example.com> 1700000001 +0000",
        "gpgsig -----BEGIN PGP SIGNATURE-----",
        " ",
        " abc",
        " -----END PGP SIGNATURE-----",
        "",
        "Fix the thing",
        "across two lines",
        "",
        "Body text.",
      ].join("\n"),
    );
    const c = parseCommit(raw);
    expect(keyToHex(c.tree)).toBe("a".repeat(40));
    expect(c.parents.map(keyToHex)).toEqual(["b".repeat(40), "c".repeat(40)]);
    expect(c.author).toBe("Ada Lovelace");
    expect(c.time).toBe(1700000000);
    expect(c.subject).toBe("Fix the thing across two lines");
  });

  it("orders directories as if they ended in a slash", () => {
    const e = (mode: string, name: string) => ({ mode, name, oid: "" });
    expect(compareEntries(e("100644", "a.b"), e("40000", "a"))).toBeLessThan(0); // "a.b" < "a/"
    expect(compareEntries(e("40000", "a"), e("100644", "a0"))).toBeLessThan(0); // "a/" < "a0"
  });
});

describe("buildHistory", () => {
  /**
   * c1: add README.md, src/a.ts, src/lib/b.ts
   * c2: modify src/a.ts, delete README.md, add docs/guide.md
   * c3: turn src/lib/b.ts into a symlink (type change), exec-bit change on src/a.ts
   * c4 (branch from c2): add feature.ts
   * m  (merge c3 + c4): no files listed, like git log
   * c5: replace directory "docs" with a file "docs"
   */
  const db = new ObjectDb();
  const B = (s: string) => blobId(s);
  const lib1 = db.tree([["100644", "b.ts", B("b1")]]);
  const src1 = db.tree([
    ["100644", "a.ts", B("a1")],
    ["40000", "lib", lib1],
  ]);
  const t1 = db.tree([
    ["100644", "README.md", B("r")],
    ["40000", "src", src1],
  ]);
  const c1 = db.commit({ tree: t1, author: "Ada", time: 100, message: "init" });

  const src2 = db.tree([
    ["100644", "a.ts", B("a2")],
    ["40000", "lib", lib1],
  ]);
  const docs = db.tree([["100644", "guide.md", B("g")]]);
  const t2 = db.tree([
    ["40000", "docs", docs],
    ["40000", "src", src2],
  ]);
  const c2 = db.commit({ tree: t2, parents: [c1], author: "Grace", time: 200, message: "second" });

  const lib3 = db.tree([["120000", "b.ts", B("link")]]);
  const src3 = db.tree([
    ["100755", "a.ts", B("a2")],
    ["40000", "lib", lib3],
  ]);
  const t3 = db.tree([
    ["40000", "docs", docs],
    ["40000", "src", src3],
  ]);
  const c3 = db.commit({ tree: t3, parents: [c2], author: "Ada", time: 300, message: "typechange" });

  const t4 = db.tree([
    ["40000", "docs", docs],
    ["100644", "feature.ts", B("f")],
    ["40000", "src", src2],
  ]);
  const c4 = db.commit({ tree: t4, parents: [c2], author: "Linus", time: 250, message: "feature" });

  const tm = db.tree([
    ["40000", "docs", docs],
    ["100644", "feature.ts", B("f")],
    ["40000", "src", src3],
  ]);
  const m = db.commit({ tree: tm, parents: [c3, c4], author: "Ada", time: 400, message: "Merge branch" });

  const t5 = db.tree([
    ["100644", "docs", B("d")],
    ["100644", "feature.ts", B("f")],
    ["40000", "src", src3],
  ]);
  const c5 = db.commit({ tree: t5, parents: [m], author: "Grace", time: 500, message: "docs as a file" });

  const { commits, headFiles } = buildHistory(db.objects, c5);
  const by = (s: string) => commits.find((c) => c.s === s)!;

  it("finds every commit reachable from HEAD, oldest first", () => {
    expect(commits.map((c) => c.s)).toEqual(["init", "second", "feature", "typechange", "Merge branch", "docs as a file"]);
    expect(commits[0].h).toBe(c1.slice(0, 8));
  });

  it("lists all files of the root commit as added", () => {
    expect(files(by("init"))).toEqual([
      ["A", "README.md"],
      ["A", "src/a.ts"],
      ["A", "src/lib/b.ts"],
    ]);
  });

  it("diffs against the parent", () => {
    expect(files(by("second"))).toEqual([
      ["D", "README.md"],
      ["A", "docs/guide.md"],
      ["M", "src/a.ts"],
    ]);
    expect(files(by("feature"))).toEqual([["A", "feature.ts"]]);
  });

  it("reports mode-only changes as M and file↔symlink as T", () => {
    expect(files(by("typechange"))).toEqual([
      ["M", "src/a.ts"],
      ["T", "src/lib/b.ts"],
    ]);
  });

  it("lists no files for merge commits", () => {
    expect(by("Merge branch").f).toEqual([]);
  });

  it("handles a directory replaced by a file", () => {
    expect(files(by("docs as a file"))).toEqual([
      ["A", "docs"],
      ["D", "docs/guide.md"],
    ]);
  });

  it("lists files at HEAD", () => {
    expect(headFiles.sort()).toEqual(["docs", "feature.ts", "src/a.ts", "src/lib/b.ts"]);
  });

  it("fails when HEAD is missing", () => {
    expect(() => buildHistory(db.objects, "f".repeat(40))).toThrow(/HEAD commit missing/);
  });

  it("treats commits whose parents aren't in the pack as roots (shallow history)", () => {
    const db2 = new ObjectDb();
    const t = db2.tree([["100644", "x", B("x")]]);
    const c = db2.commit({ tree: t, parents: ["e".repeat(40)], author: "A", time: 1, message: "orphan" });
    expect(buildHistory(db2.objects, c).commits[0].f).toEqual([["A", "x"]]);
  });

  it("uses commit() test helper output that git would accept", () => {
    expect(commit({ tree: t1, author: "A", time: 1, message: "m" }).toString()).toMatch(
      /^tree [0-9a-f]{40}\nauthor A <a@example.com> 1 \+0000/,
    );
  });
});
