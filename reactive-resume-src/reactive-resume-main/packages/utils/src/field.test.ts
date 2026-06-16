import { describe, expect, it } from "vitest";
import { filterFieldValues } from "./field";

describe("filterFieldValues", () => {
	it("returns map of fields whose values are non-empty", () => {
		const fields = [{ key: "name" as const }, { key: "email" as const }];
		const result = filterFieldValues({ name: "Alice", email: "alice@example.com" }, ...fields);

		expect(result.size).toBe(2);
		expect(result.get("name")).toEqual({ key: "name" });
		expect(result.get("email")).toEqual({ key: "email" });
	});

	it("filters out fields with empty string values", () => {
		const fields = [{ key: "name" as const }, { key: "email" as const }];
		const result = filterFieldValues({ name: "Alice", email: "" }, ...fields);

		expect(result.size).toBe(1);
		expect(result.has("email")).toBe(false);
		expect(result.has("name")).toBe(true);
	});

	it("filters out fields with whitespace-only values", () => {
		const fields = [{ key: "name" as const }];
		const result = filterFieldValues({ name: "   " }, ...fields);

		expect(result.size).toBe(0);
	});

	it("filters out fields with null values", () => {
		const fields = [{ key: "name" as const }];
		const result = filterFieldValues({ name: null }, ...fields);

		expect(result.size).toBe(0);
	});

	it("filters out fields with undefined values", () => {
		const fields = [{ key: "name" as const }];
		const result = filterFieldValues({ name: undefined }, ...fields);

		expect(result.size).toBe(0);
	});

	it("filters out fields with missing keys", () => {
		const fields = [{ key: "name" as const }];
		const result = filterFieldValues<"name", { key: "name" }>({}, ...fields);

		expect(result.size).toBe(0);
	});

	it("preserves additional field properties on output", () => {
		const fields = [{ key: "name" as const, label: "Name", icon: "person" }];
		const result = filterFieldValues({ name: "Alice" }, ...fields);

		expect(result.get("name")).toEqual({ key: "name", label: "Name", icon: "person" });
	});

	it("returns empty map when no fields supplied", () => {
		const result = filterFieldValues({ name: "Alice" });
		expect(result.size).toBe(0);
	});

	it("preserves field order in iteration", () => {
		const fields = [{ key: "a" as const }, { key: "b" as const }, { key: "c" as const }];
		const result = filterFieldValues({ a: "1", b: "2", c: "3" }, ...fields);

		const keys = [...result.keys()];
		expect(keys).toEqual(["a", "b", "c"]);
	});
});
