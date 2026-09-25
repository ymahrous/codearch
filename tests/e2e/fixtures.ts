import { test as base, expect, type Page } from "@playwright/test";
import example from "../../src/data/example-report.json" with { type: "json" };

export const US = "\x1f";

/** Answers /api/dig from the bundled example report so tests don't depend on GitHub. */
export async function mockDig(page: Page, handler?: (repo: string) => { status: number; body: unknown }) {
  await page.route("**/api/dig?**", async (route) => {
    const repo = new URL(route.request().url()).searchParams.get("repo") ?? "";
    const res = handler?.(repo) ?? { status: 200, body: { ...example, report: { ...example.report, name: repo } } };
    await route.fulfill({ status: res.status, contentType: "application/json", body: JSON.stringify(res.body) });
  });
}

/** Fails the test if the page scrolls sideways (a common mobile layout bug). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "page is wider than the viewport").toBeLessThanOrEqual(0);
}

export const test = base.extend<{ consoleErrors: string[]; consent: "granted" | "denied" | null }>({
  // Most tests start with analytics declined so the cookie banner doesn't cover the page.
  // `test.use({ consent: null })` shows the banner.
  consent: ["denied", { option: true }],
  page: async ({ page, consent }, provide) => {
    if (consent) {
      await page.addInitScript((value) => localStorage.setItem("analytics-consent", JSON.stringify({ value, at: Date.now() })), consent);
    }
    await provide(page);
  },
  consoleErrors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await provide(errors);
    expect(errors, "browser console errors").toEqual([]);
  },
});
export { expect };
