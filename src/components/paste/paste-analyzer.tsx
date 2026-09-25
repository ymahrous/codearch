"use client";

import { Check, Copy, FileUp, Lock } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { ReportView } from "@/components/report/report-view";
import { Button } from "@/components/ui/button";
import { analyze } from "@/lib/archaeology/analyze";
import { LOG_COMMAND, parseLog } from "@/lib/archaeology/log-format";
import type { Report } from "@/lib/archaeology/types";
import { cn } from "@/lib/cn";

const MAX_BYTES = 200 * 1024 * 1024;
const PREVIEW_CHARS = 20000;

export function PasteAnalyzer() {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // Full contents of a loaded file; the textarea only shows a preview of large files.
  const fileText = useRef<string | null>(null);

  const run = (raw: string, repoName = name) => {
    const commits = parseLog(raw);
    if (commits.length < 1) {
      setError("No commits found. Paste the full output of the command above, including the lines that start with @@.");
      setReport(null);
      return;
    }
    setError(null);
    setReport(analyze(commits, { name: repoName.trim() || "Your repository", source: "paste" }));
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const readFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("That file is over 200 MB. Try a shorter history, e.g. add --since=5.years to the command.");
      return;
    }
    file.text().then(
      (s) => {
        fileText.current = s;
        setText(s.length > PREVIEW_CHARS ? s.slice(0, PREVIEW_CHARS) + "\n… (file loaded, preview truncated)" : s);
        // Use the file name as the report name unless one was typed (or it's the default history.txt).
        const repoName = name || (file.name !== "history.txt" ? file.name.replace(/\.(txt|log)$/, "") : "");
        if (repoName !== name) setName(repoName);
        run(s, repoName);
      },
      () => setError("That file couldn't be read. Try choosing it again, or paste its contents instead."),
    );
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    readFile(e.dataTransfer.files[0]);
  };

  const onDragLeave = (e: DragEvent) => {
    // Moving onto the textarea inside the drop zone also fires dragleave; ignore it.
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(LOG_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium">1. Run this inside your repository</p>
            <div className="mt-2 flex items-stretch gap-2">
              <code className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2.5 font-mono text-[13px] [overflow-wrap:anywhere]">
                {LOG_COMMAND}
              </code>
              <Button variant="outline" onClick={copy} aria-label="Copy command">
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">
              2. Drop <span className="font-mono">history.txt</span> here, or paste its contents
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={cn(
                "mt-2 rounded-xl border-2 border-dashed p-1 transition-colors",
                dragging ? "border-accent bg-accent-soft" : "border-border",
              )}
            >
              <label htmlFor="paste-log" className="sr-only">
                Git log output
              </label>
              <textarea
                id="paste-log"
                value={text}
                onChange={(e) => {
                  fileText.current = null;
                  setText(e.target.value);
                }}
                rows={9}
                spellCheck={false}
                placeholder={"@@9a34acf0␟Ada Lovelace␟1789494746␟fix: handle empty body\n\nM\tlib/response.js"}
                className="block w-full resize-y rounded-lg bg-surface p-3 font-mono text-xs outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="paste-name" className="sr-only">
              Repository name (optional)
            </label>
            <input
              id="paste-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Repository name (optional)"
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm sm:w-64"
            />
            <Button onClick={() => run(fileText.current ?? text)} disabled={!text.trim()}>
              Analyze log
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <FileUp aria-hidden /> Choose file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.log,text/plain"
              hidden
              onChange={(e) => {
                readFile(e.target.files?.[0]);
                // Clear the value so choosing the same file again still fires onChange.
                e.target.value = "";
              }}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
        <aside className="h-fit rounded-xl border border-border bg-surface p-5">
          <Lock className="size-5 text-accent" aria-hidden />
          <h2 className="mt-3 font-semibold">Stays on your device</h2>
          <p className="mt-2 text-sm text-fg-muted">
            Your log is parsed and analyzed in this browser tab. Nothing is uploaded, so this works for private and internal repositories.
          </p>
        </aside>
      </div>
      <div ref={resultRef} className="scroll-mt-24">
        {report && <ReportView report={report} />}
      </div>
    </div>
  );
}
