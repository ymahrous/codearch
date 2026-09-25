"use client";

import type { KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/**
 * A small single-choice toggle group with radio semantics: one Tab stop, arrow keys
 * (and Home/End) move the selection, as in the WAI-ARIA radio group pattern.
 */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (v: T) => void;
}) {
  const current = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1;
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? last : e.key in STEP ? (current + STEP[e.key] + options.length) % options.length : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next].value);
    e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5"
    >
      {options.map((o, i) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={i === current ? 0 : -1}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1 text-sm transition-colors",
            o.value === value ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
