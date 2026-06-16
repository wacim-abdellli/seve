import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("ScizorPage", () => {
	it("does not override configured text color with the template muted gray", () => {
		const source = readFileSync(fileURLToPath(new URL("./ScizorPage.tsx", import.meta.url)), "utf8");

		expect(source).not.toMatch(/color:\s*muted/);
	});
});
