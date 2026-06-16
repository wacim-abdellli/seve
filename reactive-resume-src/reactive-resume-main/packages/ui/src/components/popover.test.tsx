import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "./popover";

describe("Popover", () => {
	it("trigger element has data-slot='popover-trigger'", () => {
		render(
			<Popover>
				<PopoverTrigger data-testid="trigger">Open</PopoverTrigger>
				<PopoverContent>content</PopoverContent>
			</Popover>,
		);
		expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "popover-trigger");
	});

	it("opens content on trigger click", async () => {
		render(
			<Popover>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent>Hidden text</PopoverContent>
			</Popover>,
		);

		expect(screen.queryByText("Hidden text")).not.toBeInTheDocument();
		await userEvent.click(screen.getByText("Open"));
		expect(await screen.findByText("Hidden text")).toBeInTheDocument();
	});

	it("supports default open via prop", () => {
		render(
			<Popover defaultOpen>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent>Initially visible</PopoverContent>
			</Popover>,
		);
		expect(screen.getByText("Initially visible")).toBeInTheDocument();
	});

	it("can be controlled via open prop", () => {
		render(
			<Popover open>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent>Controlled</PopoverContent>
			</Popover>,
		);
		expect(screen.getByText("Controlled")).toBeInTheDocument();
	});
});

describe("PopoverHeader", () => {
	it("uses data-slot='popover-header'", () => {
		render(<PopoverHeader data-testid="h">Title</PopoverHeader>);
		expect(screen.getByTestId("h")).toHaveAttribute("data-slot", "popover-header");
	});

	it("merges custom className", () => {
		render(
			<PopoverHeader data-testid="h" className="my-class">
				x
			</PopoverHeader>,
		);
		expect(screen.getByTestId("h")).toHaveClass("my-class");
	});
});

describe("PopoverTitle", () => {
	it("uses data-slot='popover-title'", () => {
		render(
			<Popover open>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent>
					<PopoverTitle>My title</PopoverTitle>
				</PopoverContent>
			</Popover>,
		);
		expect(screen.getByText("My title")).toHaveAttribute("data-slot", "popover-title");
	});
});

describe("PopoverDescription", () => {
	it("uses data-slot='popover-description'", () => {
		render(
			<Popover open>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent>
					<PopoverDescription>My description</PopoverDescription>
				</PopoverContent>
			</Popover>,
		);
		expect(screen.getByText("My description")).toHaveAttribute("data-slot", "popover-description");
	});
});

describe("PopoverContent", () => {
	it("uses data-slot='popover-content'", () => {
		render(
			<Popover open>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent>visible content</PopoverContent>
			</Popover>,
		);
		const content = screen.getByText("visible content");
		expect(content).toHaveAttribute("data-slot", "popover-content");
	});

	it("merges custom className", () => {
		render(
			<Popover open>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent className="my-class">visible</PopoverContent>
			</Popover>,
		);
		expect(screen.getByText("visible")).toHaveClass("my-class");
	});
});
