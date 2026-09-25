"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STEPS = [
  "Finding the repository",
  "Downloading commit history (no file contents)",
  "Reading every commit",
  "Sorting the layers",
  "Labelling fossils",
];

export function DigProgress({ slug }: { slug: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="space-y-8" aria-busy="true">
      <div>
        <Skeleton className="h-5 w-40" />
        <h1 className="mt-3 font-mono text-2xl font-semibold tracking-tight sm:text-3xl">{slug}</h1>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6">
        <ol className="space-y-3" aria-live="polite">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span
                className={
                  i < step
                    ? "size-2 rounded-full bg-success"
                    : i === step
                      ? "size-2 animate-pulse rounded-full bg-accent"
                      : "size-2 rounded-full bg-surface-3"
                }
                aria-hidden
              />
              <span className={i <= step ? "text-fg" : "text-fg-subtle"}>
                {s}
                {i === step && <span className="sr-only"> (in progress)</span>}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-xs text-fg-subtle">Large repositories can take up to a minute.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-1.5 rounded-xl border border-border bg-surface p-5">
          {[40, 64, 30, 52, 72, 44, 24, 58].map((h, i) => (
            <div key={i} style={{ height: h }}>
              <Skeleton className="h-full w-full rounded-none" />
            </div>
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

export function DigError({ message, code, onRetry }: { message: string; code?: string; onRetry?: () => void }) {
  const retryable = !code || ["timeout", "upstream", "internal", "rate_limited"].includes(code);
  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
        <div>
          <h2 className="font-semibold text-fg">We couldn&apos;t analyze this repository</h2>
          <p className="mt-1 text-sm text-fg-muted">{message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {retryable && onRetry && (
              <Button size="sm" onClick={onRetry}>
                Try again
              </Button>
            )}
            <ButtonLink href="/analyze" size="sm" variant="outline">
              Paste a local git log instead
            </ButtonLink>
            <ButtonLink href="/" size="sm" variant="ghost">
              Back to search
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
