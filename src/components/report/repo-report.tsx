"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiError, DigResponse } from "@/lib/archaeology/types";
import { DigError, DigProgress } from "./dig-status";
import { ReportView } from "./report-view";

type State =
  { status: "loading" } | { status: "ready"; data: DigResponse; refreshing: boolean } | { status: "error"; message: string; code?: string };

async function fetchReport(repoInput: string, refresh: boolean, signal: AbortSignal): Promise<DigResponse> {
  const qs = new URLSearchParams({ repo: repoInput });
  if (refresh) qs.set("refresh", "1");
  const res = await fetch(`/api/dig?${qs}`, { signal });
  const body = (await res.json().catch(() => null)) as DigResponse | ApiError | null;
  if (!res.ok || !body || "error" in body) {
    const err = body && "error" in body ? body.error : { code: "internal", message: "The server returned an unexpected response." };
    throw Object.assign(new Error(err.message), { code: err.code });
  }
  return body;
}

/** Loads a repository report from the API and renders progress, errors and the result. */
export function RepoReport({ repoInput, slug }: { repoInput: string; slug: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  // Each request is identified by an attempt number; bumping it (re)starts a fetch.
  const [attempt, setAttempt] = useState({ n: 0, refresh: false });

  useEffect(() => {
    const ctrl = new AbortController();
    fetchReport(repoInput, attempt.refresh, ctrl.signal).then(
      (data) => setState({ status: "ready", data, refreshing: false }),
      (e: Error & { code?: string }) => {
        if (ctrl.signal.aborted) return;
        setState({
          status: "error",
          message: e.name === "TypeError" ? "Couldn't reach the server. Check your connection and try again." : e.message,
          code: e.code,
        });
      },
    );
    return () => ctrl.abort();
  }, [repoInput, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((a) => ({ n: a.n + 1, refresh: false }));
  }, []);
  const refresh = useCallback(() => {
    setState((s) => (s.status === "ready" ? { ...s, refreshing: true } : { status: "loading" }));
    setAttempt((a) => ({ n: a.n + 1, refresh: true }));
  }, []);

  if (state.status === "loading") return <DigProgress slug={slug} />;
  if (state.status === "error") return <DigError message={state.message} code={state.code} onRetry={retry} />;
  return (
    <ReportView
      report={state.data.report}
      meta={state.data.meta}
      cached={state.data.cached}
      refreshing={state.refreshing}
      onRefresh={refresh}
    />
  );
}
