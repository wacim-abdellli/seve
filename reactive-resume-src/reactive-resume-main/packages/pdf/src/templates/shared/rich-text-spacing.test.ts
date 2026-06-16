import { describe, expect, it } from "vitest";
import { parse } from "node-html-parser";
import {
	createRichTextProseSpacing,
	getRichTextEdgeTrimStyle,
	isRichTextElementInsideListItem,
	isRichTextElementInsideOrderedList,
	resolveRichTextBodyLineHeight,
	stripRichTextVerticalMargins,
} from "./rich-text-spacing";

const requireElement = <T>(element: T | null | undefined): T => {
	expect(element).toBeDefined();
	if (!element) throw new Error("Expected element to exist.");

	return element;
};

describe("createRichTextProseSpacing", () => {
	it("uses 0.2x the configured body line height for each paragraph and list-item side margin", () => {
		const spacing = createRichTextProseSpacing(15);

		expect(spacing.paragraph.marginTop).toBeCloseTo(3);
		expect(spacing.paragraph.marginBottom).toBeCloseTo(3);
		expect(spacing.listItem.marginTop).toBeCloseTo(3);
		expect(spacing.listItem.marginBottom).toBeCloseTo(3);
		expect((spacing.paragraph.marginBottom as number) + (spacing.paragraph.marginTop as number)).toBeCloseTo(6);
	});

	it("does not invent spacing when no configured body line height is available", () => {
		expect(createRichTextProseSpacing(undefined)).toEqual({
			paragraph: {},
			listItem: {},
		});
	});
});

describe("resolveRichTextBodyLineHeight", () => {
	it("derives the configured body line height from body font size and line-height multiplier", () => {
		expect(resolveRichTextBodyLineHeight({ fontSize: 10, lineHeight: 1.5 })).toBe(15);
	});

	it("uses the last resolved numeric font size and line height from template styles", () => {
		expect(
			resolveRichTextBodyLineHeight({ fontSize: 9, lineHeight: 1.2 }, [
				{ color: "#111" },
				{ fontSize: 11, lineHeight: 1.5 },
			]),
		).toBe(16.5);
	});

	it("parses px font-size and line-height strings when styles contain them", () => {
		expect(resolveRichTextBodyLineHeight({ fontSize: "12px", lineHeight: "18px" })).toBe(18);
	});

	it("returns undefined when configured body line height cannot be resolved", () => {
		expect(resolveRichTextBodyLineHeight({ fontSize: 10 })).toBeUndefined();
		expect(resolveRichTextBodyLineHeight({ lineHeight: 1.5 })).toBeUndefined();
	});
});

describe("getRichTextEdgeTrimStyle", () => {
	it("trims both edges for a single paragraph", () => {
		const [paragraph] = parse("<p>Only paragraph.</p>").querySelectorAll("p");

		expect(getRichTextEdgeTrimStyle(requireElement(paragraph))).toEqual({ marginTop: 0, marginBottom: 0 });
	});

	it("trims only the outer edges for multiple paragraphs", () => {
		const [firstParagraph, secondParagraph] = parse("<p>First.</p><p>Second.</p>").querySelectorAll("p");

		expect(getRichTextEdgeTrimStyle(requireElement(firstParagraph))).toEqual({ marginTop: 0 });
		expect(getRichTextEdgeTrimStyle(requireElement(secondParagraph))).toEqual({ marginBottom: 0 });
	});

	it("trims only the outer edges for list items", () => {
		const [firstItem, secondItem] = parse("<ul><li>First.</li><li>Second.</li></ul>").querySelectorAll("li");

		expect(getRichTextEdgeTrimStyle(requireElement(firstItem))).toEqual({ marginTop: 0 });
		expect(getRichTextEdgeTrimStyle(requireElement(secondItem))).toEqual({ marginBottom: 0 });
	});

	it("trims across mixed paragraph and list content", () => {
		const root = parse("<p>Intro.</p><ul><li><p>Nested item paragraph.</p></li></ul>");
		const introParagraph = root.querySelector("p");
		const listItem = root.querySelector("li");
		const nestedParagraph = root.querySelector("li p");

		expect(getRichTextEdgeTrimStyle(requireElement(introParagraph))).toEqual({ marginTop: 0 });
		expect(getRichTextEdgeTrimStyle(requireElement(listItem))).toEqual({ marginBottom: 0 });
		expect(getRichTextEdgeTrimStyle(requireElement(nestedParagraph))).toEqual({});
	});

	it("normalizes uppercase and mixed-case tags before trimming edges", () => {
		const [firstParagraph, secondItem] = parse("<P>Intro.</P><UL><LI>Item.</LI></UL>").querySelectorAll("p, li");

		expect(getRichTextEdgeTrimStyle(requireElement(firstParagraph))).toEqual({ marginTop: 0 });
		expect(getRichTextEdgeTrimStyle(requireElement(secondItem))).toEqual({ marginBottom: 0 });
	});
});

describe("stripRichTextVerticalMargins", () => {
	it("removes vertical margin properties from list content styles and preserves text styles", () => {
		expect(
			stripRichTextVerticalMargins({
				color: "#222",
				fontSize: 10,
				margin: 0,
				marginTop: 1,
				marginBottom: 2,
				marginVertical: 3,
			}),
		).toEqual({
			color: "#222",
			fontSize: 10,
		});
	});
});

describe("isRichTextElementInsideListItem", () => {
	it("detects paragraphs nested directly inside list items", () => {
		const paragraph = parse("<ul><li><p>Nested item paragraph.</p></li></ul>").querySelector("p");

		expect(isRichTextElementInsideListItem(requireElement(paragraph))).toBe(true);
	});

	it("detects paragraphs nested deeper inside list item content", () => {
		const paragraph = parse("<ul><li><section><p>Nested item paragraph.</p></section></li></ul>").querySelector("p");

		expect(isRichTextElementInsideListItem(requireElement(paragraph))).toBe(true);
	});

	it("normalizes uppercase and mixed-case tags for list item ancestor detection", () => {
		const paragraph = parse("<UL><LI><Section><P>Nested item paragraph.</P></Section></LI></UL>").querySelector("p");

		expect(isRichTextElementInsideListItem(requireElement(paragraph))).toBe(true);
	});

	it("does not treat top-level paragraphs as list item content", () => {
		const paragraph = parse("<p>Top-level paragraph.</p>").querySelector("p");

		expect(isRichTextElementInsideListItem(requireElement(paragraph))).toBe(false);
	});
});

describe("isRichTextElementInsideOrderedList", () => {
	it("normalizes uppercase and mixed-case ordered-list ancestors", () => {
		const firstItem = parse("<OL><LI>First item.</LI></OL>").querySelector("li");
		const nestedParagraph = parse("<Ol><Li><Section><P>Nested item paragraph.</P></Section></Li></Ol>").querySelector(
			"p",
		);

		expect(isRichTextElementInsideOrderedList(requireElement(firstItem))).toBe(true);
		expect(isRichTextElementInsideOrderedList(requireElement(nestedParagraph))).toBe(true);
	});

	it("does not treat unordered-list ancestors as ordered lists", () => {
		const item = parse("<UL><LI>First item.</LI></UL>").querySelector("li");

		expect(isRichTextElementInsideOrderedList(requireElement(item))).toBe(false);
	});

	it("uses the nearest list ancestor when ordered and unordered lists are nested", () => {
		const unorderedNestedInOrdered = parse("<ol><li><ul><li>Nested unordered item.</li></ul></li></ol>").querySelector(
			"ul li",
		);
		const orderedNestedInUnordered = parse("<ul><li><ol><li>Nested ordered item.</li></ol></li></ul>").querySelector(
			"ol li",
		);

		expect(isRichTextElementInsideOrderedList(requireElement(unorderedNestedInOrdered))).toBe(false);
		expect(isRichTextElementInsideOrderedList(requireElement(orderedNestedInUnordered))).toBe(true);
	});
});
