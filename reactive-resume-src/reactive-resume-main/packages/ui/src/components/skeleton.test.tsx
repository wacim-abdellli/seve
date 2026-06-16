import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
	it("renders with data-slot='skeleton'", () => {
		render(<Skeleton data-testid="sk" />);
		expect(screen.getByTestId("sk")).toHaveAttribute("data-slot", "skeleton");
	});

	it("applies pulse animation classes", () => {
		render(<Skeleton data-testid="sk" />);
		expect(screen.getByTestId("sk")).toHaveClass("animate-pulse");
	});

	it("merges custom className", () => {
		render(<Skeleton className="h-10 w-20" data-testid="sk" />);
		const skeleton = screen.getByTestId("sk");
		expect(skeleton).toHaveClass("h-10");
		expect(skeleton).toHaveClass("w-20");
	});

	it("forwards arbitrary props", () => {
		render(<Skeleton data-testid="sk" aria-busy="true" />);
		expect(screen.getByTestId("sk")).toHaveAttribute("aria-busy", "true");
	});
});
