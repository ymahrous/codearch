import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Segmented } from "@/components/ui/segmented";

function Harness() {
  const [value, setValue] = useState<"a" | "b" | "c">("a");
  return (
    <>
      <button type="button">Before</button>
      <Segmented
        label="Letter"
        value={value}
        onChange={setValue}
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
        ]}
      />
      <button type="button">After</button>
    </>
  );
}

describe("Segmented", () => {
  it("is a single Tab stop on the selected option", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Before" }));
    await userEvent.tab();
    expect(screen.getByRole("radio", { name: "A" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("moves the selection with arrow keys, Home and End, wrapping around", async () => {
    render(<Harness />);
    screen.getByRole("radio", { name: "A" }).focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "B" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "B" })).toHaveFocus();

    await userEvent.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "C" })).toBeChecked();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "A" })).toBeChecked();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "C" })).toBeChecked();
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "A" })).toHaveFocus();
    expect(screen.getByRole("radiogroup", { name: "Letter" })).toBeInTheDocument();
  });
});
