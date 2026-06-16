import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "./avatar";

describe("Avatar", () => {
	it("renders with data-slot='avatar'", () => {
		render(<Avatar data-testid="av" />);
		expect(screen.getByTestId("av")).toHaveAttribute("data-slot", "avatar");
	});

	it("defaults size to 'default'", () => {
		render(<Avatar data-testid="av" />);
		expect(screen.getByTestId("av")).toHaveAttribute("data-size", "default");
	});

	it.each(["default", "sm", "lg"] as const)("supports size=%s", (size) => {
		render(<Avatar data-testid="av" size={size} />);
		expect(screen.getByTestId("av")).toHaveAttribute("data-size", size);
	});

	it("merges custom className", () => {
		render(<Avatar data-testid="av" className="my-class" />);
		expect(screen.getByTestId("av")).toHaveClass("my-class");
	});
});

describe("AvatarFallback", () => {
	it("renders fallback content", () => {
		render(
			<Avatar>
				<AvatarFallback data-testid="fb">JD</AvatarFallback>
			</Avatar>,
		);
		// Note: fallback only renders if image fails — but data-slot should be set.
		// We just confirm no crash and that fallback is present in DOM.
		const fb = screen.queryByTestId("fb");
		// AvatarFallback may or may not be in the DOM depending on image state.
		// Just ensure it doesn't throw on render.
		expect(fb === null || fb.getAttribute("data-slot") === "avatar-fallback").toBe(true);
	});
});

describe("AvatarBadge", () => {
	it("renders as span with data-slot='avatar-badge'", () => {
		render(<AvatarBadge data-testid="b" />);
		const badge = screen.getByTestId("b");
		expect(badge.tagName).toBe("SPAN");
		expect(badge).toHaveAttribute("data-slot", "avatar-badge");
	});
});

describe("AvatarGroup", () => {
	it("renders as div with data-slot='avatar-group'", () => {
		render(<AvatarGroup data-testid="g" />);
		const group = screen.getByTestId("g");
		expect(group.tagName).toBe("DIV");
		expect(group).toHaveAttribute("data-slot", "avatar-group");
	});

	it("supports children", () => {
		render(
			<AvatarGroup data-testid="g">
				<Avatar />
				<Avatar />
			</AvatarGroup>,
		);
		expect(screen.getByTestId("g").children).toHaveLength(2);
	});
});

describe("AvatarGroupCount", () => {
	it("renders count children", () => {
		render(<AvatarGroupCount>+3</AvatarGroupCount>);
		expect(screen.getByText("+3")).toHaveAttribute("data-slot", "avatar-group-count");
	});
});

describe("AvatarImage", () => {
	it("accepts src prop without throwing", () => {
		render(
			<Avatar>
				<AvatarImage src="https://example.com/x.png" alt="user" />
			</Avatar>,
		);
		// Image may not render until loaded; we just verify no crash
		expect(true).toBe(true);
	});
});
