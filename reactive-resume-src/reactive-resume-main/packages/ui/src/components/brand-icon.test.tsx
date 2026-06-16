import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandIcon } from "./brand-icon";

describe("BrandIcon", () => {
	it("renders two img elements (light + dark variants)", () => {
		render(<BrandIcon />);
		const imgs = screen.getAllByAltText("Reactive Resume");
		expect(imgs).toHaveLength(2);
	});

	it("uses 'logo' as default variant", () => {
		render(<BrandIcon />);
		const imgs = screen.getAllByAltText("Reactive Resume");
		expect(imgs.some((img) => img.getAttribute("src") === "/logo/dark.svg")).toBe(true);
		expect(imgs.some((img) => img.getAttribute("src") === "/logo/light.svg")).toBe(true);
	});

	it("uses 'icon' variant when specified", () => {
		render(<BrandIcon variant="icon" />);
		const imgs = screen.getAllByAltText("Reactive Resume");
		expect(imgs.some((img) => img.getAttribute("src") === "/icon/dark.svg")).toBe(true);
		expect(imgs.some((img) => img.getAttribute("src") === "/icon/light.svg")).toBe(true);
	});

	it("merges custom className on both imgs", () => {
		render(<BrandIcon className="my-custom" />);
		const imgs = screen.getAllByAltText("Reactive Resume");
		for (const img of imgs) {
			expect(img).toHaveClass("my-custom");
		}
	});

	it("hides dark variant by default (light mode); dark mode reveals it via dark:block", () => {
		render(<BrandIcon />);
		const imgs = screen.getAllByAltText("Reactive Resume");
		const darkImg = imgs.find((img) => img.getAttribute("src") === "/logo/dark.svg");
		expect(darkImg).toHaveClass("hidden");
		expect(darkImg).toHaveClass("dark:block");
	});
});
