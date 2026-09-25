"use client";

import { useSyncExternalStore } from "react";
import { readConsent, subscribeConsent, type Consent } from "@/lib/consent";

/** The visitor's analytics choice. `undefined` until it can be read, i.e. on the server and during hydration. */
export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(
    subscribeConsent,
    () => readConsent(),
    () => undefined,
  );
}
