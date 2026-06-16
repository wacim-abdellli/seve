import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalGetOrInsert = Map.prototype.getOrInsert;
const originalGetOrInsertComputed = Map.prototype.getOrInsertComputed;

const deleteMapUpsertMethods = () => {
	Reflect.deleteProperty(Map.prototype, "getOrInsert");
	Reflect.deleteProperty(Map.prototype, "getOrInsertComputed");
};

const resetMapUpsertMethods = () => {
	if (originalGetOrInsert) {
		Object.defineProperty(Map.prototype, "getOrInsert", {
			value: originalGetOrInsert,
			writable: true,
			configurable: true,
		});
	} else {
		Reflect.deleteProperty(Map.prototype, "getOrInsert");
	}

	if (originalGetOrInsertComputed) {
		Object.defineProperty(Map.prototype, "getOrInsertComputed", {
			value: originalGetOrInsertComputed,
			writable: true,
			configurable: true,
		});
	} else {
		Reflect.deleteProperty(Map.prototype, "getOrInsertComputed");
	}
};

describe("map upsert polyfill", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		resetMapUpsertMethods();
	});

	it("defines getOrInsert and getOrInsertComputed when the runtime does not provide them", async () => {
		deleteMapUpsertMethods();

		await import("./map-upsert");

		expect(Map.prototype.getOrInsert).toEqual(expect.any(Function));
		expect(Map.prototype.getOrInsertComputed).toEqual(expect.any(Function));
	});

	it("does not overwrite native map upsert methods", async () => {
		const getOrInsert = () => "native";
		const getOrInsertComputed = () => "native-computed";
		Object.defineProperty(Map.prototype, "getOrInsert", { value: getOrInsert, writable: true, configurable: true });
		Object.defineProperty(Map.prototype, "getOrInsertComputed", {
			value: getOrInsertComputed,
			writable: true,
			configurable: true,
		});

		await import("./map-upsert");

		expect(Map.prototype.getOrInsert).toBe(getOrInsert);
		expect(Map.prototype.getOrInsertComputed).toBe(getOrInsertComputed);
	});

	it("returns existing values without overwriting them", async () => {
		deleteMapUpsertMethods();
		await import("./map-upsert");

		const map = new Map<string, string | undefined>([
			["value", "existing"],
			["undefined", undefined],
		]);
		const callback = vi.fn(() => "computed");

		expect(map.getOrInsert("value", "default")).toBe("existing");
		expect(map.getOrInsert("undefined", "default")).toBeUndefined();
		expect(map.get("value")).toBe("existing");
		expect(map.getOrInsertComputed("value", callback)).toBe("existing");
		expect(callback).not.toHaveBeenCalled();
	});

	it("inserts missing values and computes lazy defaults with the key", async () => {
		deleteMapUpsertMethods();
		await import("./map-upsert");

		const map = new Map<string, string>();
		const callback = (key: string) => `${key}-computed`;

		expect(map.getOrInsert("value", "default")).toBe("default");
		expect(map.get("value")).toBe("default");
		expect(map.getOrInsertComputed("lazy", callback)).toBe("lazy-computed");
		expect(map.get("lazy")).toBe("lazy-computed");
	});

	it("validates the computed callback before returning an existing value", async () => {
		deleteMapUpsertMethods();
		await import("./map-upsert");

		const map = new Map([["value", "existing"]]);

		expect(() => map.getOrInsertComputed("value", undefined as never)).toThrow(TypeError);
	});

	it("passes canonical zero to the computed callback", async () => {
		deleteMapUpsertMethods();
		await import("./map-upsert");

		const map = new Map<number, string>();
		const callback = vi.fn((key: number) => `${key}-computed`);

		map.getOrInsertComputed(-0, callback);

		expect(callback).toHaveBeenCalledWith(0);
		expect(Object.is(callback.mock.calls[0]?.[0], -0)).toBe(false);
	});
});
