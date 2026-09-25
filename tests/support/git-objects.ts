import { deflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { hashObject, type GitObject, type ObjectType } from "@/lib/git/pack";
import { hexToKey } from "@/lib/git/pack";

/** Helpers to build git objects and packfiles by hand for tests. */

export function tree(entries: Array<[mode: string, name: string, oidHex: string]>): Buffer {
  const sorted = [...entries].sort((a, b) => {
    const x = a[0] === "40000" ? a[1] + "/" : a[1];
    const y = b[0] === "40000" ? b[1] + "/" : b[1];
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return Buffer.concat(sorted.map(([mode, name, oid]) => Buffer.concat([Buffer.from(`${mode} ${name}\0`), Buffer.from(oid, "hex")])));
}

export function commit(o: { tree: string; parents?: string[]; author: string; time: number; message: string }): Buffer {
  const lines = [
    `tree ${o.tree}`,
    ...(o.parents ?? []).map((p) => `parent ${p}`),
    `author ${o.author} <a@example.com> ${o.time} +0000`,
    `committer ${o.author} <a@example.com> ${o.time} +0000`,
  ];
  return Buffer.from(lines.join("\n") + "\n\n" + o.message + "\n");
}

/** A fake blob id; blob-less packs never contain the blobs themselves. */
export const blobId = (content: string) => hashObject("blob", Buffer.from(content));

/** Tiny in-memory repo: add objects, get back their hex ids, and an objects map keyed like parsePack's. */
export class ObjectDb {
  objects = new Map<string, GitObject>();
  add(type: ObjectType, data: Buffer): string {
    const hex = hashObject(type, data);
    this.objects.set(hexToKey(hex), { type, data });
    return hex;
  }
  tree(entries: Array<[string, string, string]>) {
    return this.add("tree", tree(entries));
  }
  commit(o: Parameters<typeof commit>[0]) {
    return this.add("commit", commit(o));
  }
}

const TYPE_NUM: Record<ObjectType, number> = { commit: 1, tree: 2, blob: 3, tag: 4 };

function header(type: number, size: number): Buffer {
  const bytes: number[] = [];
  let c = (type << 4) | (size & 15);
  size = Math.floor(size / 16);
  while (size > 0) {
    bytes.push(c | 0x80);
    c = size & 0x7f;
    size = Math.floor(size / 128);
  }
  bytes.push(c);
  return Buffer.from(bytes);
}

function ofsEncode(rel: number): Buffer {
  const bytes = [rel & 0x7f];
  rel = Math.floor(rel / 128);
  while (rel > 0) {
    rel -= 1;
    bytes.unshift(0x80 | (rel & 0x7f));
    rel = Math.floor(rel / 128);
  }
  return Buffer.from(bytes);
}

export type PackEntry = { type: ObjectType; data: Buffer } | { ofsDeltaOf: number; delta: Buffer } | { refDeltaOf: string; delta: Buffer };

/** Builds a version-2 packfile. `ofsDeltaOf` is the index of an earlier entry. */
export function buildPack(entries: PackEntry[]): Buffer {
  const parts: Buffer[] = [];
  const offsets: number[] = [];
  const head = Buffer.alloc(12);
  head.write("PACK", 0, "latin1");
  head.writeUInt32BE(2, 4);
  head.writeUInt32BE(entries.length, 8);
  parts.push(head);
  let pos = 12;
  for (const e of entries) {
    offsets.push(pos);
    let chunk: Buffer;
    if ("type" in e) chunk = Buffer.concat([header(TYPE_NUM[e.type], e.data.length), deflateSync(e.data)]);
    else if ("ofsDeltaOf" in e)
      chunk = Buffer.concat([header(6, e.delta.length), ofsEncode(pos - offsets[e.ofsDeltaOf]), deflateSync(e.delta)]);
    else chunk = Buffer.concat([header(7, e.delta.length), Buffer.from(e.refDeltaOf, "hex"), deflateSync(e.delta)]);
    parts.push(chunk);
    pos += chunk.length;
  }
  const body = Buffer.concat(parts);
  return Buffer.concat([body, createHash("sha1").update(body).digest()]);
}

const varint = (n: number) => {
  const out: number[] = [];
  do {
    let b = n & 0x7f;
    n = Math.floor(n / 128);
    if (n) b |= 0x80;
    out.push(b);
  } while (n);
  return out;
};

/** Delta that copies `copy` = [offset, length] ranges from the base and inserts literal strings. */
export function makeDelta(baseLen: number, ops: Array<{ copy: [number, number] } | { insert: string }>): Buffer {
  const body: number[] = [];
  let target = 0;
  for (const op of ops) {
    if ("copy" in op) {
      const [off, len] = op.copy;
      const bytes: number[] = [];
      let cmd = 0x80;
      for (let i = 0; i < 4; i++) {
        const b = (off >> (8 * i)) & 0xff;
        if (b) {
          cmd |= 1 << i;
          bytes.push(b);
        }
      }
      for (let i = 0; i < 3; i++) {
        const b = (len >> (8 * i)) & 0xff;
        if (b) {
          cmd |= 1 << (4 + i);
          bytes.push(b);
        }
      }
      body.push(cmd, ...bytes);
      target += len;
    } else {
      const data = Buffer.from(op.insert);
      body.push(data.length, ...data);
      target += data.length;
    }
  }
  return Buffer.from([...varint(baseLen), ...varint(target), ...body]);
}
