import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { resolveLayoutSectionTitle } from "./title";

const createResumeData = (): ResumeData => structuredClone(defaultResumeData);

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

describe("resolveLayoutSectionTitle", () => {
	it("uses a custom section title when present", () => {
		const data = createResumeData();
		data.customSections = [
			{
				id: "custom-awards",
				type: "awards",
				title: "Industry Recognition",
				columns: 1,
				hidden: false,
				items: [],
			},
		] as never;

		expect(resolveLayoutSectionTitle(data, "custom-awards")).toBe("Industry Recognition");
	});

	it("falls back to the custom section type title when the custom title is empty", () => {
		const data = createResumeData();
		data.customSections = [
			{
				id: "custom-awards",
				type: "awards",
				title: "",
				columns: 1,
				hidden: false,
				items: [],
			},
		] as never;

		expect(resolveLayoutSectionTitle(data, "custom-awards")).toBe("Awards");
	});
});
