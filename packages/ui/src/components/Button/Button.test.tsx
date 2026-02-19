import { ThemeProvider } from "@mui/material/styles";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { theme } from "../../tokens";
import { Button } from "./Button";

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe("Button", () => {
  it("renders children text", () => {
    renderWithTheme(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("calls onClick handler when clicked", async () => {
    const handleClick = vi.fn();
    renderWithTheme(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    renderWithTheme(<Button disabled>Click me</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("renders as a button element", () => {
    renderWithTheme(<Button>Click me</Button>);
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
  });
});
