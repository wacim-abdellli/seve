import { describe, expect, it } from "vitest";
import { parseLevel } from "./level";

describe("parseLevel", () => {
	describe("invalid input", () => {
		it("returns 0 for undefined", () => {
			expect(parseLevel()).toBe(0);
		});

		it("returns 0 for empty string", () => {
			expect(parseLevel("")).toBe(0);
		});

		it("returns 0 for unrecognized text", () => {
			expect(parseLevel("hello world")).toBe(0);
		});
	});

	describe("numeric values", () => {
		it("returns 0 for '0'", () => {
			expect(parseLevel("0")).toBe(0);
		});

		it("returns 5 for '5'", () => {
			expect(parseLevel("5")).toBe(5);
		});

		it("returns 3 for '3'", () => {
			expect(parseLevel("3")).toBe(3);
		});

		it("falls through to text matching for out-of-range numerics", () => {
			// 6 is out of range so the numeric branch fails, no text matches → 0
			expect(parseLevel("6")).toBe(0);
		});

		it("falls through for negative numerics", () => {
			expect(parseLevel("-1")).toBe(0);
		});

		it("parses leading-numeric strings via parseInt", () => {
			// "3 stars" → parseInt yields 3, in [0,5] → returns 3
			expect(parseLevel("3 stars")).toBe(3);
		});
	});

	describe("text levels", () => {
		it("returns 5 for 'native'", () => {
			expect(parseLevel("native")).toBe(5);
		});

		it("returns 5 for 'expert'", () => {
			expect(parseLevel("Expert")).toBe(5);
		});

		it("returns 5 for 'master'", () => {
			expect(parseLevel("master")).toBe(5);
		});

		it("returns 4 for 'fluent'", () => {
			expect(parseLevel("fluent")).toBe(4);
		});

		it("returns 4 for 'advanced'", () => {
			expect(parseLevel("Advanced")).toBe(4);
		});

		it("returns 4 for 'proficient'", () => {
			expect(parseLevel("proficient")).toBe(4);
		});

		it("returns 3 for 'intermediate'", () => {
			expect(parseLevel("intermediate")).toBe(3);
		});

		it("returns 3 for 'conversational'", () => {
			expect(parseLevel("conversational")).toBe(3);
		});

		it("returns 2 for 'beginner'", () => {
			expect(parseLevel("beginner")).toBe(2);
		});

		it("returns 2 for 'basic'", () => {
			expect(parseLevel("basic")).toBe(2);
		});

		it("returns 2 for 'elementary'", () => {
			expect(parseLevel("Elementary")).toBe(2);
		});

		it("returns 1 for 'novice'", () => {
			expect(parseLevel("novice")).toBe(1);
		});
	});

	describe("CEFR levels", () => {
		it("returns 5 for C2", () => {
			expect(parseLevel("C2")).toBe(5);
		});

		it("returns 4 for C1", () => {
			expect(parseLevel("c1")).toBe(4);
		});

		it("returns 3 for B2", () => {
			expect(parseLevel("B2")).toBe(3);
		});

		it("returns 2 for B1", () => {
			expect(parseLevel("b1")).toBe(2);
		});

		it("returns 1 for A2", () => {
			expect(parseLevel("A2")).toBe(1);
		});

		it("returns 1 for A1", () => {
			expect(parseLevel("a1")).toBe(1);
		});

		it("matches CEFR levels embedded in surrounding text", () => {
			expect(parseLevel("Level: B2")).toBe(3);
		});
	});

	describe("priority of matchers", () => {
		it("expert beats CEFR when both substrings appear", () => {
			// "expert" matches first and short-circuits before CEFR check
			expect(parseLevel("expert C2")).toBe(5);
		});
	});
});
