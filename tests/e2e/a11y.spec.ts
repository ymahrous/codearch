import AxeBuilder from "@axe-core/playwright";
import { expect, expectNoHorizontalScroll, mockDig, test } from "./fixtures";
import type { Page } from "@playwright/test";

const PAGES = [
  "/",
  "/expressjs/express",
  "/analyze",
  "/how-it-works",
  "/about",
  "/privacy",
  "/terms",
  "/cookies",
  "/accessibility",
  "/no/such/page",
];

async function open(page: Page, path: string) {
  await mockDig(page);
  await page.goto(path);
  if (path === "/expressjs/express") await expect(page.getByRole("heading", { name: "Rock layers" })).toBeVisible();
}

/** WCAG 2.0, 2.1 and 2.2 level A and AA rules. */
async function violations(page: Page) {
  // Let entrance animations finish so colors are measured at full opacity.
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState === "finished" || a.effect?.getTiming().iterations === Infinity),
  );
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"])
    .analyze();
  return violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`accessibility, ${colorScheme} theme`, () => {
    test.use({ colorScheme });
    for (const path of PAGES) {
      test(`${path} has no detectable WCAG 2.2 AA violations`, async ({ page }) => {
        await open(page, path);
        expect(await violations(page)).toEqual([]);
      });
    }

    test.describe("with the cookie banner", () => {
      test.use({ consent: null });
      test("the banner has no detectable violations", async ({ page }) => {
        await open(page, "/");
        await expect(page.getByRole("region", { name: "Cookies and analytics" })).toBeVisible();
        expect(await violations(page)).toEqual([]);
      });
    });
  });
}

test.describe("reflow", () => {
  test.use({ viewport: { width: 320, height: 720 } });
  for (const path of PAGES) {
    test(`${path} fits a 320px-wide screen`, async ({ page, isMobile }) => {
      test.skip(isMobile, "viewport is set explicitly");
      await open(page, path);
      await expectNoHorizontalScroll(page);
    });
  }
});
