import type { Metadata } from "next";
import { site } from "./site";

/** An absolute URL on this site, for canonical links and structured data. */
export const absoluteUrl = (path = "/") => new URL(path, site.url).toString();

/**
 * Title, description, canonical URL and social cards for one page. Every page sets
 * its own, so shared links never fall back to the home page's title or URL.
 */
export function pageMetadata({
  title,
  description,
  path,
  socialTitle = `${title} · ${site.name}`,
  type = "website",
  ownImage = false,
}: {
  title: string;
  description: string;
  path: string;
  /** Title for link previews, which don't get the `%s · site` template. */
  socialTitle?: string;
  type?: "website" | "article";
  /** The route has its own opengraph-image file, which listing an image here would override. */
  ownImage?: boolean;
}): Metadata {
  // A page's own openGraph replaces the inherited one, image included, so name the site-wide
  // image here, unless the route has an image of its own. (Even `images: undefined` would
  // hide that file, so the key is left out entirely.)
  const images = ownImage ? {} : { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${site.name}: ${site.tagline}` }] };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type, siteName: site.name, locale: "en_US", title: socialTitle, description, url: path, ...images },
    twitter: { card: "summary_large_image", title: socialTitle, description, ...images },
  };
}

// schema.org structured data (JSON-LD). Nodes reference each other by @id, so search and
// AI engines can connect every page to the same website and author.

type Node = Record<string, unknown>;

export const ids = {
  website: absoluteUrl("/#website"),
  author: absoluteUrl("/#author"),
  app: absoluteUrl("/#app"),
};

/** Wraps nodes into one JSON-LD document. */
export const graph = (...nodes: Array<Node | null | undefined | false>) => ({
  "@context": "https://schema.org",
  "@graph": nodes.filter(Boolean),
});

/** The website and the person who runs it; included on every page. */
export function siteNodes(): Node[] {
  return [
    {
      "@type": "WebSite",
      "@id": ids.website,
      url: absoluteUrl("/"),
      name: site.name,
      description: site.description,
      inLanguage: "en",
      publisher: { "@id": ids.author },
    },
    {
      "@type": "Person",
      "@id": ids.author,
      name: site.author,
      url: site.authorUrl,
      sameAs: [site.authorUrl],
    },
  ];
}

/** The web application itself, described on the home page. */
export function appNode(): Node {
  return {
    "@type": "WebApplication",
    "@id": ids.app,
    name: site.name,
    url: absoluteUrl("/"),
    description: site.description,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "Commit activity per year drawn as rock layers",
      "Eras led by each maintainer",
      "Folder ownership and bus factor",
      "Oldest surviving files and longest-untouched files",
      "Private repositories analyzed in the browser from a pasted git log",
    ],
    author: { "@id": ids.author },
    isPartOf: { "@id": ids.website },
    license: "https://opensource.org/license/mit",
    isBasedOn: { "@type": "SoftwareSourceCode", codeRepository: site.repoUrl, programmingLanguage: "TypeScript" },
  };
}

export function webPageNode({
  path,
  title,
  description,
  type = "WebPage",
  dateModified,
  about,
  author = false,
}: {
  path: string;
  title: string;
  description: string;
  type?: "WebPage" | "AboutPage" | "FAQPage" | "TechArticle" | "CollectionPage";
  /** YYYY-MM-DD */
  dateModified?: string;
  about?: Node;
  /** Credit the site's author (for articles and the about page). */
  author?: boolean;
}): Node {
  const url = absoluteUrl(path);
  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name: title,
    ...(type === "TechArticle" ? { headline: title } : {}),
    description,
    inLanguage: "en",
    isPartOf: { "@id": ids.website },
    ...(dateModified ? { dateModified, ...(type === "TechArticle" ? { datePublished: dateModified } : {}) } : {}),
    ...(author ? { author: { "@id": ids.author } } : {}),
    ...(about ? { about } : {}),
  };
}

/** Breadcrumb trail, as [name, path] pairs from the home page down. */
export function breadcrumbNode(items: Array<[string, string]>): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: absoluteUrl(path) })),
  };
}

export interface QA {
  question: string;
  answer: string;
}

/** Questions and answers shown on the page. The page must show the same text. */
export function faqNode(path: string, qas: readonly QA[]): Node {
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(path)}#faq`,
    mainEntity: qas.map((qa) => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: { "@type": "Answer", text: qa.answer },
    })),
  };
}

export function howToNode({ path, name, description, steps }: { path: string; name: string; description: string; steps: QA[] }): Node {
  return {
    "@type": "HowTo",
    "@id": `${absoluteUrl(path)}#howto`,
    name,
    description,
    totalTime: "PT2M",
    tool: [{ "@type": "HowToTool", name: "git" }],
    step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.question, text: s.answer })),
  };
}
