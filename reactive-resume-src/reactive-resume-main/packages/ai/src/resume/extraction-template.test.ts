import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { buildAiExtractionTemplate } from "./extraction-template";

describe("buildAiExtractionTemplate", () => {
	it("returns a copy of defaultResumeData with one item per section", () => {
		const template = buildAiExtractionTemplate();

		for (const [, section] of Object.entries(template.sections)) {
			expect(Array.isArray(section.items)).toBe(true);
			expect(section.items).toHaveLength(1);
		}
	});

	it("populates the customFields with a single empty entry", () => {
		const template = buildAiExtractionTemplate();
		expect(template.basics.customFields).toEqual([{ id: "", icon: "", text: "", link: "" }]);
	});

	it("does not mutate defaultResumeData", () => {
		const before = JSON.stringify(defaultResumeData);
		buildAiExtractionTemplate();
		expect(JSON.stringify(defaultResumeData)).toBe(before);
	});

	it("creates skill items with empty fields and zero level", () => {
		const template = buildAiExtractionTemplate();
		const item = template.sections.skills.items[0] as Record<string, unknown>;
		expect(item.id).toBe("");
		expect(item.hidden).toBe(false);
		expect(item.name).toBe("");
		expect(item.level).toBe(0);
		expect(item.keywords).toEqual([]);
	});

	it("creates experience items with nested website object", () => {
		const template = buildAiExtractionTemplate();
		const item = template.sections.experience.items[0] as Record<string, unknown>;
		expect(item.website).toEqual({ url: "", label: "", inlineLink: false });
		expect(item.company).toBe("");
		expect(item.period).toBe("");
	});

	it("preserves unmodified sections from default (e.g., title)", () => {
		const template = buildAiExtractionTemplate();
		expect(template.sections.skills.title).toBe(defaultResumeData.sections.skills.title);
		expect(template.sections.skills.hidden).toBe(defaultResumeData.sections.skills.hidden);
		expect(template.sections.skills.columns).toBe(defaultResumeData.sections.skills.columns);
	});

	it("creates languages items with empty language and zero level", () => {
		const template = buildAiExtractionTemplate();
		const item = template.sections.languages.items[0] as Record<string, unknown>;
		expect(item.language).toBe("");
		expect(item.level).toBe(0);
	});

	it("creates references items with phone field", () => {
		const template = buildAiExtractionTemplate();
		const item = template.sections.references.items[0] as Record<string, unknown>;
		expect(item.phone).toBe("");
		expect(item.name).toBe("");
	});
});
