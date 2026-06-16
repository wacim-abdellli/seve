import { describe, expect, it } from "vitest";
import { getTemplateMetrics } from "./metrics";

describe("getTemplateMetrics", () => {
	it("maps margins to page paddings", () => {
		const metrics = getTemplateMetrics({ gapX: 4, gapY: 6, marginX: 14, marginY: 12 });
		expect(metrics.page.paddingHorizontal).toBe(14);
		expect(metrics.page.paddingVertical).toBe(12);
	});

	it("uses marginY as headerGap and sectionGap", () => {
		const metrics = getTemplateMetrics({ gapX: 4, gapY: 6, marginX: 14, marginY: 20 });
		expect(metrics.headerGap).toBe(20);
		expect(metrics.sectionGap).toBe(20);
	});

	it("uses marginX as columnGap", () => {
		const metrics = getTemplateMetrics({ gapX: 4, gapY: 6, marginX: 30, marginY: 12 });
		expect(metrics.columnGap).toBe(30);
	});

	it("preserves itemGapX and itemGapY directly from gapX/gapY", () => {
		const metrics = getTemplateMetrics({ gapX: 7, gapY: 9, marginX: 14, marginY: 12 });
		expect(metrics.itemGapX).toBe(7);
		expect(metrics.itemGapY).toBe(9);
	});

	it("provides gapX/gapY scaling functions", () => {
		const metrics = getTemplateMetrics({ gapX: 4, gapY: 6, marginX: 14, marginY: 12 });
		expect(metrics.gapX(2)).toBe(8);
		expect(metrics.gapY(3)).toBe(18);
	});

	it("scaling by 0.5 returns half-gap", () => {
		const metrics = getTemplateMetrics({ gapX: 10, gapY: 20, marginX: 14, marginY: 12 });
		expect(metrics.gapX(0.5)).toBe(5);
		expect(metrics.gapY(0.5)).toBe(10);
	});

	it("scaling by 0 returns 0", () => {
		const metrics = getTemplateMetrics({ gapX: 4, gapY: 6, marginX: 14, marginY: 12 });
		expect(metrics.gapX(0)).toBe(0);
		expect(metrics.gapY(0)).toBe(0);
	});
});
