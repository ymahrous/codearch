import type { Metadata } from "next";
import { ProsePage } from "@/components/ui/prose";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `Terms for using ${site.name}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ProsePage eyebrow="Legal" title="Terms of use" updated="September 25, 2026">
      <h2>The service</h2>
      <p>
        {site.name} is a free tool that summarizes the public history of git repositories. It is provided as is, without warranties of any
        kind, and may change or become unavailable at any time.
      </p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Don&apos;t use automated tools to send large volumes of requests, or try to get around the rate limits.</li>
        <li>Don&apos;t use the service to harass or profile individual contributors.</li>
      </ul>
      <h2>Content</h2>
      <p>
        Repository names, commit messages and author names belong to their respective owners and are shown as published by the git host.
        Reports are statistical summaries and may be incomplete or inaccurate; don&apos;t rely on them for decisions about people.
      </p>
      <h2>Contact</h2>
      <p>
        Open an issue on the{" "}
        <a href={site.repoUrl} target="_blank" rel="noopener noreferrer">
          project repository
        </a>
        .
      </p>
    </ProsePage>
  );
}
