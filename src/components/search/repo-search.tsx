"use client";

import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { parseRepoInput } from "@/lib/archaeology/repo-input";
import { cn } from "@/lib/cn";

export function RepoSearch({
  defaultValue = "",
  size = "lg",
  autoFocus = false,
}: {
  defaultValue?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const target = parseRepoInput(value);
    if (!target) {
      setError("Enter a repository as owner/name, like vercel/swr, or paste a GitHub, GitLab or Codeberg URL.");
      return;
    }
    setError(null);
    router.push(target.appPath);
  };

  return (
    <form onSubmit={submit} role="search" aria-label="Analyze a repository" noValidate className="w-full">
      <label htmlFor={id} className="sr-only">
        Repository
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-surface p-1.5 shadow-sm transition-colors focus-within:border-ring",
          error ? "border-danger" : "border-border-strong",
        )}
      >
        <Search className="ml-2.5 size-5 shrink-0 text-fg-subtle" aria-hidden />
        <input
          id={id}
          name="repo"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="owner/repo or https://github.com/owner/repo"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus={autoFocus}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent font-mono outline-none placeholder:font-sans placeholder:text-fg-subtle",
            size === "lg" ? "h-11 text-base" : "h-9 text-sm",
          )}
        />
        <Button type="submit" size={size === "lg" ? "md" : "sm"}>
          Analyze <ArrowRight aria-hidden />
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
