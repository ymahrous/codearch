import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";

/**
 * Minimal packfile reader (https://git-scm.com/docs/pack-format).
 * Resolves OFS_DELTA and REF_DELTA objects and returns every object keyed by
 * its SHA-1 (as a binary key, see {@link hexToKey}). Blob-less clones only contain commits and trees, so everything fits
 * in memory for repos of normal size.
 */

export type ObjectType = "commit" | "tree" | "blob" | "tag";
export interface GitObject {
  type: ObjectType;
  data: Buffer;
}

const TYPES: Record<number, ObjectType> = { 1: "commit", 2: "tree", 3: "blob", 4: "tag" };
const OFS_DELTA = 6;
const REF_DELTA = 7;

interface Entry {
  offset: number;
  type: number;
  data: Buffer; // inflated payload (object body or delta instructions)
  baseOffset?: number;
  baseOid?: string;
}

export class PackError extends Error {}

/** Hex SHA-1 of a git object. */
export function hashObject(type: ObjectType, data: Buffer): string {
  return rawHash(type, data).toString("hex");
}

function rawHash(type: ObjectType, data: Buffer): Buffer {
  return createHash("sha1").update(`${type} ${data.length}\0`).update(data).digest();
}

/**
 * Object ids are kept as 20-character binary (latin1) strings internally:
 * half the size of hex and much cheaper to slice out of tree objects.
 */
export const hexToKey = (hex: string) => Buffer.from(hex, "hex").toString("latin1");
export const keyToHex = (key: string) => Buffer.from(key, "latin1").toString("hex");

/** Inflates one zlib stream starting at `pos`; returns the output and how many input bytes it used. */
function inflateAt(buf: Buffer, pos: number, size: number): { out: Buffer; used: number } {
  // Sizing the output chunk from the header avoids a 16 KB allocation per object,
  // which otherwise dominates run time through garbage collection.
  const res = inflateSync(buf.subarray(pos), { info: true, chunkSize: Math.max(64, size + 32) }) as unknown as {
    buffer: Buffer;
    engine: { bytesWritten: number };
  };
  return { out: res.buffer, used: res.engine.bytesWritten };
}

export function applyDelta(base: Buffer, delta: Buffer): Buffer {
  let pos = 0;
  const varint = () => {
    let result = 0,
      shift = 0,
      b: number;
    do {
      b = delta[pos++];
      result += (b & 0x7f) * 2 ** shift;
      shift += 7;
    } while (b & 0x80);
    return result;
  };
  const srcSize = varint();
  if (srcSize !== base.length) throw new PackError("Delta base size mismatch");
  const out = Buffer.allocUnsafe(varint());
  let o = 0;
  while (pos < delta.length) {
    const op = delta[pos++];
    if (op & 0x80) {
      let cpOff = 0,
        cpLen = 0;
      if (op & 0x01) cpOff |= delta[pos++];
      if (op & 0x02) cpOff |= delta[pos++] << 8;
      if (op & 0x04) cpOff |= delta[pos++] << 16;
      if (op & 0x08) cpOff = (cpOff | (delta[pos++] << 24)) >>> 0;
      if (op & 0x10) cpLen |= delta[pos++];
      if (op & 0x20) cpLen |= delta[pos++] << 8;
      if (op & 0x40) cpLen |= delta[pos++] << 16;
      if (cpLen === 0) cpLen = 0x10000;
      base.copy(out, o, cpOff, cpOff + cpLen);
      o += cpLen;
    } else if (op > 0) {
      delta.copy(out, o, pos, pos + op);
      o += op;
      pos += op;
    } else {
      throw new PackError("Invalid delta opcode 0");
    }
  }
  if (o !== out.length) throw new PackError("Delta result size mismatch");
  return out;
}

export function parsePack(pack: Buffer): Map<string, GitObject> {
  if (pack.length < 32 || pack.toString("latin1", 0, 4) !== "PACK") throw new PackError("Not a packfile");
  const version = pack.readUInt32BE(4);
  if (version !== 2 && version !== 3) throw new PackError(`Unsupported pack version ${version}`);
  const count = pack.readUInt32BE(8);

  const entries: Entry[] = [];
  const byOffset = new Map<number, Entry>();
  let pos = 12;
  for (let i = 0; i < count; i++) {
    const offset = pos;
    let c = pack[pos++];
    const type = (c >> 4) & 7;
    let size = c & 15;
    let shift = 4;
    while (c & 0x80) {
      c = pack[pos++];
      size += (c & 0x7f) * 2 ** shift;
      shift += 7;
    }

    const entry: Entry = { offset, type, data: Buffer.alloc(0) };
    if (type === OFS_DELTA) {
      c = pack[pos++];
      let rel = c & 0x7f;
      while (c & 0x80) {
        c = pack[pos++];
        rel = (rel + 1) * 128 + (c & 0x7f);
      }
      entry.baseOffset = offset - rel;
    } else if (type === REF_DELTA) {
      entry.baseOid = pack.toString("latin1", pos, pos + 20);
      pos += 20;
    } else if (!TYPES[type]) {
      throw new PackError(`Unknown object type ${type} at offset ${offset}`);
    }
    const { out, used } = inflateAt(pack, pos, size);
    if (out.length !== size) throw new PackError(`Object at offset ${offset} has the wrong size`);
    entry.data = out;
    pos += used;
    entries.push(entry);
    byOffset.set(offset, entry);
  }

  const objects = new Map<string, GitObject>();
  const resolved = new Map<number, GitObject>();

  const resolve = (start: Entry): GitObject | null => {
    // Walk down the delta chain, then apply deltas back up (iterative: chains can be deep).
    const chain: Entry[] = [];
    let cur: Entry | undefined = start;
    let base: GitObject | undefined;
    while (cur) {
      const done = resolved.get(cur.offset);
      if (done) {
        base = done;
        break;
      }
      if (cur.type !== OFS_DELTA && cur.type !== REF_DELTA) {
        base = { type: TYPES[cur.type], data: cur.data };
        resolved.set(cur.offset, base);
        break;
      }
      chain.push(cur);
      if (cur.type === OFS_DELTA) cur = byOffset.get(cur.baseOffset!);
      else {
        const ext = objects.get(cur.baseOid!);
        if (ext) {
          base = ext;
          break;
        }
        return null; // base not resolved yet; retry in a later pass
      }
    }
    if (!base) throw new PackError("Delta base missing from pack");
    for (let i = chain.length - 1; i >= 0; i--) {
      base = { type: base.type, data: applyDelta(base.data, chain[i].data) };
      resolved.set(chain[i].offset, base);
    }
    return base;
  };

  let pending = entries;
  while (pending.length) {
    const next: Entry[] = [];
    for (const e of pending) {
      const obj = resolve(e);
      if (!obj) {
        next.push(e);
        continue;
      }
      objects.set(rawHash(obj.type, obj.data).toString("latin1"), obj);
    }
    if (next.length === pending.length) throw new PackError("Unresolvable REF_DELTA objects (thin pack?)");
    pending = next;
  }
  return objects;
}
