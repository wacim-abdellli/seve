import { describe, expect, it } from "vitest";
import { createRtlStyleHelpers } from "./rtl";

describe("createRtlStyleHelpers", () => {
	it("returns LTR defaults when rtl is false", () => {
		const r = createRtlStyleHelpers(false);

		expect(r.pageDirection).toBe("ltr");
		expect(r.row).toBe("row");
		expect(r.text).toEqual({});
		expect(r.alignEnd.textAlign).toBe("right");
		expect(r.gridRowStyle).toBeUndefined();
		expect(r.anchorToStart()).toEqual({ left: 0, right: undefined });
	});

	it("returns RTL mirrors when rtl is true", () => {
		const r = createRtlStyleHelpers(true);

		expect(r.pageDirection).toBe("rtl");
		expect(r.row).toBe("row-reverse");
		expect(r.text).toEqual({ direction: "rtl", textAlign: "right" });
		expect(r.alignEnd.textAlign).toBe("left");
		expect(r.gridRowStyle).toEqual({ flexDirection: "row-reverse" });
		expect(r.anchorToStart()).toEqual({ right: 0, left: undefined });
	});

	it("mirrors contact separator borders", () => {
		const ltr = createRtlStyleHelpers(false).contactSeparator("#000", 4);
		const rtl = createRtlStyleHelpers(true).contactSeparator("#000", 4);

		expect(ltr).toMatchObject({ borderRightWidth: 1, paddingRight: 4, marginRight: 4 });
		expect(rtl).toMatchObject({ borderLeftWidth: 1, paddingLeft: 4, marginLeft: 4 });
	});
});
