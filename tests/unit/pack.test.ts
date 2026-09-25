import { describe, expect, it } from "vitest";
import { applyDelta, hashObject, hexToKey, keyToHex, PackError, parsePack } from "@/lib/git/pack";
import { buildPack, makeDelta } from "../support/git-objects";

describe("hashObject", () => {
  it("matches git's object ids", () => {
    // `printf 'hello\n' | git hash-object --stdin`
    expect(hashObject("blob", Buffer.from("hello\n"))).toBe("ce013625030ba8dba906f756967f9e9ca394464a");
    // The empty tree.
    expect(hashObject("tree", Buffer.alloc(0))).toBe("4b825dc642cb6eb9a060e54bf8d69288fbee4904");
  });

  it("round-trips binary keys", () => {
    const hex = "ce013625030ba8dba906f756967f9e9ca394464a";
    expect(hexToKey(hex)).toHaveLength(20);
    expect(keyToHex(hexToKey(hex))).toBe(hex);
  });
});

describe("applyDelta", () => {
  const base = Buffer.from("The quick brown fox jumps over the lazy dog");

  it("copies and inserts", () => {
    const delta = makeDelta(base.length, [{ copy: [0, 10] }, { insert: "red" }, { copy: [15, 28] }]);
    expect(applyDelta(base, delta).toString()).toBe("The quick red fox jumps over the lazy dog");
  });

  it("treats a copy length of 0 as 65536", () => {
    const big = Buffer.alloc(70_000, 7);
    // base size 70000 = varint [0xf0, 0xa2, 0x04]; target 65536 = [0x80, 0x80, 0x04];
    // opcode 0x80 = copy with no offset or size bytes, meaning offset 0, size 0x10000.
    const delta = Buffer.from([0xf0, 0xa2, 0x04, 0x80, 0x80, 0x04, 0x80]);
    expect(applyDelta(big, delta)).toHaveLength(0x10000);
  });

  it("rejects a delta for a different base", () => {
    const delta = makeDelta(5, [{ insert: "x" }]);
    expect(() => applyDelta(base, delta)).toThrow(PackError);
  });
});

describe("parsePack", () => {
  const a = Buffer.from("first object, with some shared text");
  const b = Buffer.from("first object, with some other text!");

  it("reads plain objects and keys them by id", () => {
    const objects = parsePack(
      buildPack([
        { type: "tree", data: a },
        { type: "commit", data: b },
      ]),
    );
    expect(objects.size).toBe(2);
    expect(objects.get(hexToKey(hashObject("tree", a)))?.data.equals(a)).toBe(true);
    expect(objects.get(hexToKey(hashObject("commit", b)))?.type).toBe("commit");
  });

  it("resolves OFS_DELTA chains", () => {
    const d1 = makeDelta(a.length, [{ copy: [0, 24] }, { insert: "other text!" }]);
    const d2 = makeDelta(b.length, [{ copy: [0, 6] }, { insert: "!" }]);
    const objects = parsePack(
      buildPack([
        { type: "tree", data: a },
        { ofsDeltaOf: 0, delta: d1 },
        { ofsDeltaOf: 1, delta: d2 },
      ]),
    );
    expect(objects.get(hexToKey(hashObject("tree", b)))?.data.toString()).toBe(b.toString());
    expect(objects.get(hexToKey(hashObject("tree", Buffer.from("first !"))))).toBeDefined();
  });

  it("resolves REF_DELTA objects, even when the base comes later", () => {
    const d = makeDelta(a.length, [{ copy: [0, 5] }]);
    const objects = parsePack(
      buildPack([
        { refDeltaOf: hashObject("blob", a), delta: d },
        { type: "blob", data: a },
      ]),
    );
    expect(objects.get(hexToKey(hashObject("blob", Buffer.from("first"))))).toBeDefined();
  });

  it("fails clearly on thin packs and garbage", () => {
    const d = makeDelta(3, [{ insert: "x" }]);
    expect(() => parsePack(buildPack([{ refDeltaOf: "0".repeat(40), delta: d }]))).toThrow(/Unresolvable/);
    expect(() => parsePack(Buffer.from("definitely not a pack file at all"))).toThrow(/Not a packfile/);
  });
});
