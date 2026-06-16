import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./alert-dialog";

describe("AlertDialog", () => {
	it("does not render content by default", () => {
		render(
			<AlertDialog>
				<AlertDialogTrigger>Open</AlertDialogTrigger>
				<AlertDialogContent>Hidden body</AlertDialogContent>
			</AlertDialog>,
		);
		expect(screen.queryByText("Hidden body")).not.toBeInTheDocument();
	});

	it("opens via defaultOpen", () => {
		render(
			<AlertDialog defaultOpen>
				<AlertDialogTrigger>Open</AlertDialogTrigger>
				<AlertDialogContent>Visible body</AlertDialogContent>
			</AlertDialog>,
		);
		expect(screen.getByText("Visible body")).toBeInTheDocument();
	});

	it("trigger has data-slot='alert-dialog-trigger'", () => {
		render(
			<AlertDialog>
				<AlertDialogTrigger data-testid="trigger">Open</AlertDialogTrigger>
				<AlertDialogContent>x</AlertDialogContent>
			</AlertDialog>,
		);
		expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "alert-dialog-trigger");
	});

	it("content uses size 'default' by default", () => {
		render(
			<AlertDialog open>
				<AlertDialogTrigger>x</AlertDialogTrigger>
				<AlertDialogContent>visible</AlertDialogContent>
			</AlertDialog>,
		);
		expect(screen.getByText("visible")).toHaveAttribute("data-size", "default");
	});

	it("content supports size='sm'", () => {
		render(
			<AlertDialog open>
				<AlertDialogTrigger>x</AlertDialogTrigger>
				<AlertDialogContent size="sm">visible</AlertDialogContent>
			</AlertDialog>,
		);
		expect(screen.getByText("visible")).toHaveAttribute("data-size", "sm");
	});
});

describe("AlertDialog subcomponents", () => {
	it("AlertDialogHeader uses data-slot='alert-dialog-header'", () => {
		render(<AlertDialogHeader data-testid="h">x</AlertDialogHeader>);
		expect(screen.getByTestId("h")).toHaveAttribute("data-slot", "alert-dialog-header");
	});

	it("AlertDialogFooter uses data-slot='alert-dialog-footer'", () => {
		render(<AlertDialogFooter data-testid="f">x</AlertDialogFooter>);
		expect(screen.getByTestId("f")).toHaveAttribute("data-slot", "alert-dialog-footer");
	});

	it("AlertDialogMedia uses data-slot='alert-dialog-media'", () => {
		render(<AlertDialogMedia data-testid="m">x</AlertDialogMedia>);
		expect(screen.getByTestId("m")).toHaveAttribute("data-slot", "alert-dialog-media");
	});

	it("AlertDialogTitle uses data-slot='alert-dialog-title'", () => {
		render(
			<AlertDialog open>
				<AlertDialogTrigger>x</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogTitle>Are you sure?</AlertDialogTitle>
				</AlertDialogContent>
			</AlertDialog>,
		);
		expect(screen.getByText("Are you sure?")).toHaveAttribute("data-slot", "alert-dialog-title");
	});

	it("AlertDialogDescription uses data-slot='alert-dialog-description'", () => {
		render(
			<AlertDialog open>
				<AlertDialogTrigger>x</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogDescription>This is permanent</AlertDialogDescription>
				</AlertDialogContent>
			</AlertDialog>,
		);
		expect(screen.getByText("This is permanent")).toHaveAttribute("data-slot", "alert-dialog-description");
	});

	it("AlertDialogAction renders a Button with data-slot='alert-dialog-action'", () => {
		render(<AlertDialogAction>Confirm</AlertDialogAction>);
		const button = screen.getByText("Confirm");
		expect(button).toHaveAttribute("data-slot", "alert-dialog-action");
	});

	it("AlertDialogCancel uses data-slot='alert-dialog-cancel'", () => {
		render(
			<AlertDialog open>
				<AlertDialogTrigger>x</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
				</AlertDialogContent>
			</AlertDialog>,
		);
		const button = screen.getByText("Cancel");
		expect(button).toHaveAttribute("data-slot", "alert-dialog-cancel");
	});
});
