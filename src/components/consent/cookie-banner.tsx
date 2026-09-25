"use client";

import { Cookie } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { writeConsent } from "@/lib/consent";
import { useConsent } from "./use-consent";

/**
 * Asks once whether analytics may run. Nothing optional loads until the visitor
 * chooses; both choices are equally easy, and the cookie policy page can change it.
 */
export function CookieBanner() {
  const consent = useConsent();
  const ref = useRef<HTMLElement>(null);
  const open = consent === null;

  // Keep keyboard focus from ending up hidden behind the banner (WCAG 2.2, 2.4.11 Focus Not
  // Obscured). Browsers don't scroll an element that's already on screen when it gets focus,
  // so scroll it clear ourselves, and leave room at the end of the page to do so.
  useEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    const root = document.documentElement;
    const reserve = () => root.style.setProperty("--consent-banner-height", `${el.offsetHeight}px`);
    reserve();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(reserve);
    ro?.observe(el);
    const onFocusIn = (e: FocusEvent) => {
      if (!(e.target instanceof Element) || el.contains(e.target) || !e.target.matches(":focus-visible")) return;
      const overlap = e.target.getBoundingClientRect().bottom - el.getBoundingClientRect().top;
      if (overlap > 0) window.scrollBy(0, overlap + 16);
    };
    document.addEventListener("focusin", onFocusIn);
    return () => {
      ro?.disconnect();
      document.removeEventListener("focusin", onFocusIn);
      root.style.removeProperty("--consent-banner-height");
    };
  }, [open]);

  if (!open) return null;
  return (
    <section
      ref={ref}
      aria-labelledby="consent-title"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="pointer-events-auto mx-auto flex max-w-4xl animate-[rise_300ms_ease-out] flex-col gap-4 rounded-xl border border-border-strong bg-surface p-5 shadow-2xl shadow-black/10 md:flex-row md:items-end">
        <div className="flex min-w-0 flex-1 gap-3">
          <Cookie className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
          <div>
            <h2 id="consent-title" className="font-semibold text-fg">
              Cookies and analytics
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              We don&apos;t use advertising or tracking cookies. With your permission, we&apos;d like to count page views with Vercel Web
              Analytics: it&apos;s cookieless, doesn&apos;t store your IP address and can&apos;t follow you to other sites. You can change
              your mind at any time on our{" "}
              <Link href="/cookies" className="font-medium text-fg underline underline-offset-2 hover:text-accent">
                cookie policy
              </Link>{" "}
              page.
            </p>
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => writeConsent("denied")}>
            Decline
          </Button>
          <Button variant="outline" onClick={() => writeConsent("granted")}>
            Allow analytics
          </Button>
        </div>
      </div>
    </section>
  );
}
