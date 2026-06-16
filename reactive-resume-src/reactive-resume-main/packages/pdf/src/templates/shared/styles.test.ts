import { describe, expect, it } from "vitest";
import { composeLinkStyles, mergeLinkStyles } from "./styles";

describe("link styles", () => {
	it("underlines links by default", () => {
		expect(composeLinkStyles({}, { color: "#111" }).at(-1)).toEqual({ textDecoration: "underline" });
		expect(mergeLinkStyles({}, { color: "#111" })).toMatchObject({ color: "#111", textDecoration: "underline" });
	});

	it("forces links to render without underlines when requested", () => {
		expect(composeLinkStyles({ hideUnderline: true }, { textDecoration: "underline" }).at(-1)).toEqual({
			textDecoration: "none",
		});
		expect(mergeLinkStyles({ hideUnderline: true }, { textDecoration: "underline" })).toMatchObject({
			textDecoration: "none",
		});
	});
});
