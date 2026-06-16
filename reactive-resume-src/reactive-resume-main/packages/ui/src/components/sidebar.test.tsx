import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInput,
	SidebarInset,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
} from "./sidebar";

const renderInProvider = (children: React.ReactNode, props: Partial<Parameters<typeof SidebarProvider>[0]> = {}) =>
	render(
		<SidebarProvider {...props}>
			<Sidebar>{children}</Sidebar>
		</SidebarProvider>,
	);

describe("SidebarProvider", () => {
	it("renders children inside a sidebar-wrapper div", () => {
		const { container } = render(
			<SidebarProvider>
				<div data-testid="child">child</div>
			</SidebarProvider>,
		);
		expect(container.querySelector("[data-slot=sidebar-wrapper]")).toBeInTheDocument();
		expect(screen.getByTestId("child")).toBeInTheDocument();
	});

	it("merges custom className on wrapper", () => {
		const { container } = render(
			<SidebarProvider className="my-wrapper">
				<div>x</div>
			</SidebarProvider>,
		);
		expect(container.querySelector("[data-slot=sidebar-wrapper]")).toHaveClass("my-wrapper");
	});

	it("calls onOpenChange when toggled in controlled mode", async () => {
		const onOpenChange = vi.fn();
		render(
			<SidebarProvider open={true} onOpenChange={onOpenChange}>
				<Sidebar>x</Sidebar>
				<SidebarTrigger />
			</SidebarProvider>,
		);

		await userEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("toggles via Cmd/Ctrl+B keyboard shortcut", async () => {
		const onOpenChange = vi.fn();
		render(
			<SidebarProvider open={true} onOpenChange={onOpenChange}>
				<Sidebar>x</Sidebar>
			</SidebarProvider>,
		);

		await userEvent.keyboard("{Control>}b{/Control}");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});

describe("Sidebar", () => {
	it("renders with data-slot='sidebar' when collapsible='none'", () => {
		const { container } = render(
			<SidebarProvider>
				<Sidebar collapsible="none">x</Sidebar>
			</SidebarProvider>,
		);
		expect(container.querySelector("[data-slot=sidebar]")).toBeInTheDocument();
	});

	it("renders with data-state='expanded' by default", () => {
		const { container } = render(
			<SidebarProvider defaultOpen>
				<Sidebar>x</Sidebar>
			</SidebarProvider>,
		);
		// data-state is on the desktop wrapper
		const sidebar = container.querySelector("[data-slot=sidebar]");
		expect(sidebar).toHaveAttribute("data-state", "expanded");
	});

	it("renders with data-state='collapsed' when defaultOpen=false", () => {
		const { container } = render(
			<SidebarProvider defaultOpen={false}>
				<Sidebar>x</Sidebar>
			</SidebarProvider>,
		);
		const sidebar = container.querySelector("[data-slot=sidebar]");
		expect(sidebar).toHaveAttribute("data-state", "collapsed");
	});

	it.each(["sidebar", "floating", "inset"] as const)("supports variant=%s", (variant) => {
		const { container } = render(
			<SidebarProvider>
				<Sidebar variant={variant}>x</Sidebar>
			</SidebarProvider>,
		);
		const sidebar = container.querySelector("[data-slot=sidebar]");
		expect(sidebar).toHaveAttribute("data-variant", variant);
	});

	it.each(["left", "right"] as const)("supports side=%s", (side) => {
		const { container } = render(
			<SidebarProvider>
				<Sidebar side={side}>x</Sidebar>
			</SidebarProvider>,
		);
		const sidebar = container.querySelector("[data-slot=sidebar]");
		expect(sidebar).toHaveAttribute("data-side", side);
	});
});

describe("SidebarTrigger", () => {
	it("renders with sr-only label 'Toggle Sidebar'", () => {
		render(
			<SidebarProvider>
				<SidebarTrigger />
			</SidebarProvider>,
		);
		expect(screen.getByText("Toggle Sidebar")).toBeInTheDocument();
	});

	it("has data-slot='sidebar-trigger' and data-sidebar='trigger'", () => {
		render(
			<SidebarProvider>
				<SidebarTrigger data-testid="trigger" />
			</SidebarProvider>,
		);
		const trigger = screen.getByTestId("trigger");
		expect(trigger).toHaveAttribute("data-slot", "sidebar-trigger");
		expect(trigger).toHaveAttribute("data-sidebar", "trigger");
	});

	it("invokes user onClick before toggling", async () => {
		const onClick = vi.fn();
		const onOpenChange = vi.fn();
		render(
			<SidebarProvider open={true} onOpenChange={onOpenChange}>
				<SidebarTrigger onClick={onClick} />
			</SidebarProvider>,
		);

		await userEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
		expect(onClick).toHaveBeenCalled();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});

describe("SidebarRail", () => {
	it("renders with data-slot='sidebar-rail' and aria-label='Toggle Sidebar'", () => {
		render(
			<SidebarProvider>
				<SidebarRail />
			</SidebarProvider>,
		);
		const rail = screen.getByLabelText("Toggle Sidebar");
		expect(rail).toHaveAttribute("data-slot", "sidebar-rail");
	});

	it("toggles sidebar on click", async () => {
		const onOpenChange = vi.fn();
		render(
			<SidebarProvider open={true} onOpenChange={onOpenChange}>
				<SidebarRail />
			</SidebarProvider>,
		);

		await userEvent.click(screen.getByLabelText("Toggle Sidebar"));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});

describe("SidebarInset", () => {
	it("renders as <main> with data-slot='sidebar-inset'", () => {
		render(<SidebarInset data-testid="inset">x</SidebarInset>);
		const inset = screen.getByTestId("inset");
		expect(inset.tagName).toBe("MAIN");
		expect(inset).toHaveAttribute("data-slot", "sidebar-inset");
	});
});

describe("SidebarInput", () => {
	it("renders with data-slot='sidebar-input'", () => {
		render(<SidebarInput data-testid="i" />);
		expect(screen.getByTestId("i")).toHaveAttribute("data-slot", "sidebar-input");
	});
});

describe("SidebarHeader / SidebarFooter / SidebarSeparator", () => {
	it("SidebarHeader uses data-slot='sidebar-header'", () => {
		render(<SidebarHeader data-testid="h">x</SidebarHeader>);
		expect(screen.getByTestId("h")).toHaveAttribute("data-slot", "sidebar-header");
	});

	it("SidebarFooter uses data-slot='sidebar-footer'", () => {
		render(<SidebarFooter data-testid="f">x</SidebarFooter>);
		expect(screen.getByTestId("f")).toHaveAttribute("data-slot", "sidebar-footer");
	});

	it("SidebarSeparator uses data-slot='sidebar-separator'", () => {
		render(<SidebarSeparator data-testid="s" />);
		expect(screen.getByTestId("s")).toHaveAttribute("data-slot", "sidebar-separator");
	});
});

describe("SidebarContent / SidebarGroup", () => {
	it("SidebarContent uses data-slot='sidebar-content'", () => {
		render(<SidebarContent data-testid="c">x</SidebarContent>);
		expect(screen.getByTestId("c")).toHaveAttribute("data-slot", "sidebar-content");
	});

	it("SidebarGroup uses data-slot='sidebar-group'", () => {
		render(<SidebarGroup data-testid="g">x</SidebarGroup>);
		expect(screen.getByTestId("g")).toHaveAttribute("data-slot", "sidebar-group");
	});

	it("SidebarGroupContent uses data-slot='sidebar-group-content'", () => {
		render(<SidebarGroupContent data-testid="g">x</SidebarGroupContent>);
		expect(screen.getByTestId("g")).toHaveAttribute("data-slot", "sidebar-group-content");
	});

	it("SidebarGroupLabel uses data-slot='sidebar-group-label'", () => {
		render(<SidebarGroupLabel data-testid="l">Group</SidebarGroupLabel>);
		expect(screen.getByTestId("l")).toHaveAttribute("data-slot", "sidebar-group-label");
	});

	it("SidebarGroupAction uses data-slot='sidebar-group-action'", () => {
		render(<SidebarGroupAction data-testid="a">+</SidebarGroupAction>);
		expect(screen.getByTestId("a")).toHaveAttribute("data-slot", "sidebar-group-action");
	});
});

describe("SidebarMenu and items", () => {
	it("SidebarMenu uses data-slot='sidebar-menu' and renders as <ul>", () => {
		render(<SidebarMenu data-testid="m" />);
		const menu = screen.getByTestId("m");
		expect(menu.tagName).toBe("UL");
		expect(menu).toHaveAttribute("data-slot", "sidebar-menu");
	});

	it("SidebarMenuItem uses data-slot='sidebar-menu-item' and renders as <li>", () => {
		render(<SidebarMenuItem data-testid="i">x</SidebarMenuItem>);
		const item = screen.getByTestId("i");
		expect(item.tagName).toBe("LI");
		expect(item).toHaveAttribute("data-slot", "sidebar-menu-item");
	});

	it("SidebarMenuButton uses data-slot='sidebar-menu-button'", () => {
		render(
			<SidebarProvider>
				<SidebarMenuButton data-testid="b">Click</SidebarMenuButton>
			</SidebarProvider>,
		);
		expect(screen.getByTestId("b")).toHaveAttribute("data-slot", "sidebar-menu-button");
	});

	it("SidebarMenuButton supports isActive", () => {
		render(
			<SidebarProvider>
				<SidebarMenuButton data-testid="b" isActive>
					x
				</SidebarMenuButton>
			</SidebarProvider>,
		);
		// data-active is set as a presence attribute when isActive is truthy
		expect(screen.getByTestId("b")).toHaveAttribute("data-active");
	});

	it("SidebarMenuAction uses data-slot='sidebar-menu-action'", () => {
		render(<SidebarMenuAction data-testid="a">x</SidebarMenuAction>);
		expect(screen.getByTestId("a")).toHaveAttribute("data-slot", "sidebar-menu-action");
	});

	it("SidebarMenuBadge uses data-slot='sidebar-menu-badge'", () => {
		render(<SidebarMenuBadge data-testid="b">5</SidebarMenuBadge>);
		expect(screen.getByTestId("b")).toHaveAttribute("data-slot", "sidebar-menu-badge");
	});

	it("SidebarMenuSkeleton renders without throwing", () => {
		render(<SidebarMenuSkeleton data-testid="sk" />);
		expect(screen.getByTestId("sk")).toBeInTheDocument();
	});

	it("SidebarMenuSkeleton supports showIcon", () => {
		const { container } = render(<SidebarMenuSkeleton showIcon />);
		// Should render the icon Skeleton
		expect(container.querySelectorAll("[data-slot=skeleton]").length).toBeGreaterThan(1);
	});
});

describe("SidebarMenuSub family", () => {
	it("SidebarMenuSub uses data-slot='sidebar-menu-sub' and is <ul>", () => {
		render(<SidebarMenuSub data-testid="ms" />);
		const ms = screen.getByTestId("ms");
		expect(ms.tagName).toBe("UL");
		expect(ms).toHaveAttribute("data-slot", "sidebar-menu-sub");
	});

	it("SidebarMenuSubItem uses data-slot='sidebar-menu-sub-item' and is <li>", () => {
		render(<SidebarMenuSubItem data-testid="ms">x</SidebarMenuSubItem>);
		const ms = screen.getByTestId("ms");
		expect(ms.tagName).toBe("LI");
		expect(ms).toHaveAttribute("data-slot", "sidebar-menu-sub-item");
	});

	it("SidebarMenuSubButton uses data-slot='sidebar-menu-sub-button'", () => {
		render(<SidebarMenuSubButton data-testid="b">x</SidebarMenuSubButton>);
		expect(screen.getByTestId("b")).toHaveAttribute("data-slot", "sidebar-menu-sub-button");
	});
});

describe("Sidebar composition", () => {
	it("composes a complete sidebar without errors", () => {
		expect(() =>
			renderInProvider(
				<>
					<SidebarHeader>Header</SidebarHeader>
					<SidebarSeparator />
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>Group 1</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton>Item</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
					<SidebarFooter>Footer</SidebarFooter>
				</>,
			),
		).not.toThrow();
	});
});
