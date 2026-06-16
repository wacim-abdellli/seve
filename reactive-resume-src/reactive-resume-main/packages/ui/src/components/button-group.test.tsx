import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "./button-group";

describe("ButtonGroup", () => {
	it("renders a fieldset with data-slot='button-group'", () => {
		render(<ButtonGroup data-testid="g" />);
		const g = screen.getByTestId("g");
		expect(g.tagName).toBe("FIELDSET");
		expect(g).toHaveAttribute("data-slot", "button-group");
	});

	it("respects horizontal orientation (default)", () => {
		render(<ButtonGroup data-testid="g" orientation="horizontal" />);
		expect(screen.getByTestId("g")).toHaveAttribute("data-orientation", "horizontal");
	});

	it("respects vertical orientation", () => {
		render(<ButtonGroup data-testid="g" orientation="vertical" />);
		expect(screen.getByTestId("g")).toHaveAttribute("data-orientation", "vertical");
	});

	it("merges custom className", () => {
		render(<ButtonGroup data-testid="g" className="my-custom" />);
		expect(screen.getByTestId("g")).toHaveClass("my-custom");
	});
});

describe("ButtonGroupText", () => {
	it("renders content inside a div by default", () => {
		render(<ButtonGroupText>Hello</ButtonGroupText>);
		expect(screen.getByText("Hello").tagName).toBe("DIV");
	});

	it("merges custom className", () => {
		render(<ButtonGroupText className="my-class">x</ButtonGroupText>);
		expect(screen.getByText("x")).toHaveClass("my-class");
	});

	it("supports custom render function", () => {
		render(<ButtonGroupText render={(props) => <span {...props} />}>label</ButtonGroupText>);
		expect(screen.getByText("label").tagName).toBe("SPAN");
	});
});

describe("ButtonGroupSeparator", () => {
	it("defaults to vertical orientation", () => {
		render(<ButtonGroupSeparator data-testid="sep" />);
		expect(screen.getByTestId("sep")).toHaveAttribute("data-orientation", "vertical");
	});

	it("supports horizontal orientation", () => {
		render(<ButtonGroupSeparator data-testid="sep" orientation="horizontal" />);
		expect(screen.getByTestId("sep")).toHaveAttribute("data-orientation", "horizontal");
	});

	it("uses data-slot='button-group-separator'", () => {
		render(<ButtonGroupSeparator data-testid="sep" />);
		expect(screen.getByTestId("sep")).toHaveAttribute("data-slot", "button-group-separator");
	});
});
