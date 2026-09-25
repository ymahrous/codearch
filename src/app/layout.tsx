import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { ConsentedAnalytics } from "@/components/consent/analytics";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeScript } from "@/components/layout/theme-script";
import { JsonLd } from "@/components/seo/json-ld";
import { graph, siteNodes } from "@/lib/seo";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} · Explore any repository's history`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: ["git history", "repository analytics", "bus factor", "code ownership", "git log visualizer", "open source"],
  authors: [{ name: site.author, url: site.authorUrl }],
  creator: site.author,
  publisher: site.author,
  category: "technology",
  // Defaults only: each page sets its own title, description, canonical URL and og:url
  // (see pageMetadata), so no page inherits the home page's.
  openGraph: { type: "website", siteName: site.name, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0e" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-accent px-4 py-2 font-medium text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <JsonLd data={graph(...siteNodes())} />
        <CookieBanner />
        <ConsentedAnalytics />
      </body>
    </html>
  );
}
