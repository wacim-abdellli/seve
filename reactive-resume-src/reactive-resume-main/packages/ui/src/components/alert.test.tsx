import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
	it("renders children with role='alert'", () => {
		render(<Alert>Heads up!</Alert>);
		expect(screen.getByRole("alert")).toHaveTextContent("Heads up!");
	});

	it("applies data-slot='alert' for slotting", () => {
		render(<Alert>x</Alert>);
		expect(screen.getByRole("alert")).toHaveAttribute("data-slot", "alert");
	});

	it("merges custom className", () => {
		render(<Alert className="my-class">x</Alert>);
		expect(screen.getByRole("alert")).toHaveClass("my-class");
	});

	it("supports destructive variant", () => {
		render(<Alert variant="destructive">x</Alert>);
		// We just verify the component renders without error
		expect(screen.getByRole("alert")).toBeInTheDocument();
	});
});

describe("AlertTitle", () => {
	it("renders children", () => {
		render(<AlertTitle>Title</AlertTitle>);
		expect(screen.getByText("Title")).toBeInTheDocument();
	});

	it("applies data-slot='alert-title'", () => {
		render(<AlertTitle>x</AlertTitle>);
		expect(screen.getByText("x")).toHaveAttribute("data-slot", "alert-title");
	});
});

describe("AlertDescription", () => {
	it("renders children", () => {
		render(<AlertDescription>Description text</AlertDescription>);
		expect(screen.getByText("Description text")).toBeInTheDocument();
	});

	it("applies data-slot='alert-description'", () => {
		render(<AlertDescription>x</AlertDescription>);
		expect(screen.getByText("x")).toHaveAttribute("data-slot", "alert-description");
	});
});

describe("AlertAction", () => {
	it("renders children", () => {
		render(<AlertAction>Action</AlertAction>);
		expect(screen.getByText("Action")).toBeInTheDocument();
	});

	it("applies data-slot='alert-action'", () => {
		render(<AlertAction>x</AlertAction>);
		expect(screen.getByText("x")).toHaveAttribute("data-slot", "alert-action");
	});
});

describe("Alert composition", () => {
	it("composes all subcomponents", () => {
		render(
			<Alert>
				<AlertTitle>Title</AlertTitle>
				<AlertDescription>Body</AlertDescription>
				<AlertAction>OK</AlertAction>
			</Alert>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent(/TitleBodyOK/);
	});
});
