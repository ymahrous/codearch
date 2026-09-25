import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReportView } from "@/components/report/report-view";
import type { DigResponse } from "@/lib/archaeology/types";
import example from "@/data/example-report.json";

const data = example as unknown as DigResponse;

describe("ReportView", () => {
  it("shows the headline numbers and every section", () => {
    render(<ReportView report={data.report} meta={data.meta} cached />);
    expect(screen.getByRole("heading", { level: 1, name: "expressjs/express" })).toBeInTheDocument();
    expect(screen.getByText("6,170")).toBeInTheDocument();
    expect(screen.getByText("392")).toBeInTheDocument();
    for (const name of ["Rock layers", "Who owns which folder", "Fossil record", "Notable finds"]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("navigation", { name: "Report sections" })).toBeInTheDocument();
    expect(screen.getByText(/Analyzed/)).toBeInTheDocument();
  });

  it("offers the chart as an accessible table", async () => {
    render(<ReportView report={data.report} />);
    expect(screen.getByRole("list", { name: /Commits per year/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show as table" }));
    const table = screen.getByRole("table", { name: "Commits per year" });
    expect(within(table).getAllByRole("row")).toHaveLength(data.report.years.length + 1);
  });

  it("filters, sorts and re-groups the ownership table", async () => {
    render(<ReportView report={data.report} />);
    const table = screen.getByRole("table", { name: "Folder ownership" });
    const rows = () => within(table).getAllByRole("row").slice(1);
    expect(rows()[0]).toHaveTextContent("lib/");

    await userEvent.type(screen.getByLabelText("Filter folders or owners"), "exam");
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent("examples/");

    await userEvent.clear(screen.getByLabelText("Filter folders or owners"));
    await userEvent.type(screen.getByLabelText("Filter folders or owners"), "zzz");
    expect(within(table).getByText(/No folders match/)).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText("Filter folders or owners"));

    await userEvent.click(within(table).getByRole("button", { name: /Folder/ }));
    expect(within(table).getByRole("columnheader", { name: /Folder/ })).toHaveAttribute("aria-sort", "ascending");

    await userEvent.click(screen.getByRole("radio", { name: "Two levels" }));
    expect(screen.getByRole("radio", { name: "Two levels" })).toHaveAttribute("aria-checked", "true");
    expect(within(table).getAllByText(/^[^/]+\/[^/]+\/$/).length).toBeGreaterThan(0);
  });

  it("marks single-owner folders as at risk", () => {
    render(<ReportView report={data.report} />);
    expect(screen.getAllByText("1 · at risk").length).toBeGreaterThan(0);
  });

  it("copies the page link and supports re-analysis", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const onRefresh = vi.fn();
    render(<ReportView report={data.report} meta={data.meta} onRefresh={onRefresh} />);
    await userEvent.click(screen.getByRole("button", { name: /Copy link/ }));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Re-analyze/ }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("hides git-only actions for pasted logs", () => {
    render(<ReportView report={{ ...data.report, source: "paste" }} />);
    expect(screen.getByText("From pasted log")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copy link/ })).not.toBeInTheDocument();
  });
});
