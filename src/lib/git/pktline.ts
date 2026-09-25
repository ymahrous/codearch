/**
 * Git pkt-line framing (https://git-scm.com/docs/protocol-common#_pkt_line_format).
 * Each line is prefixed with its total length as 4 hex digits. Three special
 * packets carry no data: 0000 (flush), 0001 (delimiter) and 0002 (response end).
 */

export const FLUSH = "0000";
export const DELIM = "0001";

export type Packet = { kind: "data"; data: Buffer } | { kind: "flush" } | { kind: "delim" } | { kind: "end" };

export function encodeLine(line: string): string {
  const len = Buffer.byteLength(line) + 4;
  if (len > 65520) throw new Error("pkt-line too long");
  return len.toString(16).padStart(4, "0") + line;
}

export function encodeRequest(command: string, capabilities: string[], args: string[]): string {
  return (
    encodeLine(`command=${command}\n`) +
    capabilities.map((c) => encodeLine(`${c}\n`)).join("") +
    DELIM +
    args.map((a) => encodeLine(`${a}\n`)).join("") +
    FLUSH
  );
}

export function* parsePackets(buf: Buffer): Generator<Packet> {
  let pos = 0;
  while (pos + 4 <= buf.length) {
    const hex = buf.toString("latin1", pos, pos + 4);
    const len = Number.parseInt(hex, 16);
    if (Number.isNaN(len)) throw new Error(`Malformed pkt-line length "${hex}"`);
    if (len === 0) {
      yield { kind: "flush" };
      pos += 4;
      continue;
    }
    if (len === 1) {
      yield { kind: "delim" };
      pos += 4;
      continue;
    }
    if (len === 2) {
      yield { kind: "end" };
      pos += 4;
      continue;
    }
    if (len < 4 || pos + len > buf.length) throw new Error("Truncated pkt-line stream");
    yield { kind: "data", data: buf.subarray(pos + 4, pos + len) };
    pos += len;
  }
}

/** Text lines of a pkt-line response, with trailing newlines removed. */
export function textLines(buf: Buffer): string[] {
  const out: string[] = [];
  for (const p of parsePackets(buf)) {
    if (p.kind === "data") out.push(p.data.toString("utf8").replace(/\n$/, ""));
  }
  return out;
}
