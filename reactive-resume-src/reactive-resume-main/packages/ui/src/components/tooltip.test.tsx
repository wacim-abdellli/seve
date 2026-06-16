import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

describe("Tooltip", () => {
	it("trigger has data-slot='tooltip-trigger'", () => {
		render(
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger data-testid="trigger">Hover me</TooltipTrigger>
					<TooltipContent>Helpful info</TooltipContent>
				</Tooltip>
			</TooltipProvider>,
		);
		expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "tooltip-trigger");
	});

	it("does not show content by default", () => {
		render(
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>Hover me</TooltipTrigger>
					<TooltipContent>Helpful info</TooltipContent>
				</Tooltip>
			</TooltipProvider>,
		);
		expect(screen.queryByText("Helpful info")).not.toBeInTheDocument();
	});

	it("shows content when controlled open", () => {
		render(
			<TooltipProvider>
				<Tooltip open>
					<TooltipTrigger>Hover me</TooltipTrigger>
					<TooltipContent>Helpful info</TooltipContent>
				</Tooltip>
			</TooltipProvider>,
		);
		expect(screen.getByText("Helpful info")).toBeInTheDocument();
	});

	it("content has data-slot='tooltip-content' when shown", () => {
		render(
			<TooltipProvider>
				<Tooltip open>
					<TooltipTrigger>Hover me</TooltipTrigger>
					<TooltipContent>Helpful info</TooltipContent>
				</Tooltip>
			</TooltipProvider>,
		);
		expect(screen.getByText("Helpful info")).toHaveAttribute("data-slot", "tooltip-content");
	});
});

describe("TooltipProvider", () => {
	it("renders children without errors", () => {
		render(
			<TooltipProvider>
				<div data-testid="child">child</div>
			</TooltipProvider>,
		);
		expect(screen.getByTestId("child")).toBeInTheDocument();
	});

	it("accepts custom delay", () => {
		render(
			<TooltipProvider delay={500}>
				<div>x</div>
			</TooltipProvider>,
		);
		// No throw = pass
		expect(true).toBe(true);
	});
});

describe("TooltipContent", () => {
	it("merges custom className when shown", () => {
		render(
			<TooltipProvider>
				<Tooltip open>
					<TooltipTrigger>x</TooltipTrigger>
					<TooltipContent className="my-tooltip">visible</TooltipContent>
				</Tooltip>
			</TooltipProvider>,
		);
		expect(screen.getByText("visible")).toHaveClass("my-tooltip");
	});
});
