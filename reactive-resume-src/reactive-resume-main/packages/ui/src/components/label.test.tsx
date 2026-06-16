import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./label";

describe("Label", () => {
	it("renders as a <label> element", () => {
		render(<Label>Name</Label>);
		expect(screen.getByText("Name").tagName).toBe("LABEL");
	});

	it("applies data-slot='label'", () => {
		render(<Label>x</Label>);
		expect(screen.getByText("x")).toHaveAttribute("data-slot", "label");
	});

	it("merges custom className", () => {
		render(<Label className="my-custom">x</Label>);
		expect(screen.getByText("x")).toHaveClass("my-custom");
	});

	it("supports htmlFor association with inputs", () => {
		render(
			<>
				<Label htmlFor="name">Name</Label>
				<input id="name" />
			</>,
		);
		const input = screen.getByLabelText("Name");
		expect(input.tagName).toBe("INPUT");
	});
});
