import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RepoReport } from "@/components/report/repo-report";
import type { DigResponse } from "@/lib/archaeology/types";
import example from "@/data/example-report.json";

afterEach(() => vi.unstubAllGlobals());

describe("RepoReport", () => {
  it("shows progress, then the report", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(example));
    vi.stubGlobal("fetch", fetchMock);
    render(<RepoReport repoInput="expressjs/express" slug="expressjs/express" />);
    expect(screen.getByText(/Finding the repository/)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Rock layers" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/dig?repo=expressjs%2Fexpress", expect.anything());
  });

  it("shows a report the server already had without requesting it again, and can still re-analyze", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(example));
    vi.stubGlobal("fetch", fetchMock);
    render(<RepoReport repoInput="expressjs/express" slug="expressjs/express" initial={example as unknown as DigResponse} />);
    expect(screen.getByRole("heading", { name: "Rock layers" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Re-analyze" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/dig?repo=expressjs%2Fexpress&refresh=1", expect.anything());
  });

  it("shows API errors and retries", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ error: { code: "timeout", message: "Downloading took too long." } }, { status: 504 }))
      .mockResolvedValueOnce(Response.json(example));
    vi.stubGlobal("fetch", fetchMock);
    render(<RepoReport repoInput="expressjs/express" slug="expressjs/express" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Downloading took too long.");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Rock layers" })).toBeInTheDocument();
  });

  it("doesn't offer a retry for errors that won't change", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: { code: "not_found", message: "Nope." } }, { status: 404 })));
    render(<RepoReport repoInput="a/b" slug="a/b" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Nope.");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Paste a local git log/ })).toHaveAttribute("href", "/analyze");
  });

  it("re-analyzes with refresh=1", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => Response.json(example));
    vi.stubGlobal("fetch", fetchMock);
    render(<RepoReport repoInput="expressjs/express" slug="expressjs/express" />);
    await userEvent.click(await screen.findByRole("button", { name: /Re-analyze/ }));
    await screen.findByRole("button", { name: /Re-analyze/ });
    expect(fetchMock).toHaveBeenLastCalledWith("/api/dig?repo=expressjs%2Fexpress&refresh=1", expect.anything());
  });
});
