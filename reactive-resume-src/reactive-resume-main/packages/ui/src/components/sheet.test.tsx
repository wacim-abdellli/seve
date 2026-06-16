import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";

describe("Sheet", () => {
	it("does not render content by default", () => {
		render(
			<Sheet>
				<SheetTrigger>Open</SheetTrigger>
				<SheetContent>Hidden body</SheetContent>
			</Sheet>,
		);
		expect(screen.queryByText("Hidden body")).not.toBeInTheDocument();
	});

	it("opens via defaultOpen", () => {
		render(
			<Sheet defaultOpen>
				<SheetTrigger>Open</SheetTrigger>
				<SheetContent>Visible body</SheetContent>
			</Sheet>,
		);
		expect(screen.getByText("Visible body")).toBeInTheDocument();
	});

	it("renders default 'right' side", () => {
		render(
			<Sheet open>
				<SheetTrigger>Open</SheetTrigger>
				<SheetContent>visible</SheetContent>
			</Sheet>,
		);
		const content = screen.getByText("visible");
		expect(content).toHaveAttribute("data-side", "right");
	});

	it.each(["top", "right", "bottom", "left"] as const)("supports side=%s", (side) => {
		render(
			<Sheet open>
				<SheetTrigger>x</SheetTrigger>
				<SheetContent side={side}>visible {side}</SheetContent>
			</Sheet>,
		);
		expect(screen.getByText(`visible ${side}`)).toHaveAttribute("data-side", side);
	});

	it("renders close button by default", () => {
		render(
			<Sheet open>
				<SheetTrigger>x</SheetTrigger>
				<SheetContent>x</SheetContent>
			</Sheet>,
		);
		expect(screen.getByText("Close")).toBeInTheDocument();
	});

	it("hides close button with showCloseButton=false", () => {
		render(
			<Sheet open>
				<SheetTrigger>x</SheetTrigger>
				<SheetContent showCloseButton={false}>x</SheetContent>
			</Sheet>,
		);
		expect(screen.queryByText("Close")).not.toBeInTheDocument();
	});
});

describe("SheetHeader / SheetFooter", () => {
	it("SheetHeader uses data-slot='sheet-header'", () => {
		render(<SheetHeader data-testid="h">x</SheetHeader>);
		expect(screen.getByTestId("h")).toHaveAttribute("data-slot", "sheet-header");
	});

	it("SheetFooter uses data-slot='sheet-footer'", () => {
		render(<SheetFooter data-testid="f">x</SheetFooter>);
		expect(screen.getByTestId("f")).toHaveAttribute("data-slot", "sheet-footer");
	});
});

describe("SheetTitle / SheetDescription", () => {
	it("SheetTitle uses data-slot='sheet-title'", () => {
		render(
			<Sheet open>
				<SheetTrigger>x</SheetTrigger>
				<SheetContent>
					<SheetTitle>Title</SheetTitle>
				</SheetContent>
			</Sheet>,
		);
		expect(screen.getByText("Title")).toHaveAttribute("data-slot", "sheet-title");
	});

	it("SheetDescription uses data-slot='sheet-description'", () => {
		render(
			<Sheet open>
				<SheetTrigger>x</SheetTrigger>
				<SheetContent>
					<SheetDescription>Description</SheetDescription>
				</SheetContent>
			</Sheet>,
		);
		expect(screen.getByText("Description")).toHaveAttribute("data-slot", "sheet-description");
	});
});
