import { describe, expect, it } from "vitest";
import { pageDimensionsAsMillimeters, pageDimensionsAsPixels } from "./page";

describe("pageDimensionsAsPixels", () => {
	it("defines a4 dimensions matching ISO 216 at ~96 DPI", () => {
		expect(pageDimensionsAsPixels.a4).toEqual({ width: 794, height: 1123 });
	});

	it("defines US letter dimensions", () => {
		expect(pageDimensionsAsPixels.letter).toEqual({ width: 816, height: 1056 });
	});

	it("defines free-form dimensions same as a4", () => {
		expect(pageDimensionsAsPixels["free-form"]).toEqual({ width: 794, height: 1123 });
	});

	it("uses portrait orientation (height > width) for all formats", () => {
		expect(pageDimensionsAsPixels.a4.height).toBeGreaterThan(pageDimensionsAsPixels.a4.width);
		expect(pageDimensionsAsPixels.letter.height).toBeGreaterThan(pageDimensionsAsPixels.letter.width);
	});
});

describe("pageDimensionsAsMillimeters", () => {
	it("defines a4 dimensions in millimeters per ISO 216", () => {
		expect(pageDimensionsAsMillimeters.a4).toEqual({ width: "210mm", height: "297mm" });
	});

	it("defines letter dimensions in millimeters", () => {
		expect(pageDimensionsAsMillimeters.letter).toEqual({ width: "216mm", height: "279mm" });
	});

	it("appends 'mm' unit suffix to all values", () => {
		for (const [, dims] of Object.entries(pageDimensionsAsMillimeters)) {
			expect(dims.width).toMatch(/mm$/);
			expect(dims.height).toMatch(/mm$/);
		}
	});

	it("provides all three formats (a4, letter, free-form)", () => {
		expect(Object.keys(pageDimensionsAsMillimeters).sort()).toEqual(["a4", "free-form", "letter"]);
	});
});
