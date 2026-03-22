import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { Button } from "@/components/ui/Button.js";

describe("Button component", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeDefined();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("shows spinner and is disabled when loading=true", () => {
    render(<Button loading>Submit</Button>);
    const btn = screen.getByRole("button");
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    // Loader2 icon is rendered alongside children when loading
    expect(btn.querySelector("svg")).toBeDefined();
  });

  it("is disabled when disabled prop is passed", () => {
    render(<Button disabled>Click</Button>);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Click
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies fullWidth class when fullWidth=true", () => {
    const { container } = render(<Button fullWidth>Full</Button>);
    const btn = container.querySelector("button");
    expect(btn?.className).toContain("w-full");
  });

  it("renders as a button element by default", () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole("button").tagName).toBe("BUTTON");
  });

  it("forwards ref to the button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("BUTTON");
  });
});
