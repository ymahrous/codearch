"use client";

import { hasGlobalPrivacyControl, writeConsent } from "@/lib/consent";
import { useConsent } from "./use-consent";

/** Lets visitors review and change their analytics choice. */
export function ConsentControls() {
  const consent = useConsent();
  const on = consent === "granted";

  let status = "Your choice is saved in this browser.";
  if (consent === null) status = "You haven't made a choice yet, so analytics is off.";
  else if (consent === "granted") status = "Analytics is on. Thank you for helping us improve the site.";
  else if (consent === "denied") {
    status = hasGlobalPrivacyControl()
      ? "Analytics is off. Your browser sends a Global Privacy Control signal, which we treat as a no unless you switch analytics on here."
      : "Analytics is off.";
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p id="analytics-switch-label" className="font-medium text-fg">
            Allow Vercel Web Analytics
          </p>
          <p id="analytics-switch-hint" className="mt-1 text-sm">
            Anonymous, cookieless page-view statistics.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="analytics-switch-label"
          aria-describedby="analytics-switch-hint analytics-switch-status"
          disabled={consent === undefined}
          onClick={() => writeConsent(on ? "denied" : "granted")}
          className="group relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-fg-subtle transition-colors disabled:opacity-50 aria-checked:bg-accent"
        >
          <span className="inline-block size-5 translate-x-1 rounded-full bg-surface shadow transition-transform group-aria-checked:translate-x-6" />
        </button>
      </div>
      <p id="analytics-switch-status" className="mt-3 border-t border-border pt-3 text-sm">
        {status}
      </p>
    </div>
  );
}
