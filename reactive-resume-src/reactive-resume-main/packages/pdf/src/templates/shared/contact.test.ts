import { describe, expect, it } from "vitest";
import { getCustomFieldLinkUrl, getWebsiteDisplayText } from "./contact";

describe("getWebsiteDisplayText", () => {
	it("falls back to the full URL when the website label is blank", () => {
		expect(getWebsiteDisplayText({ url: "https://davidkowalski.games", label: "" })).toBe(
			"https://davidkowalski.games",
		);
		expect(getWebsiteDisplayText({ url: "https://davidkowalski.games", label: "   " })).toBe(
			"https://davidkowalski.games",
		);
		expect(getWebsiteDisplayText({ url: "http://example.com", label: undefined })).toBe("http://example.com");
	});

	it("uses the website label when one is provided", () => {
		expect(getWebsiteDisplayText({ url: "https://davidkowalski.games", label: "Portfolio" })).toBe("Portfolio");
	});
});

describe("getCustomFieldLinkUrl", () => {
	it("returns no link URL for blank custom field links", () => {
		expect(getCustomFieldLinkUrl({ link: "" })).toBeUndefined();
		expect(getCustomFieldLinkUrl({ link: "   " })).toBeUndefined();
		expect(getCustomFieldLinkUrl({ link: undefined })).toBeUndefined();
	});

	it("returns the custom field link URL when one is provided", () => {
		expect(getCustomFieldLinkUrl({ link: "https://example.com" })).toBe("https://example.com");
	});
});
