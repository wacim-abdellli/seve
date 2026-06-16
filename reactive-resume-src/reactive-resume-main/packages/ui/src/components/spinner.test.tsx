import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./spinner";

describe("Spinner", () => {
	it("renders with role='status' for screen readers", () => {
		render(<Spinner />);
		expect(screen.getByRole("status")).toBeInTheDocument();
	});

	it("has accessible label 'Loading'", () => {
		render(<Spinner />);
		expect(screen.getByLabelText("Loading")).toBeInTheDocument();
	});

	it("merges custom className", () => {
		render(<Spinner className="my-spinner" />);
		expect(screen.getByRole("status")).toHaveClass("my-spinner");
	});

	it("applies animate-spin by default", () => {
		render(<Spinner />);
		expect(screen.getByRole("status")).toHaveClass("animate-spin");
	});

	it("uses currentColor by default (mapped to SVG fill/stroke by Phosphor)", () => {
		render(<Spinner />);
		const svg = screen.getByRole("status");
		// Phosphor maps the `color` prop to inline style (fill/stroke), not an attribute.
		// The hex/RGB or "currentColor" appears somewhere in style/attr — verify presence in serialized output.
		expect(svg.outerHTML).toContain("currentColor");
	});

	it("respects color override", () => {
		render(<Spinner color="red" />);
		const svg = screen.getByRole("status");
		expect(svg.outerHTML).toMatch(/red/);
	});
});
