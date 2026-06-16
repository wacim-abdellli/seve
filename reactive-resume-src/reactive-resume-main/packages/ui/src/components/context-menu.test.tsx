import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "./context-menu";

const renderWithMenu = (children: React.ReactNode) =>
	render(
		<ContextMenu open>
			<ContextMenuTrigger>x</ContextMenuTrigger>
			<ContextMenuContent>{children}</ContextMenuContent>
		</ContextMenu>,
	);

describe("ContextMenu", () => {
	it("trigger uses data-slot='context-menu-trigger'", () => {
		render(
			<ContextMenu>
				<ContextMenuTrigger data-testid="trigger">Right-click me</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem>x</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>,
		);
		expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "context-menu-trigger");
	});

	it("does not render content by default", () => {
		render(
			<ContextMenu>
				<ContextMenuTrigger>x</ContextMenuTrigger>
				<ContextMenuContent>Hidden</ContextMenuContent>
			</ContextMenu>,
		);
		expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
	});
});

describe("ContextMenuItem", () => {
	it("uses data-slot='context-menu-item'", () => {
		renderWithMenu(<ContextMenuItem>Item</ContextMenuItem>);
		expect(screen.getByText("Item")).toHaveAttribute("data-slot", "context-menu-item");
	});

	it("defaults variant='default'", () => {
		renderWithMenu(<ContextMenuItem>Item</ContextMenuItem>);
		expect(screen.getByText("Item")).toHaveAttribute("data-variant", "default");
	});

	it("supports variant='destructive'", () => {
		renderWithMenu(<ContextMenuItem variant="destructive">Delete</ContextMenuItem>);
		expect(screen.getByText("Delete")).toHaveAttribute("data-variant", "destructive");
	});

	it("supports inset prop", () => {
		renderWithMenu(<ContextMenuItem inset>Inset</ContextMenuItem>);
		expect(screen.getByText("Inset")).toHaveAttribute("data-inset", "true");
	});
});

describe("ContextMenuLabel", () => {
	it("uses data-slot='context-menu-label'", () => {
		renderWithMenu(
			<ContextMenuGroup>
				<ContextMenuLabel>Group label</ContextMenuLabel>
			</ContextMenuGroup>,
		);
		expect(screen.getByText("Group label")).toHaveAttribute("data-slot", "context-menu-label");
	});

	it("supports inset prop", () => {
		renderWithMenu(
			<ContextMenuGroup>
				<ContextMenuLabel inset>Inset label</ContextMenuLabel>
			</ContextMenuGroup>,
		);
		expect(screen.getByText("Inset label")).toHaveAttribute("data-inset", "true");
	});
});

describe("ContextMenuShortcut", () => {
	it("uses data-slot='context-menu-shortcut'", () => {
		render(<ContextMenuShortcut>⌘K</ContextMenuShortcut>);
		expect(screen.getByText("⌘K")).toHaveAttribute("data-slot", "context-menu-shortcut");
	});

	it("merges custom className", () => {
		render(<ContextMenuShortcut className="my-class">x</ContextMenuShortcut>);
		expect(screen.getByText("x")).toHaveClass("my-class");
	});
});

describe("ContextMenuCheckboxItem and ContextMenuRadioItem", () => {
	it("CheckboxItem renders within menu", () => {
		renderWithMenu(<ContextMenuCheckboxItem checked>Toggle</ContextMenuCheckboxItem>);
		expect(screen.getByText("Toggle")).toHaveAttribute("data-slot", "context-menu-checkbox-item");
	});

	it("RadioItem renders within menu", () => {
		renderWithMenu(
			<ContextMenuRadioGroup value="a">
				<ContextMenuRadioItem value="a">A</ContextMenuRadioItem>
			</ContextMenuRadioGroup>,
		);
		expect(screen.getByText("A")).toHaveAttribute("data-slot", "context-menu-radio-item");
	});
});

describe("ContextMenuSub", () => {
	it("SubTrigger uses data-slot='context-menu-sub-trigger'", () => {
		renderWithMenu(
			<ContextMenuSub>
				<ContextMenuSubTrigger>More</ContextMenuSubTrigger>
				<ContextMenuSubContent>
					<ContextMenuItem>Inner</ContextMenuItem>
				</ContextMenuSubContent>
			</ContextMenuSub>,
		);
		expect(screen.getByText("More")).toHaveAttribute("data-slot", "context-menu-sub-trigger");
	});
});
