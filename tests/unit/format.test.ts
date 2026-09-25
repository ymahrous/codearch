import { describe, expect, it } from "vitest";
import { formatAgo, formatCompact, formatDay, formatDuration, formatHour, formatMonth, formatPercent, strataColor } from "@/lib/format";

describe("format helpers", () => {
  it("formats durations", () => {
    expect(formatDuration(3600)).toBe("1 hr");
    expect(formatDuration(5 * 3600)).toBe("5 hrs");
    expect(formatDuration(86400)).toBe("1 day");
    expect(formatDuration(98 * 86400)).toBe("98 days");
    expect(formatDuration(4.25 * 365.25 * 86400)).toBe("4.3 yrs");
    expect(formatDuration(17 * 365.25 * 86400)).toBe("17 yrs");
  });

  it("formats relative time", () => {
    const now = 1_000_000_000_000;
    expect(formatAgo(now / 1000, now)).toBe("just now");
    expect(formatAgo(now / 1000 - 12 * 60, now)).toBe("12 min ago");
    expect(formatAgo(now / 1000 - 3 * 3600, now)).toBe("3 hr ago");
    expect(formatAgo(now / 1000 - 5 * 86400, now)).toBe("5 days ago");
  });

  it("formats dates in UTC", () => {
    expect(formatMonth(0)).toBe("Jan 1970");
    expect(formatDay("2009-12-03")).toBe("December 3, 2009");
    expect(formatHour(7)).toBe("07:00 UTC");
  });

  it("formats numbers and shares", () => {
    expect(formatCompact(9999)).toBe("9,999");
    expect(formatCompact(68_400)).toBe("68.4K");
    expect(formatPercent(0.494)).toBe("49%");
  });

  it("maps contributor slots to palette variables", () => {
    expect(strataColor(0)).toBe("var(--s0)");
    expect(strataColor(-1)).toBe("var(--sx)");
  });
});
