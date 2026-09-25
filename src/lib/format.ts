const YEAR = 365.25 * 86400;

export const formatNumber = (n: number) => n.toLocaleString("en-US");

export const formatCompact = (n: number) =>
  n >= 10_000 ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n) : formatNumber(n);

export const formatDate = (unix: number) =>
  new Date(unix * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

export const formatMonth = (unix: number) =>
  new Date(unix * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", timeZone: "UTC" });

export const formatDay = (isoDay: string) =>
  new Date(`${isoDay}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

/** A duration in seconds as "17 yrs", "4.2 yrs" or "98 days". */
export function formatDuration(seconds: number): string {
  const y = seconds / YEAR;
  if (y >= 1) return `${y < 10 ? y.toFixed(1) : Math.round(y)} yrs`;
  const d = Math.round(seconds / 86400);
  if (d >= 1) return d === 1 ? "1 day" : `${d} days`;
  const h = Math.round(seconds / 3600);
  return h <= 1 ? "1 hr" : `${h} hrs`;
}

/** How long ago a unix time was, e.g. "just now", "12 min ago", "3 hr ago", "2 days ago". */
export function formatAgo(unix: number, nowMs = Date.now()): string {
  const m = Math.round((nowMs / 1000 - unix) / 60);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hr ago`;
  return `${Math.round(h / 24)} days ago`;
}

export const formatPercent = (share: number) => `${Math.round(share * 100)}%`;

export const formatHour = (h: number) => `${String(h).padStart(2, "0")}:00 UTC`;

export const strataColor = (idx: number) => (idx < 0 ? "var(--sx)" : `var(--s${idx})`);
