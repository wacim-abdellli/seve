import { describe, expect, it } from "vitest";
import { generateId, generateRandomName, getInitials, slugify, stripHtml, toUsername } from "./string";

describe("generateId", () => {
	it("returns a UUIDv7 string", () => {
		const id = generateId();
		expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
	});

	it("returns unique values across invocations", () => {
		const ids = new Set(Array.from({ length: 50 }, () => generateId()));
		expect(ids.size).toBe(50);
	});

	it("returns ids that sort lexicographically by creation time", async () => {
		const first = generateId();
		await new Promise((resolve) => setTimeout(resolve, 5));
		const second = generateId();
		expect(second.localeCompare(first)).toBeGreaterThan(0);
	});
});

describe("slugify", () => {
	it("lowercases and replaces spaces with hyphens", () => {
		expect(slugify("Hello World")).toBe("hello-world");
	});

	it("preserves camelCase due to decamelize: false", () => {
		expect(slugify("HelloWorld")).toBe("helloworld");
	});

	it("strips diacritics and accents", () => {
		expect(slugify("Café")).toBe("cafe");
		expect(slugify("naïve résumé")).toBe("naive-resume");
	});

	it("removes punctuation", () => {
		expect(slugify("Hello, World!")).toBe("hello-world");
		expect(slugify("a/b\\c.d")).toBe("a-b-c-d");
	});

	it("collapses repeated separators", () => {
		expect(slugify("a   b---c")).toBe("a-b-c");
	});

	it("returns empty string for empty input", () => {
		expect(slugify("")).toBe("");
	});

	it("handles unicode emojis by stripping them", () => {
		expect(slugify("Hello 🌍 World")).toBe("hello-world");
	});

	it("falls back to a non-empty slug for CJK input", () => {
		expect(slugify("中文简历")).not.toBe("");
	});
});

describe("getInitials", () => {
	it("returns first letters of two-word names uppercased", () => {
		expect(getInitials("John Doe")).toBe("JD");
	});

	it("uses only first two parts for longer names", () => {
		expect(getInitials("John Michael Doe")).toBe("JM");
	});

	it("returns single uppercase initial for single word", () => {
		expect(getInitials("John")).toBe("J");
	});

	it("uppercases lowercase input", () => {
		expect(getInitials("jane smith")).toBe("JS");
	});

	it("handles empty string by returning empty string", () => {
		expect(getInitials("")).toBe("");
	});
});

describe("toUsername", () => {
	it("lowercases and trims", () => {
		expect(toUsername("  JohnDoe  ")).toBe("johndoe");
	});

	it("removes characters outside [a-z0-9._-]", () => {
		expect(toUsername("john!@#doe$%^")).toBe("johndoe");
	});

	it("preserves dots, underscores, and hyphens", () => {
		expect(toUsername("john.doe_test-123")).toBe("john.doe_test-123");
	});

	it("truncates to 64 characters max", () => {
		const longName = "a".repeat(100);
		expect(toUsername(longName)).toHaveLength(64);
	});

	it("handles unicode characters by stripping them", () => {
		expect(toUsername("Café")).toBe("caf");
		expect(toUsername("日本語")).toBe("");
	});

	it("returns empty string for whitespace-only input", () => {
		expect(toUsername("   ")).toBe("");
	});
});

describe("generateRandomName", () => {
	it("returns a string with three capitalized words", () => {
		const name = generateRandomName();
		const words = name.split(" ");
		expect(words).toHaveLength(3);
		for (const word of words) {
			expect(word[0]).toBe(word[0]?.toUpperCase());
		}
	});

	it("produces varying values", () => {
		const names = new Set(Array.from({ length: 20 }, () => generateRandomName()));
		// Allow rare collisions but expect variety from a 20-sample pool
		expect(names.size).toBeGreaterThan(5);
	});
});

describe("stripHtml", () => {
	it("removes simple tags and trims", () => {
		expect(stripHtml("<p>Hello</p>")).toBe("Hello");
	});

	it("removes nested tags and preserves text", () => {
		expect(stripHtml("<div><span>Hello</span> <strong>World</strong></div>")).toBe("Hello World");
	});

	it("returns empty string for undefined input", () => {
		expect(stripHtml(undefined)).toBe("");
	});

	it("returns empty string for empty input", () => {
		expect(stripHtml("")).toBe("");
	});

	it("handles self-closing tags", () => {
		expect(stripHtml("Line one<br/>Line two")).toBe("Line oneLine two");
	});

	it("strips attributes within tags", () => {
		expect(stripHtml('<a href="https://example.com" title="link">Click</a>')).toBe("Click");
	});

	it("preserves text containing angle brackets when not malformed tags", () => {
		// Greater-than after a closed tag stays
		expect(stripHtml("<p>5 > 3</p>")).toBe("5 > 3");
	});
});
