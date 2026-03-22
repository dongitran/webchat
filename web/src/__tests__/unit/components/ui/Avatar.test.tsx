import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "@/components/ui/Avatar.js";

describe("Avatar component", () => {
  it("renders an img element when src is provided", () => {
    render(<Avatar src="https://example.com/avatar.jpg" name="Alice" />);
    const img = screen.getByRole("img", { name: "Alice" });
    expect(img).toBeDefined();
    expect((img as HTMLImageElement).src).toContain("avatar.jpg");
  });

  it("renders initials when no src provided", () => {
    render(<Avatar name="Alice Bob" />);
    expect(screen.getByText("AB")).toBeDefined();
  });

  it("renders single initial for single-word name", () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText("A")).toBeDefined();
  });

  it("uses only first two words for initials", () => {
    render(<Avatar name="Alice Bob Charlie" />);
    expect(screen.getByText("AB")).toBeDefined();
  });

  it("shows status dot when showStatus=true and status provided", () => {
    render(<Avatar name="Alice" showStatus status="online" />);
    const dot = screen.getByLabelText("online");
    expect(dot).toBeDefined();
  });

  it("does not show status dot when showStatus=false", () => {
    render(<Avatar name="Alice" showStatus={false} status="online" />);
    expect(screen.queryByLabelText("online")).toBeNull();
  });

  it("does not show status dot when status is undefined", () => {
    render(<Avatar name="Alice" showStatus />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("applies null src as fallback to initials", () => {
    render(<Avatar src={null} name="Test User" />);
    expect(screen.getByText("TU")).toBeDefined();
  });

  it("renders with xs size without errors", () => {
    render(<Avatar name="Alice" size="xs" />);
    expect(screen.getByText("A")).toBeDefined();
  });

  it("renders with xl size without errors", () => {
    render(<Avatar name="Alice" size="xl" />);
    expect(screen.getByText("A")).toBeDefined();
  });
});
