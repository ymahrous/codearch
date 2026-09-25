import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RepoPage, { generateMetadata } from "@/app/[owner]/[repo]/page";
import { JsonLd } from "@/components/seo/json-ld";
import type { DigResponse } from "@/lib/archaeology/types";
import example from "@/data/example-report.json";
import { cacheKey } from "@/lib/server/excavate";
import { MemoryStore, setStore } from "@/lib/server/store";

const data = example as unknown as DigResponse;
const props = (owner: string, repo: string) => ({
  params: Promise.resolve({ owner, repo }),
  searchParams: Promise.resolve({} as Record<string, string | string[] | undefined>),
});

function structuredData() {
  return [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(
    (s) => JSON.parse(s.textContent!)["@graph"] as Array<Record<string, unknown>>,
  );
}

let store: MemoryStore;
beforeEach(() => {
  store = new MemoryStore();
  setStore(store);
  // Uncached reports load in the browser; keep that request pending.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {})),
  );
});
afterEach(() => {
  setStore(undefined);
  vi.unstubAllGlobals();
});

describe("repository page", () => {
  it("renders a cached report on the server, with matching Q&A structured data", async () => {
    await store.set(cacheKey("github.com", "expressjs/express"), { report: data.report, meta: data.meta }, 60);
    render(await RepoPage(props("expressjs", "express")));

    expect(screen.getByRole("heading", { level: 1, name: "expressjs/express" })).toBeInTheDocument();
    expect(screen.getByText(/^expressjs\/express has 6,170 commits from 392 contributors/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    const nodes = structuredData();
    expect(nodes.map((n) => n["@type"])).toEqual(["WebPage", "BreadcrumbList", "FAQPage"]);
    expect(nodes[0]).toMatchObject({ about: { "@type": "SoftwareSourceCode", codeRepository: "https://github.com/expressjs/express" } });
    const questions = (nodes[2].mainEntity as Array<{ name: string }>).map((q) => q.name);
    const section = screen.getByRole("region", { name: "Questions about expressjs/express" });
    expect(
      within(section)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(questions);
  });

  it("loads uncached reports in the browser, without claiming answers it doesn't have", async () => {
    render(await RepoPage(props("pallets", "flask")));
    expect(screen.getByText("Finding the repository")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/dig?repo=pallets%2Fflask", expect.anything());
    expect(structuredData().map((n) => n["@type"])).toEqual(["WebPage", "BreadcrumbList"]);
  });

  it("describes cached reports with their numbers", async () => {
    await store.set(cacheKey("github.com", "expressjs/express"), { report: data.report, meta: data.meta }, 60);
    const cached = await generateMetadata(props("expressjs", "express"));
    expect(cached.title).toBe("expressjs/express git history");
    expect(cached.description).toBe(
      "expressjs/express: 6,170 commits by 392 contributors since 2009. See who led each era, who owns each folder (bus factor) and the oldest surviving files.",
    );
    expect(cached.alternates?.canonical).toBe("/expressjs/express");

    const uncached = await generateMetadata(props("pallets", "flask"));
    expect(uncached.description).toMatch(/^Git history of pallets\/flask:/);
    expect(uncached.description!.length).toBeLessThanOrEqual(160);
  });
});

describe("JsonLd", () => {
  it("can't be broken out of by text from a repository", () => {
    const { container } = render(<JsonLd data={{ name: "</script><script>alert(1)</script>" }} />);
    const script = container.querySelector("script")!;
    expect(script.innerHTML).not.toContain("</script>");
    expect(JSON.parse(script.textContent!).name).toBe("</script><script>alert(1)</script>");
  });
});
