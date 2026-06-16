import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResizableGroup, ResizablePanel, ResizableSeparator } from "./resizable";

describe("ResizableGroup", () => {
	it("renders with data-slot='resizable-panel-group'", () => {
		const { container } = render(
			<ResizableGroup orientation="horizontal">
				<ResizablePanel>A</ResizablePanel>
				<ResizableSeparator />
				<ResizablePanel>B</ResizablePanel>
			</ResizableGroup>,
		);
		expect(container.querySelector("[data-slot=resizable-panel-group]")).toBeInTheDocument();
	});

	it("merges custom className", () => {
		const { container } = render(
			<ResizableGroup orientation="horizontal" className="my-group">
				<ResizablePanel>x</ResizablePanel>
			</ResizableGroup>,
		);
		expect(container.querySelector("[data-slot=resizable-panel-group]")).toHaveClass("my-group");
	});
});

describe("ResizablePanel", () => {
	it("renders with data-slot='resizable-panel'", () => {
		const { container } = render(
			<ResizableGroup orientation="horizontal">
				<ResizablePanel>x</ResizablePanel>
			</ResizableGroup>,
		);
		expect(container.querySelector("[data-slot=resizable-panel]")).toBeInTheDocument();
	});
});

describe("ResizableSeparator", () => {
	it("renders with data-slot='resizable-handle' and no inner handle by default", () => {
		const { container } = render(
			<ResizableGroup orientation="horizontal">
				<ResizablePanel>A</ResizablePanel>
				<ResizableSeparator />
				<ResizablePanel>B</ResizablePanel>
			</ResizableGroup>,
		);
		const handle = container.querySelector("[data-slot=resizable-handle]");
		expect(handle).toBeInTheDocument();
		// No inner handle div by default
		expect(handle?.children).toHaveLength(0);
	});

	it("renders inner handle when withHandle=true", () => {
		const { container } = render(
			<ResizableGroup orientation="horizontal">
				<ResizablePanel>A</ResizablePanel>
				<ResizableSeparator withHandle />
				<ResizablePanel>B</ResizablePanel>
			</ResizableGroup>,
		);
		const handle = container.querySelector("[data-slot=resizable-handle]");
		expect(handle?.children.length).toBeGreaterThan(0);
	});
});
