import type { Metadata } from "next";
import { PasteAnalyzer } from "@/components/paste/paste-analyzer";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Analyze a local git log",
  description: "Analyze a private or internal repository by pasting its git log. Runs entirely in your browser; nothing is uploaded.",
  alternates: { canonical: "/analyze" },
};

export default function AnalyzePage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-accent">Paste mode</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Analyze any repository from its git log</h1>
        <p className="mt-3 text-fg-muted">
          For private repos, internal monorepos, or anything too large for the online analyzer. Export the history with one command and drop
          it in.
        </p>
      </div>
      <div className="mt-10">
        <PasteAnalyzer />
      </div>
    </Container>
  );
}
