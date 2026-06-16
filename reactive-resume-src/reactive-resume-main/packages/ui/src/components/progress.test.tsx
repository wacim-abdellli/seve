import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue } from "./progress";

describe("Progress", () => {
	it("renders with data-slot='progress'", () => {
		render(<Progress data-testid="p" value={50} />);
		expect(screen.getByTestId("p")).toHaveAttribute("data-slot", "progress");
	});

	it("auto-renders track and indicator children", () => {
		const { container } = render(<Progress value={50} data-testid="p" />);
		expect(container.querySelector("[data-slot=progress-track]")).toBeInTheDocument();
		expect(container.querySelector("[data-slot=progress-indicator]")).toBeInTheDocument();
	});

	it("forwards value attribute via aria-valuenow", () => {
		render(<Progress data-testid="p" value={75} />);
		expect(screen.getByTestId("p")).toHaveAttribute("aria-valuenow", "75");
	});

	it("supports custom children rendered before the track", () => {
		render(
			<Progress data-testid="p" value={50}>
				<ProgressLabel>My Progress</ProgressLabel>
			</Progress>,
		);
		expect(screen.getByText("My Progress")).toBeInTheDocument();
	});
});

describe("ProgressLabel", () => {
	it("renders with data-slot='progress-label'", () => {
		render(
			<Progress value={50}>
				<ProgressLabel>Label</ProgressLabel>
			</Progress>,
		);
		expect(screen.getByText("Label")).toHaveAttribute("data-slot", "progress-label");
	});
});

describe("ProgressValue", () => {
	it("renders with data-slot='progress-value'", () => {
		render(
			<Progress value={50}>
				<ProgressValue />
			</Progress>,
		);
		// The value text is rendered by base-ui — just verify the slot exists
		const { container } = render(
			<Progress value={50}>
				<ProgressValue data-testid="v" />
			</Progress>,
		);
		expect(container.querySelector("[data-slot=progress-value]")).toBeInTheDocument();
	});
});

describe("ProgressTrack and ProgressIndicator", () => {
	it("can be rendered explicitly with custom classes", () => {
		const { container } = render(
			<Progress value={25}>
				<ProgressTrack className="track-custom">
					<ProgressIndicator className="ind-custom" />
				</ProgressTrack>
			</Progress>,
		);
		expect(container.querySelectorAll("[data-slot=progress-track]")).toHaveLength(2);
	});
});
