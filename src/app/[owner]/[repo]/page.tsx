import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RepoReport } from "@/components/report/repo-report";
import { Container } from "@/components/ui/container";
import { ALLOWED_HOSTS, parseRepoInput } from "@/lib/archaeology/repo-input";

type Props = PageProps<"/[owner]/[repo]">;

async function resolveTarget(props: Props) {
  const { owner, repo } = await props.params;
  const { host } = await props.searchParams;
  const h = typeof host === "string" && (ALLOWED_HOSTS as readonly string[]).includes(host) ? host : "github.com";
  const input = h === "github.com" ? `${owner}/${repo}` : `${h}/${owner}/${repo}`;
  return { target: parseRepoInput(decodeURIComponent(input)), input };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { target } = await resolveTarget(props);
  if (!target) return { title: "Repository not found" };
  const title = `${target.slug} history`;
  const description = `Commit history of ${target.slug} as rock layers: eras, folder ownership, bus factor and the oldest surviving files.`;
  return {
    title,
    description,
    alternates: { canonical: target.appPath },
    openGraph: { title: `${target.slug} · Codebase Archaeology`, description, url: target.appPath },
    twitter: { card: "summary_large_image", title: `${target.slug} · Codebase Archaeology`, description },
  };
}

export default async function RepoPage(props: Props) {
  const { target, input } = await resolveTarget(props);
  if (!target) notFound();
  return (
    <Container className="py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-fg-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-fg">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-fg-subtle">{target.host}</li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-mono text-fg">
            {target.slug}
          </li>
        </ol>
      </nav>
      <RepoReport key={input} repoInput={input} slug={target.slug} />
    </Container>
  );
}
