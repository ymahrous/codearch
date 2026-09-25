import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasteAnalyzer } from "@/components/paste/paste-analyzer";

const US = "\x1f";
const LOG = [
  `@@b2${US}Grace Hopper${US}1600000000${US}second`,
  "",
  "M\tsrc/app.ts",
  `@@a1${US}Ada Lovelace${US}1500000000${US}first`,
  "",
  "A\tsrc/app.ts",
  "A\tREADME.md",
].join("\n");

describe("PasteAnalyzer", () => {
  it("shows the command to run", () => {
    render(<PasteAnalyzer />);
    expect(screen.getByText(/git -c core.quotePath=false log/)).toBeInTheDocument();
  });

  it("analyzes a pasted log entirely in the browser", async () => {
    render(<PasteAnalyzer />);
    fireEvent.change(screen.getByLabelText("Git log output"), { target: { value: LOG } });
    await userEvent.type(screen.getByLabelText("Repository name (optional)"), "acme/internal");
    await userEvent.click(screen.getByRole("button", { name: "Analyze log" }));
    expect(screen.getByRole("heading", { level: 1, name: "acme/internal" })).toBeInTheDocument();
    expect(screen.getByText("From pasted log")).toBeInTheDocument();
  });

  it("reads a dropped or chosen file", async () => {
    const { container } = render(<PasteAnalyzer />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File([LOG], "my-service.txt", { type: "text/plain" }));
    expect(await screen.findByRole("heading", { level: 1, name: "my-service" })).toBeInTheDocument();
  });

  it("re-analyzes the whole file, not the truncated preview, of a large upload", async () => {
    // Pad the log past the preview limit so the only README.md commit falls outside the preview.
    const filler = Array.from(
      { length: 400 },
      (_, i) => `@@f${i}${US}Grace Hopper${US}${1600000000 + i}${US}${"x".repeat(60)}\n\nM\tsrc/app.ts`,
    );
    const big = [...filler, LOG].join("\n");
    const { container } = render(<PasteAnalyzer />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File([big], "big.txt", { type: "text/plain" }));
    await screen.findByRole("heading", { level: 1, name: "big" });
    expect((screen.getByLabelText("Git log output") as HTMLTextAreaElement).value).toMatch(/preview truncated/);
    const commitsBefore = screen.getByText("Commits", { selector: "dt" }).nextElementSibling?.textContent;
    await userEvent.click(screen.getByRole("button", { name: "Analyze log" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Commits", { selector: "dt" }).nextElementSibling?.textContent).toBe(commitsBefore);
    expect(commitsBefore).toBe("402");
  });

  it("explains what's wrong with unusable input", async () => {
    render(<PasteAnalyzer />);
    fireEvent.change(screen.getByLabelText("Git log output"), { target: { value: "just some text" } });
    await userEvent.click(screen.getByRole("button", { name: "Analyze log" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/No commits found/);
  });
});
