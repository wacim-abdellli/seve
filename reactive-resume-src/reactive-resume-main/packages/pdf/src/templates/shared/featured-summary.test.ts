import { describe, expect, it } from "vitest";
import { getFeaturedSummaryLayout } from "./featured-summary";

describe("getFeaturedSummaryLayout", () => {
	it("features the summary when it is in the first-page main sections", () => {
		expect(
			getFeaturedSummaryLayout({
				sections: ["experience", "summary", "education"],
				canFeatureSummary: true,
			}),
		).toEqual({
			featuredSummarySection: "summary",
			regularSections: ["experience", "education"],
		});
	});

	it("does not feature the first section when the resume has no visible summary", () => {
		expect(
			getFeaturedSummaryLayout({
				sections: ["experience", "education"],
				canFeatureSummary: true,
			}),
		).toEqual({
			featuredSummarySection: undefined,
			regularSections: ["experience", "education"],
		});
	});

	it("renders the summary normally after the first page", () => {
		expect(
			getFeaturedSummaryLayout({
				sections: ["summary", "experience"],
				canFeatureSummary: false,
			}),
		).toEqual({
			featuredSummarySection: undefined,
			regularSections: ["summary", "experience"],
		});
	});

	it("does not feature a visible summary that is not in the current main sections", () => {
		expect(
			getFeaturedSummaryLayout({
				sections: ["experience", "education"],
				canFeatureSummary: true,
			}),
		).toEqual({
			featuredSummarySection: undefined,
			regularSections: ["experience", "education"],
		});
	});
});
