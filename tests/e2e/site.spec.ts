import { expect, expectNoHorizontalScroll, mockDig, test, US } from "./fixtures";

test.describe("home page", () => {
  test("presents the product and searches for a repository", async ({ page, consoleErrors }) => {
    await mockDig(page);
    await page.goto("/");
    await expect(page).toHaveTitle(/Codebase Archaeology/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("dig site");
    await expectNoHorizontalScroll(page);

    const search = page.getByRole("search", { name: "Analyze a repository" }).getByLabel("Repository");
    await search.fill("nope");
    await search.press("Enter");
    // Next.js also renders an (empty) role="alert" route announcer, so match on text.
    await expect(page.getByRole("alert").filter({ hasText: "owner/name" })).toBeVisible();

    await search.fill("https://github.com/pallets/flask");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/pallets\/flask$/);
    await expect(page.getByRole("heading", { level: 1, name: "pallets/flask" })).toBeVisible();
    void consoleErrors;
  });

  test("example cards link to reports", async ({ page }) => {
    await mockDig(page);
    await page.goto("/#examples");
    await page
      .locator("#examples")
      .getByRole("link", { name: /sveltejs\/svelte/ })
      .click();
    await expect(page).toHaveURL(/\/sveltejs\/svelte$/);
    await expect(page.getByRole("heading", { name: "Rock layers" })).toBeVisible();
  });
});

test.describe("report page", () => {
  test("renders every section and interactive controls", async ({ page, consoleErrors }) => {
    await mockDig(page);
    await page.goto("/expressjs/express");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("expressjs/express");
    await expect(page.getByRole("heading", { name: "Who owns which folder" })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole("navigation", { name: "Report sections" }).getByRole("link", { name: "Fossils" }).click();
    await expect(page).toHaveURL(/#fossils$/);

    await page.getByRole("button", { name: "Show as table" }).click();
    await expect(page.getByRole("table", { name: "Commits per year" })).toBeVisible();

    await page.getByLabel("Filter folders or owners").fill("examples");
    await expect(page.getByRole("table", { name: "Folder ownership" }).getByRole("row")).toHaveCount(2);
    void consoleErrors;
  });

  test("explains failures and offers paste mode", async ({ page }) => {
    await mockDig(page, () => ({
      status: 404,
      body: { error: { code: "not_found", message: "We couldn't find a public repository called a/b." } },
    }));
    await page.goto("/a/b");
    await expect(page.getByRole("alert").filter({ hasText: "couldn't find a public repository" })).toBeVisible();
    await page.getByRole("link", { name: "Paste a local git log instead" }).click();
    await expect(page).toHaveURL(/\/analyze$/);
  });

  test("has per-repository metadata", async ({ page }) => {
    await mockDig(page);
    await page.goto("/vuejs/core");
    await expect(page).toHaveTitle("vuejs/core history · Codebase Archaeology");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/vuejs\/core\/opengraph-image/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/vuejs\/core$/);
  });
});

test("paste mode analyzes a log without calling the API", async ({ page, consoleErrors }) => {
  let apiCalls = 0;
  await page.route("**/api/**", (r) => {
    apiCalls++;
    return r.abort();
  });
  await page.goto("/analyze");
  const log = [
    `@@b2${US}Grace Hopper${US}1600000000${US}second`,
    "",
    "M\tsrc/app.ts",
    `@@a1${US}Ada Lovelace${US}1500000000${US}first`,
    "",
    "A\tsrc/app.ts",
    "A\tREADME.md",
  ].join("\n");
  await page.getByLabel("Git log output").fill(log);
  await page.getByLabel("Repository name (optional)").fill("acme/secret");
  await page.getByRole("button", { name: "Analyze log" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "acme/secret" })).toBeVisible();
  expect(apiCalls).toBe(0);
  void consoleErrors;
});

test.describe("site chrome", () => {
  test("navigation, footer and legal pages work", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("navigation", { name: isMobile ? "Mobile" : "Main" })
      .getByRole("link", { name: "How it works" })
      .click();
    await expect(page.getByRole("heading", { level: 1, name: "How it works" })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();
    await page.getByRole("contentinfo").getByRole("link", { name: "Terms" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Terms of use" })).toBeVisible();
  });

  test("skip link moves focus to the main content", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard navigation");
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("theme choice persists across reloads", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /System theme/ }).click();
    await page.getByRole("button", { name: /Light theme/ }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("unknown pages return a helpful 404", async ({ page }) => {
    const res = await page.goto("/this/does/not/exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Nothing buried here" })).toBeVisible();
  });
});

test.describe("web standards", () => {
  test("serves robots, sitemap, manifest and icons", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Sitemap:");
    expect(await (await request.get("/sitemap.xml")).text()).toContain("/expressjs/express");
    expect((await request.get("/manifest.webmanifest")).headers()["content-type"]).toContain("manifest+json");
    expect((await request.get("/opengraph-image")).headers()["content-type"]).toBe("image/png");
    expect((await request.get("/icon.svg")).ok()).toBe(true);
  });

  test("sends security headers", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("the API validates input", async ({ request }) => {
    const res = await request.get("/api/dig?repo=nope");
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe("invalid_input");
  });
});

test("live: analyzes a real repository @live", async ({ page }) => {
  test.skip(!process.env.E2E_LIVE, "Set E2E_LIVE=1 to run against GitHub");
  test.setTimeout(120_000);
  await page.goto("/expressjs/express");
  await expect(page.getByRole("heading", { name: "Rock layers" })).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText("TJ Holowaychuk").or(page.getByText("Tj Holowaychuk")).first()).toBeVisible();
});
