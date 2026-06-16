import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "./separator";

describe("Separator", () => {
	it("renders with data-slot='separator'", () => {
		render(<Separator data-testid="sep" />);
		expect(screen.getByTestId("sep")).toHaveAttribute("data-slot", "separator");
	});

	it("defaults to horizontal orientation", () => {
		render(<Separator data-testid="sep" />);
		expect(screen.getByTestId("sep")).toHaveAttribute("data-orientation", "horizontal");
	});

	it("supports vertical orientation", () => {
		render(<Separator data-testid="sep" orientation="vertical" />);
		expect(screen.getByTestId("sep")).toHaveAttribute("data-orientation", "vertical");
	});

	it("merges custom className", () => {
		render(<Separator data-testid="sep" className="my-sep" />);
		expect(screen.getByTestId("sep")).toHaveClass("my-sep");
	});
});
