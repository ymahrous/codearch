"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { readConsent } from "@/lib/consent";
import { useConsent } from "./use-consent";

// Checked for every event, so withdrawing consent stops tracking at once, without a reload
// (the analytics script stays loaded until the next full page load, but sends nothing).
const onlyWithConsent = (event: BeforeSendEvent) => (readConsent() === "granted" ? event : null);

/** Loads Vercel Web Analytics, but only once the visitor has allowed it. */
export function ConsentedAnalytics() {
  return useConsent() === "granted" ? <Analytics beforeSend={onlyWithConsent} /> : null;
}
