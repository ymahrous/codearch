import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { CONTENT_UPDATED, EXAMPLES, LEGAL_UPDATED } from "@/lib/site";

// Real modification dates, so search engines can trust lastmod. Example reports change
// whenever they're re-analyzed, so they don't claim one.
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, lastModified: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(path),
    lastModified,
    priority,
  });
  return [
    page("/", CONTENT_UPDATED, 1),
    page("/how-it-works", CONTENT_UPDATED, 0.8),
    page("/analyze", CONTENT_UPDATED, 0.7),
    page("/about", CONTENT_UPDATED, 0.6),
    ...EXAMPLES.map((e) => ({ url: absoluteUrl(`/${e.slug}`), priority: 0.6 })),
    page("/accessibility", LEGAL_UPDATED, 0.3),
    page("/privacy", LEGAL_UPDATED, 0.2),
    page("/terms", LEGAL_UPDATED, 0.2),
    page("/cookies", LEGAL_UPDATED, 0.2),
  ];
}
