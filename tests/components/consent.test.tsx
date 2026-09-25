import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsentedAnalytics } from "@/components/consent/analytics";
import { ConsentControls } from "@/components/consent/consent-controls";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { CONSENT_KEY, CONSENT_MAX_AGE_MS, readConsent, resetConsentMemory, writeConsent } from "@/lib/consent";

type BeforeSend = (e: { type: "pageview"; url: string }) => unknown;
const analytics = vi.hoisted(() => ({ beforeSend: null as BeforeSend | null }));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: ({ beforeSend }: { beforeSend: BeforeSend }): ReactNode => {
    analytics.beforeSend = beforeSend;
    return <div data-testid="vercel-analytics" />;
  },
}));

const setGpc = (on: boolean) =>
  Object.defineProperty(navigator, "globalPrivacyControl", { value: on ? true : undefined, configurable: true });

beforeEach(() => {
  localStorage.clear();
  resetConsentMemory();
  analytics.beforeSend = null;
});
afterEach(() => {
  setGpc(false);
  vi.restoreAllMocks();
});

describe("consent store", () => {
  it("has no choice until one is made, then remembers it", () => {
    expect(readConsent()).toBeNull();
    writeConsent("granted");
    expect(readConsent()).toBe("granted");
    expect(JSON.parse(localStorage.getItem(CONSENT_KEY)!)).toMatchObject({ value: "granted" });
    writeConsent("denied");
    expect(readConsent()).toBe("denied");
  });

  it("asks again once a choice is a year old", () => {
    const now = Date.now();
    writeConsent("granted", now - CONSENT_MAX_AGE_MS - 1);
    resetConsentMemory();
    expect(readConsent(now)).toBeNull();
  });

  it("ignores corrupt or unexpected stored values", () => {
    localStorage.setItem(CONSENT_KEY, "{not json");
    expect(readConsent()).toBeNull();
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ value: "maybe", at: Date.now() }));
    expect(readConsent()).toBeNull();
  });

  it("treats Global Privacy Control as a no, unless the visitor opts in", () => {
    setGpc(true);
    expect(readConsent()).toBe("denied");
    writeConsent("granted");
    expect(readConsent()).toBe("granted");
  });

  it("still holds a choice for this page view when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    writeConsent("denied");
    expect(readConsent()).toBe("denied");
  });
});

describe("CookieBanner", () => {
  it("asks until the visitor chooses, with equally easy options", async () => {
    render(<CookieBanner />);
    const banner = screen.getByRole("region", { name: "Cookies and analytics" });
    expect(banner).toHaveTextContent(/cookieless/);
    expect(screen.getByRole("link", { name: "cookie policy" })).toHaveAttribute("href", "/cookies");
    const decline = screen.getByRole("button", { name: "Decline" });
    const allow = screen.getByRole("button", { name: "Allow analytics" });
    expect(decline.className).toBe(allow.className);

    await userEvent.click(decline);
    expect(screen.queryByRole("region", { name: "Cookies and analytics" })).not.toBeInTheDocument();
    expect(readConsent()).toBe("denied");
  });

  it("stays hidden once a choice exists, or when the browser sends Global Privacy Control", () => {
    writeConsent("granted");
    const { unmount } = render(<CookieBanner />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    unmount();

    localStorage.clear();
    resetConsentMemory();
    setGpc(true);
    render(<CookieBanner />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});

describe("ConsentedAnalytics", () => {
  it("loads analytics only after consent, and stops sending when consent is withdrawn", async () => {
    render(
      <>
        <CookieBanner />
        <ConsentedAnalytics />
      </>,
    );
    expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Allow analytics" }));
    expect(screen.getByTestId("vercel-analytics")).toBeInTheDocument();
    const event = { type: "pageview" as const, url: "/expressjs/express" };
    expect(analytics.beforeSend?.(event)).toEqual(event);

    act(() => writeConsent("denied"));
    expect(screen.queryByTestId("vercel-analytics")).not.toBeInTheDocument();
    // The script can't be unloaded without a reload, so every later event is dropped instead.
    expect(analytics.beforeSend?.(event)).toBeNull();
  });
});

describe("ConsentControls", () => {
  it("shows the current choice and changes it, in sync with the banner", async () => {
    render(
      <>
        <ConsentControls />
        <CookieBanner />
      </>,
    );
    const toggle = screen.getByRole("switch", { name: "Allow Vercel Web Analytics" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle).toHaveAccessibleDescription(/haven't made a choice/);

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).toHaveAccessibleDescription(/Analytics is on/);
    expect(readConsent()).toBe("granted");
    expect(screen.queryByRole("region", { name: "Cookies and analytics" })).not.toBeInTheDocument();

    toggle.focus();
    await userEvent.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(readConsent()).toBe("denied");
  });

  it("explains a Global Privacy Control signal", () => {
    setGpc(true);
    render(<ConsentControls />);
    expect(screen.getByRole("switch")).toHaveAccessibleDescription(/Global Privacy Control/);
  });

  it("follows changes made in another tab", () => {
    render(<ConsentControls />);
    act(() => {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ value: "granted", at: Date.now() }));
      window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_KEY }));
    });
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });
});
