import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import type { QA } from "@/lib/seo";
import { isBot } from "./analyze";
import type { Report } from "./types";

const count = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;
const clip = (s: string, max = 100) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

function list(items: string[]) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Single-owner folders, as the report's "Single-owner folders" figure counts them. */
export const riskFolders = (r: Report) => r.territory["1|nobots"].filter((t) => t.busFactor === 1 && t.authors > 1);

/** One or two sentences that sum up a repository's history, for the top of the report and its meta description. */
export function reportSummary(r: Report): string {
  const { commits, contributors, firstTs, lastTs } = r.stats;
  const span = firstTs === lastTs ? `on ${formatDate(firstTs)}` : `between ${formatDate(firstTs)} and ${formatDate(lastTs)}`;
  const lead = r.top[0];
  return (
    `${r.name} has ${count(commits, "commit")} from ${count(contributors, "contributor")}, made ${span}.` +
    (lead ? ` ${lead.name} made the most: ${formatNumber(lead.commits)} (${formatPercent(lead.commits / commits)}).` : "")
  );
}

/**
 * Plain questions and direct answers about a repository, built from its report. Shown on
 * the report page and published as FAQ structured data for search and answer engines.
 */
export function reportFaq(r: Report): QA[] {
  const { commits, contributors } = r.stats;
  const qas: QA[] = [];

  const [lead, next] = r.top;
  if (lead) {
    qas.push({
      question: `Who has made the most commits to ${r.name}?`,
      answer:
        `${lead.name} has made the most commits to ${r.name}: ${formatNumber(lead.commits)} of ${formatNumber(commits)} (${formatPercent(lead.commits / commits)}).` +
        (next ? ` ${next.name} is next, with ${formatNumber(next.commits)}.` : ""),
    });
  }

  qas.push({
    question: `How many people have contributed to ${r.name}?`,
    answer:
      `${count(contributors, "person has", "people have")} made commits to ${r.name}.` +
      (r.notes.oneTimers
        ? ` ${formatNumber(r.notes.oneTimers)} of them (${formatPercent(r.notes.oneTimers / contributors)}) made a single commit.`
        : ""),
  });

  const first = r.notes.first;
  qas.push({
    question: `When was ${r.name} started?`,
    answer: `The first commit to ${r.name} was made on ${formatDate(first.ts)} by ${first.author}${first.message ? `, with the message “${clip(first.message)}”` : ""}.`,
  });

  const latest = r.years.find((y) => y.commits > 0);
  // People, not bots, as for eras.
  const recent = latest?.topPeople.find((p) => !isBot(p.name));
  if (latest && recent) {
    qas.push({
      question: `Who was the most active person in ${r.name} in ${latest.year}?`,
      answer: `In ${latest.year}, ${recent.name} was the most active person in ${r.name}, with ${formatNumber(recent.n)} of its ${formatNumber(latest.commits)} commits that year.`,
    });
  }

  const folders = r.territory["1|nobots"];
  if (folders.length) {
    const risky = riskFolders(r);
    const scope =
      folders.length < 30 ? `its ${count(folders.length, "top-level folder")}` : `its ${folders.length} most active top-level folders`;
    qas.push({
      question: `What is the bus factor of ${r.name}?`,
      answer: risky.length
        ? `${formatNumber(risky.length)} of ${scope} ${risky.length === 1 ? "has" : "have"} a bus factor of 1, meaning one person made at least half of ${risky.length === 1 ? "its" : "each folder's"} commits: ${list(
            risky.slice(0, 3).map((f) => `${f.folder} (${f.owner})`),
          )}${risky.length > 3 ? ", among others" : ""}.`
        : `None of ${scope} has a bus factor of 1: in every one, it takes at least two people to account for half of the commits.`,
    });
  }

  const oldest = r.oldest[0];
  if (oldest) {
    qas.push({
      question: `What is the oldest file in ${r.name}?`,
      answer: `${oldest.path} is the oldest file still in ${r.name}. It was added on ${formatDate(oldest.ts)} by ${oldest.author}.`,
    });
  }

  return qas;
}
