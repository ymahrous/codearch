import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepoSearch } from "@/components/search/repo-search";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => push.mockReset());

describe("RepoSearch", () => {
  it("navigates to the report for a valid repository", async () => {
    render(<RepoSearch />);
    await userEvent.type(screen.getByLabelText("Repository"), "https://github.com/pallets/flask{Enter}");
    expect(push).toHaveBeenCalledWith("/pallets/flask");
  });

  it("keeps the host for GitLab and Codeberg", async () => {
    render(<RepoSearch />);
    await userEvent.type(screen.getByLabelText("Repository"), "gitlab.com/a/b");
    await userEvent.click(screen.getByRole("button", { name: /Analyze/ }));
    expect(push).toHaveBeenCalledWith("/a/b?host=gitlab.com");
  });

  it("explains invalid input and clears the error on edit", async () => {
    render(<RepoSearch />);
    const input = screen.getByLabelText("Repository");
    await userEvent.type(input, "not a repo{Enter}");
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/owner\/name/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    await userEvent.type(input, "x");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
