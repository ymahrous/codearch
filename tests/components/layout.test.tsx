import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeToggle } from "@/components/layout/theme-toggle";

vi.mock("next/navigation", () => ({ usePathname: () => "/how-it-works" }));

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("SiteHeader", () => {
  it("has main navigation with the current page marked", () => {
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "How it works" })[0]).toHaveAttribute("aria-current", "page");
  });

  it("opens and closes the mobile menu", async () => {
    render(<SiteHeader />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(screen.getByRole("navigation", { name: "Mobile" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
  });

  it("closes the mobile menu on Escape and when a link to the current page is chosen", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const mobile = screen.getByRole("navigation", { name: "Mobile" });
    // The pathname is mocked, so it never changes: only an explicit close hides the menu.
    await userEvent.click(within(mobile).getByRole("link", { name: "How it works" }));
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
  });
});

describe("ThemeToggle", () => {
  it("cycles system → light → dark and remembers the choice", async () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /System theme/ });
    await userEvent.click(btn);
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
    await userEvent.click(screen.getByRole("button", { name: /Light theme/ }));
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    await userEvent.click(screen.getByRole("button", { name: /Dark theme/ }));
    expect(localStorage.getItem("theme")).toBe("system");
  });
});

describe("SiteFooter", () => {
  it("links to legal pages and examples", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms and conditions" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Cookie policy" })).toHaveAttribute("href", "/cookies");
    expect(screen.getByRole("link", { name: "Accessibility" })).toHaveAttribute("href", "/accessibility");
    expect(screen.getByRole("link", { name: "expressjs/express" })).toHaveAttribute("href", "/expressjs/express");
    expect(screen.getByRole("contentinfo")).toHaveTextContent(/Not affiliated with GitHub/);
  });
});
