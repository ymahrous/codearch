import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { RepoReport } from "@/components/report/repo-report";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { ALLOWED_HOSTS, parseRepoInput } from "@/lib/archaeology/repo-input";
import { reportFaq } from "@/lib/archaeology/summary";
import type { DigResponse } from "@/lib/archaeology/types";
import { formatNumber } from "@/lib/format";
import { breadcrumbNode, faqNode, graph, pageMetadata, webPageNode } from "@/lib/seo";
import { cachedDig } from "@/lib/server/excavate";
import { site } from "@/lib/site";

type Props = PageProps<"/[owner]/[repo]">;

/** Decodes a path, or returns null for malformed escapes like a stray "%". */
function safeDecode(s: string): string | null {
  try {
    return decodeURIComponent(s);
  } catch {
    return null;
  }
}

async function resolveTarget(props: Props) {
  const { owner, repo } = await props.params;
  const { host } = await props.searchParams;
  const h = typeof host === "string" && (ALLOWED_HOSTS as readonly string[]).includes(host) ? host : "github.com";
  const input = h === "github.com" ? `${owner}/${repo}` : `${h}/${owner}/${repo}`;
  return { target: parseRepoInput(safeDecode(input)), input };
}

// A report that's already cached is rendered on the server, so search engines and AI crawlers
// (most of which don't run JavaScript) see the full report. Rendering never starts a new
// analysis: uncached reports load in the browser as before. Shared by metadata and page.
const getCachedDig = cache(cachedDig);

const titleFor = (slug: string) => `${slug} git history`;

function describe(slug: string, dig: DigResponse | null) {
  if (!dig) {
    return `Git history of ${slug}: commits by year as rock layers, the eras each maintainer led, folder ownership, bus factor and the oldest surviving files.`;
  }
  const { commits, contributors, firstTs } = dig.report.stats;
  return `${slug}: ${formatNumber(commits)} commits by ${formatNumber(contributors)} contributors since ${new Date(firstTs * 1000).getUTCFullYear()}. See who led each era, who owns each folder (bus factor) and the oldest surviving files.`;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { target, input } = await resolveTarget(props);
  if (!target) return { title: "Repository not found", robots: { index: false } };
  const dig = await getCachedDig(input);
  return pageMetadata({
    title: titleFor(target.slug),
    description: describe(target.slug, dig),
    path: target.appPath,
    socialTitle: `${target.slug} · ${site.name}`,
    ownImage: true,
  });
}

export default async function RepoPage(props: Props) {
  const { target, input } = await resolveTarget(props);
  if (!target) notFound();
  const dig = await getCachedDig(input);
  const title = titleFor(target.slug);
  return (
    <Container className="py-8 sm:py-10">
      <JsonLd
        data={graph(
          webPageNode({
            path: target.appPath,
            title,
            description: describe(target.slug, dig),
            dateModified: dig ? new Date(dig.report.generatedAt * 1000).toISOString().slice(0, 10) : undefined,
            about: {
              "@type": "SoftwareSourceCode",
              name: target.slug,
              codeRepository: target.htmlUrl,
              ...(dig?.meta.description ? { description: dig.meta.description } : {}),
            },
          }),
          breadcrumbNode([
            ["Home", "/"],
            [target.slug, target.appPath],
          ]),
          dig && faqNode(target.appPath, reportFaq(dig.report)),
        )}
      />
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
      <RepoReport key={input} repoInput={input} slug={target.slug} initial={dig ?? undefined} />
    </Container>
  );
}
