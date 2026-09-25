import { describe, expect, it } from "vitest";
import { reportFaq, reportSummary, riskFolders } from "@/lib/archaeology/summary";
import type { DigResponse, Report } from "@/lib/archaeology/types";
import { HOME_FAQ, PASTE_STEPS } from "@/lib/content";
import example from "@/data/example-report.json";
import { absoluteUrl, breadcrumbNode, faqNode, graph, howToNode, pageMetadata, siteNodes, webPageNode } from "@/lib/seo";
import { site } from "@/lib/site";

const report = (example as unknown as DigResponse).report;

describe("pageMetadata", () => {
  it("gives each page its own canonical URL, social URL and titles", () => {
    const md = pageMetadata({ title: "How it works", description: "Methodology.", path: "/how-it-works", type: "article" });
    expect(md).toMatchObject({
      title: "How it works",
      description: "Methodology.",
      alternates: { canonical: "/how-it-works" },
      openGraph: { url: "/how-it-works", type: "article", title: `How it works · ${site.name}`, description: "Methodology." },
      twitter: { card: "summary_large_image", title: `How it works · ${site.name}` },
    });
  });
});

describe("structured data", () => {
  it("links every page to one website and author", () => {
    const [website, person] = siteNodes();
    expect(website).toMatchObject({ "@type": "WebSite", url: absoluteUrl("/"), publisher: { "@id": person["@id"] } });
    expect(person).toMatchObject({ "@type": "Person", name: site.author });
    const page = webPageNode({
      path: "/about",
      title: "About",
      description: "d",
      type: "AboutPage",
      dateModified: "2026-09-25",
      author: true,
    });
    expect(page).toMatchObject({
      "@type": "AboutPage",
      url: absoluteUrl("/about"),
      isPartOf: { "@id": website["@id"] },
      author: { "@id": person["@id"] },
    });
  });

  it("builds breadcrumbs, FAQs and how-tos from page content", () => {
    expect(
      breadcrumbNode([
        ["Home", "/"],
        ["About", "/about"],
      ]),
    ).toEqual({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "About", item: absoluteUrl("/about") },
      ],
    });
    const faq = faqNode("/", HOME_FAQ);
    expect(faq.mainEntity).toHaveLength(HOME_FAQ.length);
    expect((faq.mainEntity as Array<{ acceptedAnswer: { text: string } }>)[0].acceptedAnswer.text).toBe(HOME_FAQ[0].answer);
    const howTo = howToNode({ path: "/analyze", name: "n", description: "d", steps: [...PASTE_STEPS] });
    expect(howTo.step).toHaveLength(3);
  });

  it("drops missing nodes from a graph", () => {
    expect(graph({ "@type": "A" }, null, false, undefined)).toEqual({ "@context": "https://schema.org", "@graph": [{ "@type": "A" }] });
  });

  it("keeps home page answers short enough to quote", () => {
    for (const { answer } of HOME_FAQ) expect(answer.split(/\s+/).length, answer).toBeLessThanOrEqual(60);
  });
});

describe("report summary and answers", () => {
  it("sums up the history in one direct sentence", () => {
    expect(reportSummary(report)).toBe(
      "expressjs/express has 6,170 commits from 392 contributors, made between Jun 26, 2009 and Sep 15, 2026. Tj Holowaychuk made the most: 2,596 (42%).",
    );
  });

  it("answers the questions people ask about a repository", () => {
    const answers = Object.fromEntries(reportFaq(report).map((qa) => [qa.question, qa.answer]));
    expect(answers["Who has made the most commits to expressjs/express?"]).toBe(
      "Tj Holowaychuk has made the most commits to expressjs/express: 2,596 of 6,170 (42%). visionmedia is next, with 1,285.",
    );
    expect(answers["How many people have contributed to expressjs/express?"]).toMatch(/^392 people have made commits/);
    expect(answers["When was expressjs/express started?"]).toMatch(/Jun 26, 2009 by visionmedia, with the message “Initial commit”/);
    expect(answers["What is the bus factor of expressjs/express?"]).toMatch(
      new RegExp(`^${riskFolders(report).length} of its 11 top-level folders have a bus factor of 1`),
    );
    expect(answers["What is the oldest file in expressjs/express?"]).toMatch(/^Readme.md is the oldest file/);
  });

  it("names people, not bots, as the most active recently", () => {
    const qa = reportFaq(report).find((q) => q.question.startsWith("Who was the most active person"))!;
    expect(qa.question).toBe("Who was the most active person in expressjs/express in 2026?");
    expect(qa.answer).not.toMatch(/\[bot\]/);
  });

  it("handles a one-commit history", () => {
    const tiny: Report = {
      ...report,
      name: "a/b",
      stats: { ...report.stats, commits: 1, contributors: 1, firstTs: 1600000000, lastTs: 1600000000 },
      top: [{ name: "Ada", commits: 1 }],
      territory: { ...report.territory, "1|nobots": [] },
      oldest: [],
      notes: { ...report.notes, oneTimers: 1 },
    };
    expect(reportSummary(tiny)).toBe("a/b has 1 commit from 1 contributor, made on Sep 13, 2020. Ada made the most: 1 (100%).");
    const questions = reportFaq(tiny).map((q) => q.question);
    expect(questions).not.toContain("What is the bus factor of a/b?");
    expect(reportFaq(tiny).find((q) => q.question.startsWith("How many"))?.answer).toMatch(/^1 person has made commits/);
  });
});
