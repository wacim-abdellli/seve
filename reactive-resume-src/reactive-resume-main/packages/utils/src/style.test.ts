import { describe, expect, it } from "vitest";
import { cn } from "./style";

describe("cn", () => {
	it("joins simple class strings", () => {
		expect(cn("a", "b", "c")).toBe("a b c");
	});

	it("filters out falsy values", () => {
		expect(cn("a", null, undefined, false, "b", 0)).toBe("a b");
	});

	it("conditionally applies classes via object syntax", () => {
		expect(cn({ a: true, b: false, c: true })).toBe("a c");
	});

	it("flattens arrays of inputs", () => {
		expect(cn(["a", "b"], ["c"])).toBe("a b c");
	});

	it("merges conflicting tailwind classes (later wins)", () => {
		expect(cn("p-4", "p-2")).toBe("p-2");
		expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
	});

	it("preserves non-conflicting tailwind classes", () => {
		expect(cn("text-red-500", "bg-white")).toContain("text-red-500");
		expect(cn("text-red-500", "bg-white")).toContain("bg-white");
	});

	it("handles responsive variants distinctly from base classes", () => {
		expect(cn("p-4", "md:p-2")).toBe("p-4 md:p-2");
	});

	it("returns empty string for no input", () => {
		expect(cn()).toBe("");
	});

	it("returns empty string when all inputs are falsy", () => {
		expect(cn(null, undefined, false)).toBe("");
	});

	it("merges twMerge group conflicts (e.g., flex-row vs flex-col)", () => {
		expect(cn("flex-row", "flex-col")).toBe("flex-col");
	});
});
