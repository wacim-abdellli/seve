import { describe, expect, it } from "vitest";
import { makeSectionItem } from "./make-section-item";

describe("makeSectionItem", () => {
	it("clones the provided item but generates a fresh id", () => {
		const original = { id: "original-id", name: "Skill" };
		const result = makeSectionItem({ id: "default", name: "" }, original);

		expect(result.name).toBe("Skill");
		expect(result.id).not.toBe("original-id");
		expect(result.id.length).toBeGreaterThan(0);
	});

	it("uses defaultItem when no item is provided", () => {
		const defaultItem = { id: "default", name: "", level: 0 };
		const result = makeSectionItem(defaultItem);

		expect(result.name).toBe("");
		expect(result.level).toBe(0);
		expect(result.id).not.toBe("default");
	});

	it("does not mutate the input item when duplicating", () => {
		const original = { id: "original-id", value: "test" };
		const before = JSON.stringify(original);
		makeSectionItem({ id: "default", value: "" }, original);
		expect(JSON.stringify(original)).toBe(before);
	});

	it("does not mutate the defaultItem", () => {
		const defaultItem = { id: "default", value: "x" };
		const before = JSON.stringify(defaultItem);
		makeSectionItem(defaultItem);
		expect(JSON.stringify(defaultItem)).toBe(before);
	});

	it("generates a unique id per call", () => {
		const a = makeSectionItem({ id: "default", name: "" });
		const b = makeSectionItem({ id: "default", name: "" });
		expect(a.id).not.toBe(b.id);
	});

	it("preserves all other fields when duplicating", () => {
		const item = { id: "x", a: 1, b: { c: 2 }, d: [3] };
		const result = makeSectionItem({ id: "default", a: 0, b: { c: 0 }, d: [] }, item);
		expect(result.a).toBe(1);
		expect(result.b).toEqual({ c: 2 });
		expect(result.d).toEqual([3]);
	});
});
