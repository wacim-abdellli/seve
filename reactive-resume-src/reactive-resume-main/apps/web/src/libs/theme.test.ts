import { describe, expect, it } from "vitest";
import { isTheme, themeMap } from "./theme";

describe("isTheme", () => {
	it("returns true for 'light'", () => {
		expect(isTheme("light")).toBe(true);
	});

	it("returns true for 'dark'", () => {
		expect(isTheme("dark")).toBe(true);
	});

	it("returns false for unknown theme", () => {
		expect(isTheme("auto")).toBe(false);
		expect(isTheme("system")).toBe(false);
	});

	it("returns false for empty string", () => {
		expect(isTheme("")).toBe(false);
	});

	it("is case-sensitive", () => {
		expect(isTheme("Light")).toBe(false);
		expect(isTheme("DARK")).toBe(false);
	});
});

describe("themeMap", () => {
	it("includes a descriptor for each theme", () => {
		expect(themeMap.light).toBeDefined();
		expect(themeMap.dark).toBeDefined();
	});
});
