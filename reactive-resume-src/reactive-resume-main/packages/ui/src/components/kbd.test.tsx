import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Kbd, KbdGroup } from "./kbd";

describe("Kbd", () => {
	it("renders as a <kbd> element with data-slot='kbd'", () => {
		render(<Kbd data-testid="k">Ctrl</Kbd>);
		const k = screen.getByTestId("k");
		expect(k.tagName).toBe("KBD");
		expect(k).toHaveAttribute("data-slot", "kbd");
	});

	it("renders the key text", () => {
		render(<Kbd>⌘ K</Kbd>);
		expect(screen.getByText("⌘ K")).toBeInTheDocument();
	});

	it("merges custom className", () => {
		render(
			<Kbd data-testid="k" className="my-class">
				x
			</Kbd>,
		);
		expect(screen.getByTestId("k")).toHaveClass("my-class");
	});
});

describe("KbdGroup", () => {
	it("renders as a <kbd> wrapper with data-slot='kbd-group'", () => {
		render(<KbdGroup data-testid="g">x</KbdGroup>);
		const g = screen.getByTestId("g");
		expect(g.tagName).toBe("KBD");
		expect(g).toHaveAttribute("data-slot", "kbd-group");
	});

	it("groups multiple Kbd elements", () => {
		render(
			<KbdGroup>
				<Kbd>Ctrl</Kbd>
				<Kbd>K</Kbd>
			</KbdGroup>,
		);
		expect(screen.getByText("Ctrl")).toBeInTheDocument();
		expect(screen.getByText("K")).toBeInTheDocument();
	});

	it("merges custom className", () => {
		render(
			<KbdGroup data-testid="g" className="my-group">
				x
			</KbdGroup>,
		);
		expect(screen.getByTestId("g")).toHaveClass("my-group");
	});
});
