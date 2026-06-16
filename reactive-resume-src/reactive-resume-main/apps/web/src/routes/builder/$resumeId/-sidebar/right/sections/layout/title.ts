import type { CustomSectionType, ResumeData, SectionType } from "@reactive-resume/schema/resume/data";
import { getSectionTitle } from "@/libs/resume/section";

const hasTitle = (title: string): boolean => title.trim().length > 0;

export const resolveLayoutSectionTitle = (data: ResumeData, sectionId: string): string => {
	if (sectionId === "summary") return hasTitle(data.summary.title) ? data.summary.title : getSectionTitle("summary");

	if (sectionId in data.sections) {
		const section = data.sections[sectionId as SectionType];

		return hasTitle(section.title) ? section.title : getSectionTitle(sectionId as SectionType);
	}

	const customSection = data.customSections.find((section) => section.id === sectionId);

	if (customSection) {
		return hasTitle(customSection.title)
			? customSection.title
			: getSectionTitle(customSection.type as CustomSectionType);
	}

	return sectionId;
};
