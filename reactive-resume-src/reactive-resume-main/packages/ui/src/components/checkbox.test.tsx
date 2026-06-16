import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
	it("renders with data-slot='checkbox'", () => {
		render(<Checkbox data-testid="cb" />);
		expect(screen.getByTestId("cb")).toHaveAttribute("data-slot", "checkbox");
	});

	it("defaults to unchecked", () => {
		render(<Checkbox data-testid="cb" />);
		const cb = screen.getByTestId("cb");
		// base-ui sets aria-checked
		expect(cb.getAttribute("aria-checked")).toBe("false");
	});

	it("renders as checked via defaultChecked", () => {
		render(<Checkbox data-testid="cb" defaultChecked />);
		expect(screen.getByTestId("cb").getAttribute("aria-checked")).toBe("true");
	});

	it("can be controlled via checked prop", () => {
		render(<Checkbox data-testid="cb" checked onCheckedChange={() => {}} />);
		expect(screen.getByTestId("cb").getAttribute("aria-checked")).toBe("true");
	});

	it("calls onCheckedChange when toggled", async () => {
		const onChange = vi.fn();
		render(<Checkbox data-testid="cb" onCheckedChange={onChange} />);
		await userEvent.click(screen.getByTestId("cb"));
		expect(onChange).toHaveBeenCalledOnce();
	});

	it("respects disabled state via aria-disabled (base-ui uses span+role)", () => {
		render(<Checkbox data-testid="cb" disabled />);
		const cb = screen.getByTestId("cb");
		expect(cb.getAttribute("aria-disabled")).toBe("true");
		expect(cb).toHaveAttribute("data-disabled");
	});

	it("merges custom className", () => {
		render(<Checkbox data-testid="cb" className="my-cb" />);
		expect(screen.getByTestId("cb")).toHaveClass("my-cb");
	});
});
