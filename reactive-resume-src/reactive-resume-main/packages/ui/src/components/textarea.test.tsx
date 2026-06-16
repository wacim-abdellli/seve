import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
	it("renders a <textarea> element", () => {
		render(<Textarea data-testid="t" />);
		expect(screen.getByTestId("t").tagName).toBe("TEXTAREA");
	});

	it("applies data-slot='textarea'", () => {
		render(<Textarea data-testid="t" />);
		expect(screen.getByTestId("t")).toHaveAttribute("data-slot", "textarea");
	});

	it("merges custom className", () => {
		render(<Textarea data-testid="t" className="custom" />);
		expect(screen.getByTestId("t")).toHaveClass("custom");
	});

	it("calls onChange when typing", async () => {
		const onChange = vi.fn();
		render(<Textarea data-testid="t" onChange={onChange} />);
		await userEvent.type(screen.getByTestId("t"), "hi");
		expect(onChange).toHaveBeenCalled();
	});

	it("respects disabled state", () => {
		render(<Textarea data-testid="t" disabled />);
		expect(screen.getByTestId("t")).toBeDisabled();
	});

	it("forwards rows and cols", () => {
		render(<Textarea data-testid="t" rows={5} cols={40} />);
		expect(screen.getByTestId("t")).toHaveAttribute("rows", "5");
		expect(screen.getByTestId("t")).toHaveAttribute("cols", "40");
	});

	it("supports controlled value", () => {
		render(<Textarea data-testid="t" value="hello" onChange={() => {}} />);
		expect(screen.getByTestId("t")).toHaveValue("hello");
	});
});
