import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./dialog";

describe("Dialog", () => {
	it("does not render content by default", () => {
		render(
			<Dialog>
				<DialogTrigger>Open</DialogTrigger>
				<DialogContent>Hidden body</DialogContent>
			</Dialog>,
		);
		expect(screen.queryByText("Hidden body")).not.toBeInTheDocument();
	});

	it("opens content via defaultOpen", () => {
		render(
			<Dialog defaultOpen>
				<DialogTrigger>Open</DialogTrigger>
				<DialogContent>Visible body</DialogContent>
			</Dialog>,
		);
		expect(screen.getByText("Visible body")).toBeInTheDocument();
	});

	it("opens content via controlled open", () => {
		render(
			<Dialog open>
				<DialogTrigger>Open</DialogTrigger>
				<DialogContent>Visible body</DialogContent>
			</Dialog>,
		);
		expect(screen.getByText("Visible body")).toBeInTheDocument();
	});

	it("opens on trigger click", async () => {
		render(
			<Dialog>
				<DialogTrigger>Open</DialogTrigger>
				<DialogContent>Body text</DialogContent>
			</Dialog>,
		);

		await userEvent.click(screen.getByText("Open"));
		expect(await screen.findByText("Body text")).toBeInTheDocument();
	});

	it("renders close button by default in DialogContent", () => {
		render(
			<Dialog open>
				<DialogTrigger>Open</DialogTrigger>
				<DialogContent>body</DialogContent>
			</Dialog>,
		);
		expect(screen.getByText("Close")).toBeInTheDocument();
	});

	it("hides close button when showCloseButton=false", () => {
		render(
			<Dialog open>
				<DialogTrigger>Open</DialogTrigger>
				<DialogContent showCloseButton={false}>body</DialogContent>
			</Dialog>,
		);
		expect(screen.queryByText("Close")).not.toBeInTheDocument();
	});
});

describe("DialogTitle", () => {
	it("uses data-slot='dialog-title'", () => {
		render(
			<Dialog open>
				<DialogTrigger>Open</DialogTrigger>
				<DialogContent>
					<DialogTitle>My Title</DialogTitle>
				</DialogContent>
			</Dialog>,
		);
		expect(screen.getByText("My Title")).toHaveAttribute("data-slot", "dialog-title");
	});
});

describe("DialogDescription", () => {
	it("uses data-slot='dialog-description'", () => {
		render(
			<Dialog open>
				<DialogTrigger>Open</DialogTrigger>
				<DialogContent>
					<DialogDescription>My Description</DialogDescription>
				</DialogContent>
			</Dialog>,
		);
		expect(screen.getByText("My Description")).toHaveAttribute("data-slot", "dialog-description");
	});
});

describe("DialogHeader", () => {
	it("uses data-slot='dialog-header'", () => {
		render(<DialogHeader data-testid="h">x</DialogHeader>);
		expect(screen.getByTestId("h")).toHaveAttribute("data-slot", "dialog-header");
	});
});

describe("DialogFooter", () => {
	it("uses data-slot='dialog-footer'", () => {
		render(<DialogFooter data-testid="f">x</DialogFooter>);
		expect(screen.getByTestId("f")).toHaveAttribute("data-slot", "dialog-footer");
	});

	it("renders close button when showCloseButton=true", () => {
		render(
			<Dialog open>
				<DialogTrigger>x</DialogTrigger>
				<DialogContent showCloseButton={false}>
					<DialogFooter showCloseButton>body</DialogFooter>
				</DialogContent>
			</Dialog>,
		);
		expect(screen.getByText("Close")).toBeInTheDocument();
	});

	it("does not render close button by default", () => {
		render(<DialogFooter>just content</DialogFooter>);
		expect(screen.queryByText("Close")).not.toBeInTheDocument();
	});
});
