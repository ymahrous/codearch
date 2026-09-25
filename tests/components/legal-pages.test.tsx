import { render, screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import AccessibilityPage from "@/app/accessibility/page";
import CookiesPage from "@/app/cookies/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import { site } from "@/lib/site";

const pages: Array<[string, ComponentType]> = [
  ["Privacy policy", PrivacyPage],
  ["Terms and conditions", TermsPage],
  ["Cookie policy", CookiesPage],
  ["Accessibility statement", AccessibilityPage],
];

beforeEach(() => localStorage.clear());

describe.each(pages)("%s page", (title, Page) => {
  it("is dated September 25, 2026", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    const [date] = screen.getAllByText("September 25, 2026", { selector: "time" });
    expect(date).toHaveAttribute("dateTime", "2026-09-25");
    expect(date.parentElement).toHaveTextContent("Last updated September 25, 2026");
  });

  it("numbers its sections in order, and every contents link has a target", () => {
    const { container } = render(<Page />);
    const toc = screen.getByRole("navigation", { name: "On this page" });
    const links = within(toc).getAllByRole("link");
    const headings = screen.getAllByRole("heading", { level: 2 }).filter((h) => !toc.contains(h));

    expect(headings.map((h) => h.textContent)).toEqual(headings.map((h, i) => `${i + 1}. ${h.textContent!.replace(/^\d+\.\s*/, "")}`));
    expect(links.map((a) => a.getAttribute("href"))).toEqual(headings.map((h) => `#${h.id}`));
    for (const a of container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      expect(container.querySelector(a.getAttribute("href")!), a.getAttribute("href")!).not.toBeNull();
    }
  });

  it("sends questions to the project's issue tracker", () => {
    render(<Page />);
    const contact = screen.getByRole("link", { name: /open an issue/ });
    expect(contact).toHaveAttribute("href", `${site.repoUrl}/issues`);
  });
});

describe("legal content", () => {
  it("has no governing-law clause in the terms", () => {
    render(<TermsPage />);
    expect(document.body).not.toHaveTextContent(/governing law|governed by the laws|jurisdiction of the courts/i);
  });

  it("lets visitors change their analytics choice from the cookie policy", () => {
    render(<CookiesPage />);
    expect(screen.getByRole("switch", { name: "Allow Vercel Web Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Items stored in your browser" })).toHaveTextContent("analytics-consent");
  });
});
