import { describe, expect, it } from "vitest";
import { getSectionItemRows, getSectionItemsLayout, shouldUseSectionTimeline } from "./columns";

describe("getSectionItemsLayout", () => {
	it("returns single-column layout for columns=1", () => {
		const layout = getSectionItemsLayout({ columns: 1, rowGap: 4, columnGap: 6 });
		expect(layout.columns).toBe(1);
		expect(layout.isGrid).toBe(false);
		expect(layout.rowStyle).toBeUndefined();
		expect(layout.itemStyle).toBeUndefined();
	});

	it("returns grid layout for columns=2", () => {
		const layout = getSectionItemsLayout({ columns: 2, rowGap: 4, columnGap: 6 });
		expect(layout.columns).toBe(2);
		expect(layout.isGrid).toBe(true);
		expect(layout.rowStyle).toEqual({ flexDirection: "row", columnGap: 6 });
		expect(layout.itemStyle).toMatchObject({
			flexBasis: 0,
			flexGrow: 1,
			flexShrink: 1,
			minWidth: 0,
			maxWidth: "100%",
			overflow: "hidden",
		});
	});

	it("clamps columns above 6 to 6", () => {
		const layout = getSectionItemsLayout({ columns: 99, rowGap: 4, columnGap: 6 });
		expect(layout.columns).toBe(6);
	});

	it("clamps columns below 1 to 1", () => {
		const layout = getSectionItemsLayout({ columns: 0, rowGap: 4, columnGap: 6 });
		expect(layout.columns).toBe(1);
	});

	it("treats non-integer columns as 1", () => {
		const layout = getSectionItemsLayout({ columns: 2.5, rowGap: 4, columnGap: 6 });
		expect(layout.columns).toBe(1);
	});

	it("treats non-numeric columns as 1", () => {
		const layout = getSectionItemsLayout({ columns: "2", rowGap: 4, columnGap: 6 });
		expect(layout.columns).toBe(1);
	});

	it("treats Infinity as 1", () => {
		const layout = getSectionItemsLayout({ columns: Number.POSITIVE_INFINITY, rowGap: 4, columnGap: 6 });
		expect(layout.columns).toBe(1);
	});

	it("includes containerStyle.rowGap", () => {
		const layout = getSectionItemsLayout({ columns: 1, rowGap: 8, columnGap: 6 });
		expect(layout.containerStyle).toEqual({ rowGap: 8 });
	});
});

describe("getSectionItemRows", () => {
	it("groups items into rows of N columns", () => {
		expect(getSectionItemRows([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
	});

	it("returns single-item rows for columns=1", () => {
		expect(getSectionItemRows([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
	});

	it("returns one row when items fit in one row", () => {
		expect(getSectionItemRows([1, 2], 3)).toEqual([[1, 2]]);
	});

	it("returns empty array for empty input", () => {
		expect(getSectionItemRows([], 2)).toEqual([]);
	});

	it("clamps invalid columns to 1", () => {
		expect(getSectionItemRows([1, 2], 0)).toEqual([[1], [2]]);
		expect(getSectionItemRows([1, 2], "not-a-number")).toEqual([[1], [2]]);
	});

	it("clamps columns above 6 to 6", () => {
		expect(getSectionItemRows([1, 2, 3, 4, 5, 6, 7, 8], 99)).toEqual([
			[1, 2, 3, 4, 5, 6],
			[7, 8],
		]);
	});
});

describe("shouldUseSectionTimeline", () => {
	it("returns true only for sectionTimeline=true, placement='main', columns=1", () => {
		expect(shouldUseSectionTimeline({ sectionTimeline: true, placement: "main", columns: 1 })).toBe(true);
	});

	it("returns false when placement is not 'main'", () => {
		expect(shouldUseSectionTimeline({ sectionTimeline: true, placement: "sidebar", columns: 1 })).toBe(false);
	});

	it("returns false when columns > 1 (after normalization)", () => {
		expect(shouldUseSectionTimeline({ sectionTimeline: true, placement: "main", columns: 2 })).toBe(false);
	});

	it("returns false when sectionTimeline=false", () => {
		expect(shouldUseSectionTimeline({ sectionTimeline: false, placement: "main", columns: 1 })).toBe(false);
	});

	it("returns true when columns is invalid (normalized to 1)", () => {
		expect(shouldUseSectionTimeline({ sectionTimeline: true, placement: "main", columns: 0 })).toBe(true);
	});
});
