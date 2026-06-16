import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
	it("renders with data-slot='switch'", () => {
		render(<Switch data-testid="sw" />);
		expect(screen.getByTestId("sw")).toHaveAttribute("data-slot", "switch");
	});

	it("defaults size to 'default'", () => {
		render(<Switch data-testid="sw" />);
		expect(screen.getByTestId("sw")).toHaveAttribute("data-size", "default");
	});

	it("supports size='sm'", () => {
		render(<Switch data-testid="sw" size="sm" />);
		expect(screen.getByTestId("sw")).toHaveAttribute("data-size", "sm");
	});

	it("starts unchecked by default", () => {
		render(<Switch data-testid="sw" />);
		expect(screen.getByTestId("sw").getAttribute("aria-checked")).toBe("false");
	});

	it("respects defaultChecked", () => {
		render(<Switch data-testid="sw" defaultChecked />);
		expect(screen.getByTestId("sw").getAttribute("aria-checked")).toBe("true");
	});

	it("calls onCheckedChange when toggled", async () => {
		const onChange = vi.fn();
		render(<Switch data-testid="sw" onCheckedChange={onChange} />);
		await userEvent.click(screen.getByTestId("sw"));
		expect(onChange).toHaveBeenCalledOnce();
		expect(onChange).toHaveBeenCalledWith(true, expect.anything());
	});

	it("merges custom className", () => {
		render(<Switch data-testid="sw" className="my-custom" />);
		expect(screen.getByTestId("sw")).toHaveClass("my-custom");
	});
});
