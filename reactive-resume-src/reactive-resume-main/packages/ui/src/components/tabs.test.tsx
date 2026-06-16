import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const renderTabs = (props: Partial<Parameters<typeof Tabs>[0]> = {}) => {
	return render(
		<Tabs defaultValue="a" {...props}>
			<TabsList>
				<TabsTrigger value="a">Tab A</TabsTrigger>
				<TabsTrigger value="b">Tab B</TabsTrigger>
			</TabsList>
			<TabsContent value="a">Content A</TabsContent>
			<TabsContent value="b">Content B</TabsContent>
		</Tabs>,
	);
};

describe("Tabs", () => {
	it("uses data-slot='tabs'", () => {
		const { container } = renderTabs();
		expect(container.querySelector("[data-slot=tabs]")).toBeInTheDocument();
	});

	it("defaults orientation to 'horizontal'", () => {
		const { container } = renderTabs();
		expect(container.querySelector("[data-slot=tabs]")).toHaveAttribute("data-orientation", "horizontal");
	});

	it("supports vertical orientation", () => {
		const { container } = renderTabs({ orientation: "vertical" });
		expect(container.querySelector("[data-slot=tabs]")).toHaveAttribute("data-orientation", "vertical");
	});

	it("renders the default selected tab content", () => {
		renderTabs();
		expect(screen.getByText("Content A")).toBeInTheDocument();
	});

	it("switches to the other tab on click", async () => {
		renderTabs();
		await userEvent.click(screen.getByText("Tab B"));
		expect(screen.getByText("Content B")).toBeInTheDocument();
	});

	it("merges custom className on root", () => {
		const { container } = render(
			<Tabs defaultValue="a" className="my-tabs">
				<TabsList>
					<TabsTrigger value="a">A</TabsTrigger>
				</TabsList>
				<TabsContent value="a">x</TabsContent>
			</Tabs>,
		);
		expect(container.querySelector("[data-slot=tabs]")).toHaveClass("my-tabs");
	});
});

describe("TabsList", () => {
	it("uses data-slot='tabs-list'", () => {
		const { container } = renderTabs();
		expect(container.querySelector("[data-slot=tabs-list]")).toBeInTheDocument();
	});

	it("defaults variant to 'default'", () => {
		const { container } = renderTabs();
		expect(container.querySelector("[data-slot=tabs-list]")).toHaveAttribute("data-variant", "default");
	});

	it("supports variant='line'", () => {
		const { container } = render(
			<Tabs defaultValue="a">
				<TabsList variant="line">
					<TabsTrigger value="a">A</TabsTrigger>
				</TabsList>
				<TabsContent value="a">x</TabsContent>
			</Tabs>,
		);
		expect(container.querySelector("[data-slot=tabs-list]")).toHaveAttribute("data-variant", "line");
	});
});

describe("TabsTrigger", () => {
	it("uses data-slot='tabs-trigger'", () => {
		const { container } = renderTabs();
		expect(container.querySelector("[data-slot=tabs-trigger]")).toBeInTheDocument();
	});
});

describe("TabsContent", () => {
	it("uses data-slot='tabs-content'", () => {
		const { container } = renderTabs();
		expect(container.querySelector("[data-slot=tabs-content]")).toBeInTheDocument();
	});
});
