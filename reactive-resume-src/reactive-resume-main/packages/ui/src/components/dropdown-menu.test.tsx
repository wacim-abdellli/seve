import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "./dropdown-menu";

describe("DropdownMenu", () => {
	it("trigger has data-slot='dropdown-menu-trigger'", () => {
		render(
			<DropdownMenu>
				<DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
				<DropdownMenuContent>x</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "dropdown-menu-trigger");
	});

	it("does not render content by default", () => {
		render(
			<DropdownMenu>
				<DropdownMenuTrigger>Open</DropdownMenuTrigger>
				<DropdownMenuContent>Hidden item</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(screen.queryByText("Hidden item")).not.toBeInTheDocument();
	});

	it("renders content when controlled open", () => {
		render(
			<DropdownMenu open>
				<DropdownMenuTrigger>Open</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem>Item 1</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(screen.getByText("Item 1")).toBeInTheDocument();
	});
});

describe("DropdownMenuItem", () => {
	it("uses data-slot='dropdown-menu-item'", () => {
		render(
			<DropdownMenu open>
				<DropdownMenuTrigger>x</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem>Item</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(screen.getByText("Item")).toHaveAttribute("data-slot", "dropdown-menu-item");
	});

	it("defaults variant='default'", () => {
		render(
			<DropdownMenu open>
				<DropdownMenuTrigger>x</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem>Item</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(screen.getByText("Item")).toHaveAttribute("data-variant", "default");
	});

	it("supports variant='destructive'", () => {
		render(
			<DropdownMenu open>
				<DropdownMenuTrigger>x</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(screen.getByText("Delete")).toHaveAttribute("data-variant", "destructive");
	});

	it("supports inset prop", () => {
		render(
			<DropdownMenu open>
				<DropdownMenuTrigger>x</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem inset>Inset</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(screen.getByText("Inset")).toHaveAttribute("data-inset", "true");
	});
});

describe("DropdownMenuLabel", () => {
	it("uses data-slot='dropdown-menu-label'", () => {
		render(
			<DropdownMenu open>
				<DropdownMenuTrigger>x</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuGroup>
						<DropdownMenuLabel>Group label</DropdownMenuLabel>
						<DropdownMenuItem>Item</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(screen.getByText("Group label")).toHaveAttribute("data-slot", "dropdown-menu-label");
	});
});

describe("DropdownMenuSeparator", () => {
	it("uses data-slot='dropdown-menu-separator'", () => {
		render(
			<DropdownMenu open>
				<DropdownMenuTrigger>x</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem>1</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem>2</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>,
		);
		// Portal content renders at document.body
		expect(document.querySelector("[data-slot=dropdown-menu-separator]")).toBeInTheDocument();
	});
});

describe("DropdownMenuShortcut", () => {
	it("uses data-slot='dropdown-menu-shortcut'", () => {
		render(<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>);
		expect(screen.getByText("⌘K")).toHaveAttribute("data-slot", "dropdown-menu-shortcut");
	});

	it("merges custom className", () => {
		render(<DropdownMenuShortcut className="my-class">x</DropdownMenuShortcut>);
		expect(screen.getByText("x")).toHaveClass("my-class");
	});
});

describe("DropdownMenuCheckboxItem", () => {
	it("uses data-slot='dropdown-menu-checkbox-item'", () => {
		render(
			<DropdownMenu open>
				<DropdownMenuTrigger>x</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuCheckboxItem checked>Toggle</DropdownMenuCheckboxItem>
				</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(screen.getByText("Toggle")).toHaveAttribute("data-slot", "dropdown-menu-checkbox-item");
	});
});

describe("DropdownMenuRadioItem", () => {
	it("uses data-slot='dropdown-menu-radio-item'", () => {
		render(
			<DropdownMenu open>
				<DropdownMenuTrigger>x</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup value="a">
						<DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(screen.getByText("A")).toHaveAttribute("data-slot", "dropdown-menu-radio-item");
	});
});

describe("DropdownMenuSub", () => {
	it("renders nested submenu trigger", () => {
		render(
			<DropdownMenu open>
				<DropdownMenuTrigger>x</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuItem>Inner</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(screen.getByText("More")).toHaveAttribute("data-slot", "dropdown-menu-sub-trigger");
	});
});
