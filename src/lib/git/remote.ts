import { encodeRequest, parsePackets, textLines } from "./pktline";
import { parsePack } from "./pack";
import { buildHistory } from "./history";
import type { Commit } from "@/lib/archaeology/types";

/**
 * Reads a public repository's history over git's smart HTTP protocol v2,
 * without a git binary: `ls-refs` finds HEAD, then `fetch` with
 * `filter blob:none` downloads only commits and trees.
 */

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface RemoteOptions {
  fetch?: FetchLike;
  timeoutMs?: number;
  maxPackBytes?: number;
  userAgent?: string;
  /** Receives phase durations in ms (download, parse, history) for logging / Server-Timing. */
  onTiming?: (phase: "download" | "parse" | "history", ms: number) => void;
}

export type RemoteErrorCode = "not_found" | "empty" | "too_large" | "timeout" | "unsupported" | "network";

export class RemoteError extends Error {
  constructor(
    public code: RemoteErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const AGENT = "git/2.45.0 codearch";

async function readCapped(res: Response, max: number): Promise<Buffer> {
  if (!res.body) return Buffer.from(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      throw new RemoteError("too_large", `The repository history is larger than ${Math.round(max / 1e6)} MB.`);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

type RemoteHistory = { commits: Commit[]; headFiles: string[]; headOid: string; packBytes: number };

export async function readRemoteHistory(cloneUrl: string, opts: RemoteOptions = {}): Promise<RemoteHistory> {
  const signal = AbortSignal.timeout(opts.timeoutMs ?? 60_000);
  try {
    return await read(cloneUrl, opts, signal);
  } catch (e) {
    // The timeout can also fire while a response body is streaming, outside `call`.
    if (!(e instanceof RemoteError) && signal.aborted) throw new RemoteError("timeout", "The git host took too long to respond.");
    throw e;
  }
}

async function read(cloneUrl: string, opts: RemoteOptions, signal: AbortSignal): Promise<RemoteHistory> {
  const doFetch = opts.fetch ?? ((i, init) => fetch(i, init));
  const maxBytes = opts.maxPackBytes ?? 250_000_000;
  const base = cloneUrl.replace(/\/+$/, "");
  const headers = {
    "Git-Protocol": "version=2",
    "User-Agent": opts.userAgent ?? AGENT,
  };

  const call = async (url: string, init: RequestInit) => {
    try {
      return await doFetch(url, { ...init, signal, redirect: "follow" });
    } catch (e) {
      if ((e as Error).name === "TimeoutError" || signal.aborted) {
        throw new RemoteError("timeout", "The git host took too long to respond.");
      }
      throw new RemoteError("network", "Couldn't reach the git host.");
    }
  };

  // 1. Capability advertisement: confirms protocol v2 and blob filtering.
  const adv = await call(`${base}/info/refs?service=git-upload-pack`, { headers });
  if (adv.status === 401 || adv.status === 403 || adv.status === 404) {
    throw new RemoteError("not_found", "Repository not found, or it isn't public.");
  }
  if (!adv.ok) throw new RemoteError("network", `The git host answered ${adv.status}.`);
  const caps = textLines(Buffer.from(await adv.arrayBuffer()));
  if (!caps.includes("version 2")) throw new RemoteError("unsupported", "This git host doesn't support protocol v2.");
  const fetchCap = caps.find((l) => l.startsWith("fetch"));
  if (!fetchCap || !/\bfilter\b/.test(fetchCap)) {
    throw new RemoteError("unsupported", "This git host doesn't support partial (blob-less) fetches.");
  }

  const post = (body: string) =>
    call(`${base}/git-upload-pack`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-git-upload-pack-request",
        Accept: "application/x-git-upload-pack-result",
      },
      body,
    });

  // 2. ls-refs: where does HEAD point?
  const refsRes = await post(encodeRequest("ls-refs", [`agent=${AGENT}`], ["symrefs", "ref-prefix HEAD"]));
  if (!refsRes.ok) throw new RemoteError("network", `ls-refs failed with ${refsRes.status}.`);
  const headLine = textLines(Buffer.from(await refsRes.arrayBuffer())).find((l) => / HEAD( |$)/.test(l));
  if (!headLine || headLine.startsWith("unborn")) throw new RemoteError("empty", "This repository has no commits yet.");
  const headOid = headLine.split(" ")[0];
  if (!/^[0-9a-f]{40}$/.test(headOid)) throw new RemoteError("unsupported", "Only SHA-1 repositories are supported.");

  // 3. fetch: commits + trees only.
  let mark = Date.now();
  const lap = (phase: "download" | "parse" | "history") => {
    const now = Date.now();
    opts.onTiming?.(phase, now - mark);
    mark = now;
  };
  const packRes = await post(
    encodeRequest("fetch", [`agent=${AGENT}`], ["no-progress", "ofs-delta", "filter blob:none", `want ${headOid}`, "done"]),
  );
  if (!packRes.ok) throw new RemoteError("network", `fetch failed with ${packRes.status}.`);
  const raw = await readCapped(packRes, maxBytes + 1_000_000);

  // Response is sectioned; after "packfile" every packet is side-band multiplexed.
  const parts: Buffer[] = [];
  let inPack = false;
  for (const p of parsePackets(raw)) {
    if (p.kind !== "data") continue;
    if (!inPack) {
      const line = p.data.toString("utf8").trim();
      if (line === "packfile") inPack = true;
      else if (line.startsWith("ERR ")) throw new RemoteError("network", `Git host error: ${line.slice(4)}`);
      continue;
    }
    const band = p.data[0];
    if (band === 1) parts.push(p.data.subarray(1));
    else if (band === 3) throw new RemoteError("network", `Git host error: ${p.data.subarray(1).toString("utf8").trim()}`);
  }
  if (!inPack) throw new RemoteError("network", "The git host didn't send a packfile.");
  const pack = Buffer.concat(parts);
  if (pack.length > maxBytes) {
    throw new RemoteError("too_large", `The repository history is larger than ${Math.round(maxBytes / 1e6)} MB.`);
  }

  lap("download");
  const objects = parsePack(pack);
  lap("parse");
  const { commits, headFiles } = buildHistory(objects, headOid);
  lap("history");
  return { commits, headFiles, headOid, packBytes: pack.length };
}
