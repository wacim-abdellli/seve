import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toggle } from "./toggle";

describe("Toggle", () => {
	it("renders with data-slot='toggle'", () => {
		render(<Toggle data-testid="t">on</Toggle>);
		expect(screen.getByTestId("t")).toHaveAttribute("data-slot", "toggle");
	});

	it("starts unpressed by default", () => {
		render(<Toggle data-testid="t">on</Toggle>);
		expect(screen.getByTestId("t").getAttribute("aria-pressed")).toBe("false");
	});

	it("can be controlled via pressed prop", () => {
		render(
			<Toggle data-testid="t" pressed>
				on
			</Toggle>,
		);
		expect(screen.getByTestId("t").getAttribute("aria-pressed")).toBe("true");
	});

	it("calls onPressedChange when clicked", async () => {
		const onChange = vi.fn();
		render(
			<Toggle data-testid="t" onPressedChange={onChange}>
				x
			</Toggle>,
		);
		await userEvent.click(screen.getByTestId("t"));
		expect(onChange).toHaveBeenCalledWith(true, expect.anything());
	});

	it.each([["default"], ["outline"]] as const)("renders variant=%s", (variant) => {
		render(
			<Toggle data-testid="t" variant={variant}>
				x
			</Toggle>,
		);
		expect(screen.getByTestId("t")).toBeInTheDocument();
	});

	it.each([["default"], ["sm"], ["lg"]] as const)("renders size=%s", (size) => {
		render(
			<Toggle data-testid="t" size={size}>
				x
			</Toggle>,
		);
		expect(screen.getByTestId("t")).toBeInTheDocument();
	});

	it("merges custom className", () => {
		render(
			<Toggle data-testid="t" className="my-custom">
				x
			</Toggle>,
		);
		expect(screen.getByTestId("t")).toHaveClass("my-custom");
	});
});
