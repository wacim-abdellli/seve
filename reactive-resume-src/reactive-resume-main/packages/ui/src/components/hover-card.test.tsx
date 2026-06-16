import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";

describe("HoverCard", () => {
	it("trigger has data-slot='hover-card-trigger'", () => {
		render(
			<HoverCard>
				<HoverCardTrigger data-testid="trigger">Hover</HoverCardTrigger>
				<HoverCardContent>preview</HoverCardContent>
			</HoverCard>,
		);
		expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "hover-card-trigger");
	});

	it("does not render content by default", () => {
		render(
			<HoverCard>
				<HoverCardTrigger>Hover</HoverCardTrigger>
				<HoverCardContent>Hidden preview</HoverCardContent>
			</HoverCard>,
		);
		expect(screen.queryByText("Hidden preview")).not.toBeInTheDocument();
	});

	it("renders content when controlled open", () => {
		render(
			<HoverCard open>
				<HoverCardTrigger>Hover</HoverCardTrigger>
				<HoverCardContent>Visible preview</HoverCardContent>
			</HoverCard>,
		);
		expect(screen.getByText("Visible preview")).toBeInTheDocument();
	});

	it("HoverCardContent uses data-slot='hover-card-content' when shown", () => {
		render(
			<HoverCard open>
				<HoverCardTrigger>x</HoverCardTrigger>
				<HoverCardContent>visible</HoverCardContent>
			</HoverCard>,
		);
		expect(screen.getByText("visible")).toHaveAttribute("data-slot", "hover-card-content");
	});

	it("merges custom className on HoverCardContent", () => {
		render(
			<HoverCard open>
				<HoverCardTrigger>x</HoverCardTrigger>
				<HoverCardContent className="my-class">visible</HoverCardContent>
			</HoverCard>,
		);
		expect(screen.getByText("visible")).toHaveClass("my-class");
	});
});
