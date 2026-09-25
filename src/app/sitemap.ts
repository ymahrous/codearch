import type { MetadataRoute } from "next";
import { EXAMPLES, site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/analyze`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site.url}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/accessibility`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
  return [
    ...pages,
    ...EXAMPLES.map((e) => ({ url: `${site.url}/${e.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.5 })),
  ];
}
