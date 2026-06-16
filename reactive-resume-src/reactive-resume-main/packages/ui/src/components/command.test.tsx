import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "./command";

describe("Command", () => {
	it("renders with data-slot='command'", () => {
		const { container } = render(
			<Command>
				<CommandList>
					<CommandItem>x</CommandItem>
				</CommandList>
			</Command>,
		);
		expect(container.querySelector("[data-slot=command]")).toBeInTheDocument();
	});

	it("merges custom className on root", () => {
		const { container } = render(
			<Command className="my-cmd">
				<CommandList />
			</Command>,
		);
		expect(container.querySelector("[data-slot=command]")).toHaveClass("my-cmd");
	});
});

describe("CommandInput", () => {
	it("renders with data-slot='command-input'", () => {
		const { container } = render(
			<Command>
				<CommandInput placeholder="Search..." />
			</Command>,
		);
		expect(container.querySelector("[data-slot=command-input]")).toBeInTheDocument();
	});

	it("wrapper uses data-slot='command-input-wrapper'", () => {
		const { container } = render(
			<Command>
				<CommandInput />
			</Command>,
		);
		expect(container.querySelector("[data-slot=command-input-wrapper]")).toBeInTheDocument();
	});
});

describe("CommandList / CommandGroup", () => {
	it("CommandList uses data-slot='command-list'", () => {
		const { container } = render(
			<Command>
				<CommandList>x</CommandList>
			</Command>,
		);
		expect(container.querySelector("[data-slot=command-list]")).toBeInTheDocument();
	});

	it("CommandEmpty renders without throwing in tree", () => {
		// CommandEmpty only mounts under specific cmdk states — just verify no crash
		expect(() =>
			render(
				<Command>
					<CommandList>
						<CommandEmpty>No results</CommandEmpty>
					</CommandList>
				</Command>,
			),
		).not.toThrow();
	});

	it("CommandGroup uses data-slot='command-group'", () => {
		const { container } = render(
			<Command>
				<CommandList>
					<CommandGroup heading="Group 1">
						<CommandItem>Item</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>,
		);
		expect(container.querySelector("[data-slot=command-group]")).toBeInTheDocument();
	});
});

describe("CommandItem", () => {
	it("uses data-slot='command-item'", () => {
		const { container } = render(
			<Command>
				<CommandList>
					<CommandItem>Hello</CommandItem>
				</CommandList>
			</Command>,
		);
		expect(container.querySelector("[data-slot=command-item]")).toBeInTheDocument();
	});
});

describe("CommandSeparator", () => {
	it("uses data-slot='command-separator'", () => {
		const { container } = render(
			<Command>
				<CommandList>
					<CommandSeparator />
				</CommandList>
			</Command>,
		);
		expect(container.querySelector("[data-slot=command-separator]")).toBeInTheDocument();
	});
});

describe("CommandShortcut", () => {
	it("uses data-slot='command-shortcut'", () => {
		render(<CommandShortcut>⌘K</CommandShortcut>);
		expect(screen.getByText("⌘K")).toHaveAttribute("data-slot", "command-shortcut");
	});

	it("merges custom className", () => {
		render(<CommandShortcut className="my-class">x</CommandShortcut>);
		expect(screen.getByText("x")).toHaveClass("my-class");
	});
});
