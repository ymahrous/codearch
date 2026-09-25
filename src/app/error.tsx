"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Container className="flex flex-col items-center py-24 text-center sm:py-32">
      <p className="font-mono text-sm text-danger">Error</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 max-w-md text-fg-muted">An unexpected error stopped this page from loading. Try again, or head back home.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-fg-subtle">Reference: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <ButtonLink href="/" variant="outline">
          Go home
        </ButtonLink>
      </div>
    </Container>
  );
}
