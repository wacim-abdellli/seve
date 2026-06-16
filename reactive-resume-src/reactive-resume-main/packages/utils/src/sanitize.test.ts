/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import { isObject, sanitizeCss, sanitizeHtml } from "./sanitize";

describe("sanitizeHtml", () => {
	it("returns empty string for empty input", () => {
		expect(sanitizeHtml("")).toBe("");
	});

	it("preserves allowed tags", () => {
		const result = sanitizeHtml("<p>Hello <strong>world</strong></p>");
		expect(result).toContain("<p>");
		expect(result).toContain("<strong>");
		expect(result).toContain("Hello");
		expect(result).toContain("world");
	});

	it("strips disallowed tags like <script>", () => {
		const result = sanitizeHtml("<p>Hello</p><script>alert(1)</script>");
		expect(result).not.toContain("<script>");
		expect(result).not.toContain("alert(1)");
		expect(result).toContain("<p>Hello</p>");
	});

	it("strips disallowed attributes like onerror", () => {
		const result = sanitizeHtml('<img src="x" onerror="alert(1)" />');
		expect(result).not.toContain("onerror");
	});

	it("strips iframe and object tags", () => {
		expect(sanitizeHtml("<iframe src='evil'></iframe>")).not.toContain("iframe");
		expect(sanitizeHtml("<object data='evil'></object>")).not.toContain("<object");
	});

	it("preserves links with safe href", () => {
		const result = sanitizeHtml('<a href="https://example.com">Click</a>');
		expect(result).toContain("https://example.com");
	});

	it("blocks javascript: URLs in href", () => {
		const result = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
		expect(result).not.toContain("javascript:");
	});

	it("preserves table structure tags", () => {
		const result = sanitizeHtml("<table><thead><tr><th>h</th></tr></thead><tbody><tr><td>d</td></tr></tbody></table>");
		expect(result).toContain("<table>");
		expect(result).toContain("<thead>");
		expect(result).toContain("<tbody>");
	});

	it("preserves list tags", () => {
		const result = sanitizeHtml("<ul><li>one</li><li>two</li></ul>");
		expect(result).toContain("<ul>");
		expect(result).toContain("<li>");
	});

	it("preserves headings", () => {
		const result = sanitizeHtml("<h1>Title</h1><h2>Sub</h2>");
		expect(result).toContain("<h1>");
		expect(result).toContain("<h2>");
	});
});

describe("sanitizeCss", () => {
	it("returns empty string for empty input", () => {
		expect(sanitizeCss("")).toBe("");
	});

	it("strips CSS comments", () => {
		const result = sanitizeCss("/* malicious */ body { color: red; }");
		expect(result).not.toContain("/*");
		expect(result).not.toContain("malicious");
	});

	it("decodes hex CSS escapes before sanitizing", () => {
		// \\6a\\61... encodes "javascript" — the decoder should expose this and the javascript: pattern then strips
		const css = "a { background: \\6a avascript:alert(1) }";
		const result = sanitizeCss(css);
		expect(result.toLowerCase()).not.toContain("javascript:");
	});

	it("strips javascript: protocol", () => {
		const result = sanitizeCss("a { background: javascript:alert(1) }");
		expect(result.toLowerCase()).not.toContain("javascript:");
	});

	it("strips expression() syntax", () => {
		const result = sanitizeCss("a { width: expression(alert(1)) }");
		expect(result.toLowerCase()).not.toContain("expression(");
	});

	it("strips behavior: declarations", () => {
		const result = sanitizeCss("a { behavior: url(#default#VML); }");
		expect(result.toLowerCase()).not.toContain("behavior:");
	});

	it("strips -moz-binding declarations", () => {
		const result = sanitizeCss("a { -moz-binding: url(evil.xml#xss); }");
		expect(result.toLowerCase()).not.toContain("-moz-binding");
	});

	it("strips @import directives", () => {
		const result = sanitizeCss("@import url('evil.css'); body { color: red; }");
		expect(result).not.toContain("@import");
	});

	it("strips @font-face blocks", () => {
		const result = sanitizeCss("@font-face { font-family: x; src: url(evil); } body {}");
		expect(result).not.toContain("@font-face");
	});

	it("strips url() values", () => {
		const result = sanitizeCss("a { background: url(evil.png); }");
		expect(result).not.toContain("url(");
	});

	it("strips standalone src: declarations", () => {
		const result = sanitizeCss("src: url(x.woff);");
		expect(result).not.toContain("src:");
	});

	it("preserves benign CSS", () => {
		const result = sanitizeCss("body { color: red; font-size: 14px; }");
		expect(result).toContain("color: red");
		expect(result).toContain("font-size: 14px");
	});
});

describe("isObject", () => {
	it("returns true for plain objects", () => {
		expect(isObject({})).toBe(true);
		expect(isObject({ a: 1 })).toBe(true);
	});

	it("returns false for arrays", () => {
		expect(isObject([])).toBe(false);
		expect(isObject([1, 2])).toBe(false);
	});

	it("returns false for null", () => {
		expect(isObject(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isObject(undefined)).toBe(false);
	});

	it("returns false for primitives", () => {
		expect(isObject(0)).toBe(false);
		expect(isObject("string")).toBe(false);
		expect(isObject(true)).toBe(false);
	});

	it("returns true for class instances (objects)", () => {
		expect(isObject(new Date())).toBe(true);
	});

	it("narrows the type correctly", () => {
		const value: unknown = { foo: "bar" };
		if (isObject(value)) {
			// should compile-check: value has Record<string, unknown>
			expect(typeof value.foo).toBe("string");
		}
	});
});
