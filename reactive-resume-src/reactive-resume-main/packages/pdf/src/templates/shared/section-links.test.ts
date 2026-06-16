import { describe, expect, it } from "vitest";
import { getInlineItemWebsiteUrl, shouldRenderSeparateItemWebsite } from "./section-links";

describe("getInlineItemWebsiteUrl", () => {
	it("returns the url when url is set and inlineLink is true", () => {
		expect(getInlineItemWebsiteUrl({ url: "https://example.com", label: "", inlineLink: true })).toBe(
			"https://example.com",
		);
	});

	it("returns undefined when inlineLink is false", () => {
		expect(getInlineItemWebsiteUrl({ url: "https://example.com", label: "", inlineLink: false })).toBeUndefined();
	});

	it("returns undefined when url is empty", () => {
		expect(getInlineItemWebsiteUrl({ url: "", label: "", inlineLink: true })).toBeUndefined();
	});

	it("returns undefined when inlineLink is undefined", () => {
		expect(getInlineItemWebsiteUrl({ url: "https://example.com", label: "" })).toBeUndefined();
	});
});

describe("shouldRenderSeparateItemWebsite", () => {
	it("returns true when url is set and inlineLink is false", () => {
		expect(shouldRenderSeparateItemWebsite({ url: "https://example.com", label: "", inlineLink: false })).toBe(true);
	});

	it("returns false when url is empty", () => {
		expect(shouldRenderSeparateItemWebsite({ url: "", label: "", inlineLink: false })).toBe(false);
	});

	it("returns false when inlineLink is true", () => {
		expect(shouldRenderSeparateItemWebsite({ url: "https://example.com", label: "", inlineLink: true })).toBe(false);
	});

	it("returns true when inlineLink is undefined", () => {
		expect(shouldRenderSeparateItemWebsite({ url: "https://example.com", label: "" })).toBe(true);
	});
});
