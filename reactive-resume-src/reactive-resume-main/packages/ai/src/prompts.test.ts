import { describe, expect, it } from "vitest";
import {
	analyzeResumeSystemPrompt,
	chatSystemPromptTemplate,
	docxParserSystemPrompt,
	docxParserUserPrompt,
	pdfParserSystemPrompt,
	pdfParserUserPrompt,
} from "./prompts";

describe("prompts", () => {
	it("loads markdown prompts as strings in Node runtimes", () => {
		expect(analyzeResumeSystemPrompt).toContain("resume");
		expect(chatSystemPromptTemplate).toContain("resume");
		expect(docxParserSystemPrompt).toContain("DOCX");
		expect(docxParserUserPrompt).toContain("Microsoft Word");
		expect(pdfParserSystemPrompt).toContain("PDF");
		expect(pdfParserUserPrompt).toContain("PDF");
	});
});
