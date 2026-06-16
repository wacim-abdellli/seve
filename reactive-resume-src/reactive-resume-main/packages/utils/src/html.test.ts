import { describe, expect, it } from "vitest";
import { arrayToHtmlList, toHtmlDescription } from "./html";

describe("toHtmlDescription", () => {
	it("returns empty string when no inputs provided", () => {
		expect(toHtmlDescription()).toBe("");
	});

	it("returns just <p> with summary when no highlights", () => {
		expect(toHtmlDescription("Summary here")).toBe("<p>Summary here</p>");
	});

	it("returns just <ul> when only highlights", () => {
		expect(toHtmlDescription(undefined, ["a", "b"])).toBe("<ul><li>a</li><li>b</li></ul>");
	});

	it("returns combined output with both summary and highlights", () => {
		expect(toHtmlDescription("Sum", ["a"])).toBe("<p>Sum</p><ul><li>a</li></ul>");
	});

	it("omits ul when highlights is empty array", () => {
		expect(toHtmlDescription("Sum", [])).toBe("<p>Sum</p>");
	});

	it("preserves order: summary first, list second", () => {
		const result = toHtmlDescription("S", ["x", "y", "z"]);
		expect(result.indexOf("<p>")).toBeLessThan(result.indexOf("<ul>"));
	});

	it("treats empty string summary as falsy", () => {
		expect(toHtmlDescription("", ["a"])).toBe("<ul><li>a</li></ul>");
	});

	it("does not escape HTML in inputs (caller's responsibility)", () => {
		// Document existing behavior: caller must sanitize before passing
		expect(toHtmlDescription("<script>")).toBe("<p><script></p>");
	});
});

describe("arrayToHtmlList", () => {
	it("returns empty string for empty array", () => {
		expect(arrayToHtmlList([])).toBe("");
	});

	it("renders single item list", () => {
		expect(arrayToHtmlList(["one"])).toBe("<ul><li>one</li></ul>");
	});

	it("renders multi-item list", () => {
		expect(arrayToHtmlList(["one", "two", "three"])).toBe("<ul><li>one</li><li>two</li><li>three</li></ul>");
	});

	it("preserves item order", () => {
		const result = arrayToHtmlList(["c", "a", "b"]);
		expect(result.indexOf("c")).toBeLessThan(result.indexOf("a"));
		expect(result.indexOf("a")).toBeLessThan(result.indexOf("b"));
	});

	it("does not escape HTML in items", () => {
		expect(arrayToHtmlList(["<b>bold</b>"])).toBe("<ul><li><b>bold</b></li></ul>");
	});
});
