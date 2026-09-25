import { describe, expect, it } from "vitest";
import { LOG_COMMAND, parseLog } from "@/lib/archaeology/log-format";

const US = "\x1f";

describe("parseLog", () => {
  it("parses the unit-separator format, including | in names and subjects", () => {
    const log = [
      `@@abc12345${US}Ada | Lovelace${US}200${US}feat: a | b`,
      "",
      "M\tsrc/a.ts",
      'A\t"docs/caf\\303\\251.md"',
      `@@def67890${US}Grace${US}100${US}init`,
      "",
      "A\tREADME.md",
    ].join("\n");
    const commits = parseLog(log);
    expect(commits).toHaveLength(2);
    expect(commits[0]).toMatchObject({ h: "def67890", a: "Grace", t: 100, s: "init", f: [["A", "README.md"]] });
    expect(commits[1].a).toBe("Ada | Lovelace");
    expect(commits[1].s).toBe("feat: a | b");
    expect(commits[1].f).toEqual([
      ["M", "src/a.ts"],
      ["A", "docs/caf\\303\\251.md"],
    ]);
  });

  it("still accepts the older | format", () => {
    const commits = parseLog("@@abc|Ada|100|fix: x|y\n\nD\told.txt\n");
    expect(commits[0]).toMatchObject({ a: "Ada", t: 100, s: "fix: x|y", f: [["D", "old.txt"]] });
  });

  it("splits renames into delete + add and keeps copies as adds", () => {
    const [c] = parseLog(`@@a${US}A${US}1${US}s\nR087\told.ts\tnew.ts\nC100\tx.ts\ty.ts\n`);
    expect(c.f).toEqual([
      ["D", "old.ts"],
      ["A", "new.ts"],
      ["A", "y.ts"],
    ]);
  });

  it("ignores junk lines and headers with a bad timestamp", () => {
    expect(parseLog("hello\nworld\n@@a|b|notanumber|s\nM\tx\n")).toEqual([]);
    expect(parseLog("")).toEqual([]);
  });

  it("handles CRLF line endings", () => {
    const [c] = parseLog(`@@a${US}A${US}1${US}s\r\n\r\nM\tx.ts\r\n`);
    expect(c.f).toEqual([["M", "x.ts"]]);
  });

  it("documents a command that uses the same separators", () => {
    expect(LOG_COMMAND).toContain("%x1f");
    expect(LOG_COMMAND).toContain("--name-status");
  });
});
