import type { Metadata } from "next";
import { ProsePage } from "@/components/ui/prose";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${site.name} handles data.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Privacy"
      updated="September 25, 2026"
      intro="Short version: no accounts, no cookies, no tracking, and your pasted logs never leave your browser."
    >
      <h2>What we process</h2>
      <ul>
        <li>
          <strong>Public repository history.</strong> When you analyze a public repository, we download its commit metadata (author names,
          commit times, commit messages and file paths) from the git host. We don&apos;t download file contents.
        </li>
        <li>
          <strong>Reports.</strong> The finished report is cached for up to six hours so repeat visits are fast, then deleted.
        </li>
        <li>
          <strong>IP addresses.</strong> To limit how many new analyses one visitor can start, we keep a counter keyed by IP address that
          expires within 15 minutes. Our hosting provider may also keep standard server logs.
        </li>
      </ul>
      <h2>What stays on your device</h2>
      <ul>
        <li>Logs you paste or drop into paste mode are analyzed in your browser and never sent to our servers.</li>
        <li>Your light or dark theme choice is saved in your browser&apos;s local storage.</li>
      </ul>
      <h2>What we don&apos;t do</h2>
      <p>We don&apos;t use cookies, analytics, advertising or third-party trackers, and we don&apos;t sell or share data.</p>
      <h2>Contact</h2>
      <p>
        Questions or removal requests: open an issue on the{" "}
        <a href={site.repoUrl} target="_blank" rel="noopener noreferrer">
          project repository
        </a>
        .
      </p>
    </ProsePage>
  );
}
