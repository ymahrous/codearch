import { NextRequest } from "next/server";
import { parseRepoInput } from "@/lib/archaeology/repo-input";
import type { ApiError, DigResponse } from "@/lib/archaeology/types";
import { config } from "@/lib/server/config";
import { AppError } from "@/lib/server/errors";
import { excavate, isCached } from "@/lib/server/excavate";
import { clientIdFrom, rateLimit } from "@/lib/server/rate-limit";
import { getStore } from "@/lib/server/store";

// Large repos can take a while to download and analyze.
export const maxDuration = 300;

const errorJson = (e: AppError, headers: HeadersInit = {}) =>
  Response.json({ error: { code: e.code, message: e.message } } satisfies ApiError, {
    status: e.status,
    headers: { "Cache-Control": "no-store", ...headers },
  });

/**
 * GET /api/dig?repo=owner/name[&refresh=1]
 * Returns the archaeology report for a public repository.
 */
export async function GET(request: NextRequest) {
  const repo = request.nextUrl.searchParams.get("repo") ?? "";
  const refresh = ["1", "true"].includes(request.nextUrl.searchParams.get("refresh") ?? "");
  const target = parseRepoInput(repo);
  if (!target) {
    return errorJson(new AppError("invalid_input", "Enter a repository as owner/name, or paste its GitHub, GitLab or Codeberg URL."));
  }

  // Only new work counts toward the limit; cached reports are free.
  const rateHeaders: Record<string, string> = {};
  if (refresh || !(await isCached(repo))) {
    const cfg = config();
    const rl = await rateLimit(getStore(), clientIdFrom(request.headers), cfg.digsPerWindow, cfg.rateWindowSeconds);
    if (Number.isFinite(rl.remaining)) {
      rateHeaders["RateLimit-Limit"] = String(rl.limit);
      rateHeaders["RateLimit-Remaining"] = String(rl.remaining);
      rateHeaders["RateLimit-Reset"] = String(rl.resetIn);
    }
    if (!rl.allowed) {
      const mins = Math.max(1, Math.ceil(rl.resetIn / 60));
      return errorJson(
        new AppError(
          "rate_limited",
          `You've started ${rl.limit} new analyses recently. Try again in about ${mins} min, or open a repository that's already been analyzed.`,
        ),
        { ...rateHeaders, "Retry-After": String(rl.resetIn) },
      );
    }
  }

  const timings: string[] = [];
  try {
    const result = await excavate(repo, { refresh, onTiming: (phase, ms) => timings.push(`${phase};dur=${ms}`) });
    return Response.json(result satisfies DigResponse, {
      headers: {
        ...rateHeaders,
        // Let Vercel's CDN serve repeat requests for a few minutes.
        "Cache-Control": refresh ? "no-store" : "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
        ...(timings.length ? { "Server-Timing": timings.join(", ") } : {}),
      },
    });
  } catch (e) {
    const err = e instanceof AppError ? e : new AppError("internal", "Something went wrong while reading this repository.");
    if (!(e instanceof AppError)) console.error("dig failed", e);
    return errorJson(err, rateHeaders);
  }
}
