import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { templateSchema } from "@reactive-resume/schema/templates";

const templatePages = templateSchema.options.map(
	(template) =>
		[
			template,
			fileURLToPath(new URL(`./templates/${template}/${capitalize(template)}Page.tsx`, import.meta.url)),
		] as const,
);

function capitalize(template: string): string {
	return template.charAt(0).toUpperCase() + template.slice(1);
}

describe("RTL PDF fixture", () => {
	it.each(templatePages)("%s wires shared RTL helpers and alignEnd slot", (_template, pagePath) => {
		const source = readFileSync(pagePath, "utf8");

		expect(source).toContain("createRtlStyleHelpers");
		expect(source).toContain("alignEnd");
		expect(source).not.toContain("alignRight");
		expect(source).not.toContain('from "@reactive-resume/utils/locale"');
	});
});
