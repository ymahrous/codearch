/**
 * The visitor's answer about optional analytics (Vercel Web Analytics). The site
 * sets no cookies, so this is the only choice there is to make.
 */
export type Consent = "granted" | "denied";

export const CONSENT_KEY = "analytics-consent";
const EVENT = "consentchange";
/** Ask again after a year, as EU data protection authorities recommend. */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

interface Stored {
  value: Consent;
  at: number;
}

// Used when local storage is blocked, so a choice still holds for this page view.
let memory: Stored | null = null;

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

const isValid = (s: Stored | null, now: number): s is Stored =>
  !!s && (s.value === "granted" || s.value === "denied") && typeof s.at === "number" && now - s.at < CONSENT_MAX_AGE_MS;

/** Whether the browser sends a Global Privacy Control signal (https://globalprivacycontrol.org). */
export function hasGlobalPrivacyControl(): boolean {
  return typeof navigator !== "undefined" && (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

/**
 * The visitor's current choice, or null if they haven't made one (or it's over a
 * year old). A Global Privacy Control signal counts as "denied" until they choose.
 */
export function readConsent(now = Date.now()): Consent | null {
  const stored = readStored();
  if (isValid(stored, now)) return stored.value;
  if (isValid(memory, now)) return memory.value;
  return hasGlobalPrivacyControl() ? "denied" : null;
}

export function writeConsent(value: Consent, now = Date.now()) {
  memory = { value, at: now };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(memory));
  } catch {
    // Storage blocked or full: the in-memory copy covers this page view.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** For tests. */
export function resetConsentMemory() {
  memory = null;
}

/** Calls `onChange` whenever the choice changes, in this tab or another one. Returns an unsubscribe function. */
export function subscribeConsent(onChange: () => void) {
  // Other tabs report changes through the storage event.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === CONSENT_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onChange);
  };
}
