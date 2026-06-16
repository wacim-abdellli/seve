import { describe, expect, it } from "vitest";
import { createUrl } from "./url";

describe("createUrl", () => {
	it("returns empty url and label when no url provided", () => {
		expect(createUrl()).toEqual({ url: "", label: "" });
	});

	it("returns empty pair when url is empty string (falsy)", () => {
		expect(createUrl("")).toEqual({ url: "", label: "" });
	});

	it("uses url as label when no label provided", () => {
		expect(createUrl("https://example.com")).toEqual({
			url: "https://example.com",
			label: "https://example.com",
		});
	});

	it("preserves provided label", () => {
		expect(createUrl("https://example.com", "Example")).toEqual({
			url: "https://example.com",
			label: "Example",
		});
	});

	it("falls back to url when label is empty string", () => {
		expect(createUrl("https://example.com", "")).toEqual({
			url: "https://example.com",
			label: "https://example.com",
		});
	});

	it("does not validate the url format (caller's responsibility)", () => {
		expect(createUrl("not-a-url", "Label")).toEqual({
			url: "not-a-url",
			label: "Label",
		});
	});
});
