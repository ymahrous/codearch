import type { QA } from "./seo";

/**
 * Questions answered on the home page. The same text feeds the FAQ structured data and
 * llms.txt, so answers stay identical everywhere. Each answer leads with a direct,
 * self-contained sentence that search and answer engines can quote on its own.
 */
export const HOME_FAQ: readonly QA[] = [
  {
    question: "What is Codebase Archaeology?",
    answer:
      "Codebase Archaeology is a free web tool that turns the commit history of a public git repository into a visual report: activity drawn as rock layers by year, the eras each maintainer led, who owns each folder today with its bus factor, and the oldest files still in the code.",
  },
  {
    question: "What is a bus factor?",
    answer:
      "A bus factor is the smallest number of people who together made at least half of a folder's commits. A bus factor of 1 means one person holds most of that code's history, so the project depends heavily on them.",
  },
  {
    question: "How does it read a repository without cloning it?",
    answer:
      "It speaks git's own HTTP protocol (version 2) and asks the git host for a blob-less copy of the default branch: every commit and folder listing, but no file contents. Most repositories take a few seconds.",
  },
  {
    question: "Is my source code downloaded or stored?",
    answer:
      "No. File contents are never downloaded. Only commit metadata is read (author names, dates, the first line of each message and file paths), and the finished report is cached for up to six hours.",
  },
  {
    question: "Can I analyze a private repository?",
    answer:
      "Yes, with paste mode. Run one git log command inside your repository, then paste or drop its output into the page. The log is analyzed entirely in your browser and never uploaded.",
  },
  {
    question: "Which git hosts are supported?",
    answer:
      "Public repositories on GitHub, GitLab and Codeberg are supported. Type owner/name for GitHub, or paste the repository's URL for any of the three. Anything else, including self-hosted servers, works through paste mode.",
  },
  {
    question: "Is Codebase Archaeology free?",
    answer:
      "Yes. It's free, needs no account, and its source code is open under the MIT License. New analyses are rate limited per visitor to keep the service fast, but reports that are already cached are always free to open.",
  },
];

/** The paste-mode steps shown on /analyze, also published as HowTo structured data. */
export const PASTE_STEPS: readonly QA[] = [
  {
    question: "Run the git log command",
    answer: "Open a terminal inside your repository and run the command shown on the page. It writes the history to history.txt.",
  },
  {
    question: "Add the log",
    answer: "Drop history.txt onto the page, pick it with Choose file, or paste its contents into the text box.",
  },
  {
    question: "Analyze it",
    answer: "Select Analyze log. The report is built in your browser and nothing is uploaded.",
  },
];
