import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-24 text-center sm:py-32">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Nothing buried here</h1>
      <p className="mt-3 max-w-md text-fg-muted">
        This page doesn&apos;t exist. If you were looking for a repository, check the address is in the form owner/name.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Search repositories</ButtonLink>
        <ButtonLink href="/how-it-works" variant="outline">
          How it works
        </ButtonLink>
      </div>
    </Container>
  );
}
