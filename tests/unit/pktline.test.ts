import { describe, expect, it } from "vitest";
import { encodeLine, encodeRequest, parsePackets, textLines } from "@/lib/git/pktline";

describe("pkt-line", () => {
  it("encodes lengths including the 4-byte prefix", () => {
    expect(encodeLine("a\n")).toBe("0006a\n");
    expect(encodeLine("command=ls-refs\n")).toBe("0014command=ls-refs\n");
  });

  it("encodes a v2 command with delimiter and flush", () => {
    expect(encodeRequest("ls-refs", ["agent=x"], ["symrefs"])).toBe("0014command=ls-refs\n000cagent=x\n0001000csymrefs\n0000");
  });

  it("parses data and special packets", () => {
    const buf = Buffer.from("0006a\n00010000000ahello\n0002");
    const kinds = [...parsePackets(buf)].map((p) => (p.kind === "data" ? p.data.toString() : p.kind));
    expect(kinds).toEqual(["a\n", "delim", "flush", "hello\n", "end"]);
    expect(textLines(buf)).toEqual(["a", "hello"]);
  });

  it("rejects malformed or truncated input", () => {
    expect(() => [...parsePackets(Buffer.from("zzzz"))]).toThrow(/Malformed/);
    expect(() => [...parsePackets(Buffer.from("0010abc"))]).toThrow(/Truncated/);
  });
});
