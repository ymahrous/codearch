import { cn } from "@/lib/cn";

/** Stacked strata mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <rect x="2" y="3" width="20" height="4" rx="1" fill="var(--s0)" />
      <rect x="2" y="8" width="20" height="5" rx="1" fill="var(--s1)" />
      <rect x="2" y="14" width="20" height="3" rx="1" fill="var(--s2)" />
      <rect x="2" y="18" width="20" height="3" rx="1" fill="var(--s3)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight text-fg", className)}>
      <LogoMark />
      <span>
        Codebase <span className="text-accent">Archaeology</span>
      </span>
    </span>
  );
}
