import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

describe("Card", () => {
	it("renders with data-slot='card'", () => {
		render(<Card data-testid="c">x</Card>);
		expect(screen.getByTestId("c")).toHaveAttribute("data-slot", "card");
	});

	it("defaults size to 'default'", () => {
		render(<Card data-testid="c">x</Card>);
		expect(screen.getByTestId("c")).toHaveAttribute("data-size", "default");
	});

	it("supports size='sm'", () => {
		render(
			<Card data-testid="c" size="sm">
				x
			</Card>,
		);
		expect(screen.getByTestId("c")).toHaveAttribute("data-size", "sm");
	});

	it("merges custom className", () => {
		render(
			<Card data-testid="c" className="my-custom">
				x
			</Card>,
		);
		expect(screen.getByTestId("c")).toHaveClass("my-custom");
	});
});

describe("Card subcomponents", () => {
	it.each([
		["CardHeader", CardHeader, "card-header"],
		["CardTitle", CardTitle, "card-title"],
		["CardDescription", CardDescription, "card-description"],
		["CardAction", CardAction, "card-action"],
		["CardContent", CardContent, "card-content"],
		["CardFooter", CardFooter, "card-footer"],
	] as const)("%s renders with data-slot='%s'", (_name, Component, slot) => {
		render(
			<Component data-testid="el">
				<span>child</span>
			</Component>,
		);
		expect(screen.getByTestId("el")).toHaveAttribute("data-slot", slot);
	});

	it("CardHeader merges custom className", () => {
		render(
			<CardHeader data-testid="h" className="my-class">
				x
			</CardHeader>,
		);
		expect(screen.getByTestId("h")).toHaveClass("my-class");
	});

	it("CardTitle merges custom className", () => {
		render(
			<CardTitle data-testid="t" className="my-class">
				x
			</CardTitle>,
		);
		expect(screen.getByTestId("t")).toHaveClass("my-class");
	});

	it("CardFooter merges custom className", () => {
		render(
			<CardFooter data-testid="f" className="my-class">
				x
			</CardFooter>,
		);
		expect(screen.getByTestId("f")).toHaveClass("my-class");
	});
});

describe("Card composition", () => {
	it("composes a full card", () => {
		render(
			<Card>
				<CardHeader>
					<CardTitle>Title</CardTitle>
					<CardDescription>Description</CardDescription>
					<CardAction>Action</CardAction>
				</CardHeader>
				<CardContent>Content</CardContent>
				<CardFooter>Footer</CardFooter>
			</Card>,
		);
		expect(screen.getByText("Title")).toBeInTheDocument();
		expect(screen.getByText("Description")).toBeInTheDocument();
		expect(screen.getByText("Action")).toBeInTheDocument();
		expect(screen.getByText("Content")).toBeInTheDocument();
		expect(screen.getByText("Footer")).toBeInTheDocument();
	});
});
