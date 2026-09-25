import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { ProsePage } from "@/components/ui/prose";
import { breadcrumbNode, graph, ids, pageMetadata, webPageNode } from "@/lib/seo";
import { CONTENT_UPDATED, site } from "@/lib/site";

const title = "About";
const description = `${site.name} is a free, open-source tool by ${site.author} that turns any public git repository's commit history into a readable report.`;

export const metadata = pageMetadata({ title, description, path: "/about", socialTitle: `About ${site.name}` });

export default function AboutPage() {
  return (
    <ProsePage
      eyebrow="About"
      title={`About ${site.name}`}
      intro={`${site.name} is a free, open-source tool that turns the history of any public git repository into a readable report.`}
      author={site.author}
      updated={CONTENT_UPDATED}
    >
      <JsonLd
        data={graph(
          webPageNode({
            path: "/about",
            title: `About ${site.name}`,
            description,
            type: "AboutPage",
            dateModified: CONTENT_UPDATED,
            author: true,
            about: { "@id": ids.app },
          }),
          breadcrumbNode([
            ["Home", "/"],
            [title, "/about"],
          ]),
        )}
      />

      <h2 id="what">What it does</h2>
      <p>Enter a repository from GitHub, GitLab or Codeberg and {site.name} reads its commit history to show four views of its past:</p>
      <ul>
        <li>
          <strong>Rock layers:</strong> every year of commits drawn as a layer, colored by the people who made them.
        </li>
        <li>
          <strong>Eras:</strong> the stretches of years each maintainer led, and how much of the work they did.
        </li>
        <li>
          <strong>Ownership and bus factor:</strong> who owns each folder today, and which parts depend on a single person.
        </li>
        <li>
          <strong>Fossil record:</strong> the oldest files still standing, and those nobody has touched in years.
        </li>
      </ul>
      <p>
        Private repositories work too, through <Link href="/analyze">paste mode</Link>, which analyzes a local git log in your browser.
      </p>

      <h2 id="who">Who makes it</h2>
      <p>
        {site.name} is built and maintained by{" "}
        <a href={site.authorUrl} rel="author">
          {site.author}
        </a>
        , an independent developer. It&apos;s a personal open-source project, not a company, and it isn&apos;t affiliated with GitHub,
        GitLab or Codeberg.
      </p>

      <h2 id="how">How it&apos;s built</h2>
      <p>
        The site is written in TypeScript with Next.js. Instead of running git on the server, it implements git&apos;s network protocol
        itself and downloads only commits and folder listings, never file contents. Its output is checked against the official git command
        line on real projects, including Express, Flask, jQuery, Svelte and Nuxt, and matches exactly.{" "}
        <Link href="/how-it-works">How it works</Link> explains every metric and its limits.
      </p>

      <h2 id="principles">Principles</h2>
      <ul>
        <li>
          <strong>Privacy first.</strong> No accounts, no advertising, no file contents, and analytics only with your consent. Read the{" "}
          <Link href="/privacy">privacy policy</Link>.
        </li>
        <li>
          <strong>Transparent methods.</strong> Every number is explained, and known limits are listed rather than hidden.
        </li>
        <li>
          <strong>Accessible to everyone.</strong> The site aims to meet WCAG 2.2 AA; see the{" "}
          <Link href="/accessibility">accessibility statement</Link>.
        </li>
        <li>
          <strong>Open source.</strong> The <a href={site.repoUrl}>source code</a> is available under the MIT License.
        </li>
      </ul>

      <h2 id="contact">Get in touch</h2>
      <p>
        Found a bug or have an idea? <a href={site.contactUrl}>Open an issue on GitHub</a>. Contributions are welcome; the repository&apos;s
        contributing guide explains how to get started.
      </p>
    </ProsePage>
  );
}
