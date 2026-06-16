import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollArea } from "./scroll-area";

describe("ScrollArea", () => {
	it("renders with data-slot='scroll-area'", () => {
		render(
			<ScrollArea data-testid="sa">
				<div>content</div>
			</ScrollArea>,
		);
		expect(screen.getByTestId("sa")).toHaveAttribute("data-slot", "scroll-area");
	});

	it("renders viewport with children", () => {
		const { container } = render(
			<ScrollArea>
				<div>content</div>
			</ScrollArea>,
		);
		expect(container.querySelector("[data-slot=scroll-area-viewport]")).toBeInTheDocument();
		expect(screen.getByText("content")).toBeInTheDocument();
	});

	it("merges custom className on root", () => {
		render(
			<ScrollArea data-testid="sa" className="my-class">
				<div>x</div>
			</ScrollArea>,
		);
		expect(screen.getByTestId("sa")).toHaveClass("my-class");
	});

	it("preserves the relative positioning class", () => {
		render(
			<ScrollArea data-testid="sa">
				<div>x</div>
			</ScrollArea>,
		);
		expect(screen.getByTestId("sa")).toHaveClass("relative");
	});
});
