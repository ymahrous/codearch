import { describe, expect, it } from "vitest";
import { analyze, busFactor, folderOf, folderStatus, isBot, mergeAuthorCase, YEAR_SECONDS } from "@/lib/archaeology/analyze";
import type { Commit } from "@/lib/archaeology/types";

const Y = (year: number, day = 0) => Date.UTC(year, 0, 1 + day) / 1000;
const c = (h: string, a: string, t: number, s: string, f: Commit["f"]): Commit => ({ h, a, t, s, f });

// A small, fully known history.
const history: Commit[] = [
  c("1", "Ada", Y(2018), "init", [
    ["A", "README.md"],
    ["A", "src/app.ts"],
    ["A", "src/util/math.ts"],
    ["A", "docs/intro.md"],
  ]),
  c("2", "ada", Y(2018, 10), "tweak", [["M", "src/app.ts"]]),
  c("3", "Ada", Y(2018, 20), "math", [["M", "src/util/math.ts"]]),
  c("4", "Grace", Y(2019), "grace joins", [
    ["M", "src/app.ts"],
    ["A", "src/util/strings.ts"],
  ]),
  c("5", "Grace", Y(2019, 5), "more", [["M", "src/app.ts"]]),
  c("6", "Grace", Y(2019, 6), "more", [["M", "src/util/strings.ts"]]),
  c("7", "dependabot[bot]", Y(2019, 7), "bump", [["M", "package.json"]]),
  c("8", "Linus", Y(2021), "remove docs", [
    ["D", "docs/intro.md"],
    ["M", "src/app.ts"],
  ]),
  c("9", "Grace", Y(2021, 1), "", []), // merge commit: no files
];

describe("helpers", () => {
  it("detects bots", () => {
    expect(isBot("dependabot[bot]")).toBe(true);
    expect(isBot("renovate-bot")).toBe(true);
    expect(isBot("github-actions")).toBe(true);
    expect(isBot("Ada Botanist")).toBe(false);
  });

  it("merges case variants onto the most common spelling", () => {
    const merged = mergeAuthorCase([c("1", "tj", 1, "", []), c("2", "TJ", 2, "", []), c("3", "TJ", 3, "", [])]);
    expect(merged.map((x) => x.a)).toEqual(["TJ", "TJ", "TJ"]);
  });

  it("computes folder keys", () => {
    expect(folderOf("README.md", 1)).toBe("(root files)");
    expect(folderOf("src/app.ts", 1)).toBe("src/");
    expect(folderOf("src/util/math.ts", 1)).toBe("src/");
    expect(folderOf("src/util/math.ts", 2)).toBe("src/util/");
    expect(folderOf("src/app.ts", 2)).toBe("src/");
  });

  it("computes bus factor", () => {
    expect(busFactor([10])).toBe(1);
    expect(busFactor([6, 4])).toBe(1);
    expect(busFactor([4, 4, 4])).toBe(2);
    expect(busFactor([1, 1, 1, 1])).toBe(2);
  });

  it("classifies folder status by age", () => {
    expect(folderStatus(0)).toBe("active");
    expect(folderStatus(2 * YEAR_SECONDS)).toBe("quiet");
    expect(folderStatus(4 * YEAR_SECONDS)).toBe("fossil");
  });
});

describe("analyze", () => {
  const r = analyze(history, { name: "test/repo", source: "paste", now: 42 });

  it("counts commits and merged contributors", () => {
    expect(r.stats.commits).toBe(9);
    expect(r.stats.contributors).toBe(4); // Ada (merged with ada), Grace, Linus, bot
    expect(r.generatedAt).toBe(42);
    expect(r.top.map((t) => t.name)).toEqual(["Grace", "Ada", "Linus"]);
    expect(r.otherCommits).toBe(1);
  });

  it("builds year layers newest first, filling empty years", () => {
    expect(r.years.map((y) => [y.year, y.commits])).toEqual([
      [2021, 2],
      [2020, 0],
      [2019, 4],
      [2018, 3],
    ]);
    const y2019 = r.years.find((y) => y.year === 2019)!;
    expect(y2019.segments).toEqual([
      { idx: 0, n: 3 },
      { idx: -1, n: 1 },
    ]);
  });

  it("finds eras, newest first, skipping bots (ties go to whoever committed first that year)", () => {
    expect(r.eras.map((e) => [e.name, e.from, e.to])).toEqual([
      ["Linus", 2021, 2021],
      ["Grace", 2019, 2019],
      ["Ada", 2018, 2018],
    ]);
    expect(r.eras[2].share).toBe(1);
    expect(r.eras[1].share).toBe(0.75); // Grace made 3 of 2019's 4 commits
  });

  it("computes territory with and without bots", () => {
    const top = r.territory["1|nobots"];
    const src = top.find((t) => t.folder === "src/")!;
    expect(src.commits).toBe(7);
    expect(src.owner).toBe("Ada"); // 3-3 tie with Grace; Ada was first
    expect(src.share).toBeCloseTo(3 / 7);
    expect(src.busFactor).toBe(2);
    expect(top.find((t) => t.folder === "(root files)")).toMatchObject({ commits: 1, owner: "Ada" });
    expect(r.territory["1|bots"].find((t) => t.folder === "(root files)")!.commits).toBe(2);
    expect(r.territory["2|nobots"].some((t) => t.folder === "src/util/")).toBe(true);
  });

  it("tracks surviving files and fossils", () => {
    // README, app, math, strings, plus package.json (modified but never seen added: history may be partial).
    expect(r.stats.survivingFiles).toBe(5);
    expect(r.oldest[0]).toMatchObject({ path: "README.md", author: "Ada" });
    expect(r.oldest.map((f) => f.path)).not.toContain("docs/intro.md");
    expect(r.oldest.map((f) => f.path)).not.toContain("package.json"); // never saw it being added
    expect(r.untouched[0].path).toBe("README.md");
  });

  it("limits fossils to files at HEAD when given", () => {
    const r2 = analyze(history, { name: "x", source: "git", head: ["src/app.ts"] });
    expect(r2.stats.survivingFiles).toBe(1);
  });

  it("computes notes", () => {
    expect(r.notes.first).toMatchObject({ author: "Ada", message: "init" });
    expect(r.notes.biggest.files).toBe(4);
    expect(r.notes.gap!.seconds).toBe(Y(2021) - Y(2019, 7));
    expect(r.notes.oneTimers).toBe(2); // Linus, bot
    expect(r.notes.botCommits).toBe(1);
    expect(r.notes.mostEdited).toEqual({ path: "src/app.ts", edits: 5 });
    expect(r.notes.peakHourUtc).toBe(0);
  });

  it("rejects an empty history", () => {
    expect(() => analyze([], { name: "x", source: "paste" })).toThrow(/No commits/);
  });

  it("does not mutate its input", () => {
    const copy = JSON.stringify(history);
    analyze(history, { name: "x", source: "paste" });
    expect(JSON.stringify(history)).toBe(copy);
  });
});
