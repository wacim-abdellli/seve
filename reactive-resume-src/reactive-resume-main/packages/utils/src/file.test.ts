/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadFromUrl, downloadWithAnchor, generateFilename } from "./file";

describe("generateFilename", () => {
	it("slugifies the prefix without extension", () => {
		expect(generateFilename("My Resume")).toBe("my-resume");
	});

	it("appends extension when provided", () => {
		expect(generateFilename("My Resume", "pdf")).toBe("my-resume.pdf");
	});

	it("appends extension verbatim (no extra dot)", () => {
		expect(generateFilename("Name", "json")).toBe("name.json");
	});

	it("handles empty extension as no extension", () => {
		expect(generateFilename("foo", "")).toBe("foo");
	});

	it("strips diacritics", () => {
		expect(generateFilename("Résumé", "pdf")).toBe("resume.pdf");
	});

	it("handles empty prefix", () => {
		expect(generateFilename("", "pdf")).toBe(".pdf");
	});
});

describe("downloadWithAnchor", () => {
	let createObjectURLSpy: ReturnType<typeof vi.fn<typeof URL.createObjectURL>>;
	let revokeObjectURLSpy: ReturnType<typeof vi.fn<typeof URL.revokeObjectURL>>;
	let originalCreate: typeof URL.createObjectURL;
	let originalRevoke: typeof URL.revokeObjectURL;

	beforeEach(() => {
		vi.useFakeTimers();
		originalCreate = URL.createObjectURL;
		originalRevoke = URL.revokeObjectURL;
		createObjectURLSpy = vi.fn<typeof URL.createObjectURL>(() => "blob:mock-url");
		revokeObjectURLSpy = vi.fn<typeof URL.revokeObjectURL>();
		URL.createObjectURL = createObjectURLSpy;
		URL.revokeObjectURL = revokeObjectURLSpy;
	});

	afterEach(() => {
		vi.useRealTimers();
		URL.createObjectURL = originalCreate;
		URL.revokeObjectURL = originalRevoke;
	});

	it("creates an anchor with correct href, rel, and download attributes", () => {
		const blob = new Blob(["hello"], { type: "text/plain" });
		const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

		downloadWithAnchor(blob, "test.txt");

		expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
		expect(clickSpy).toHaveBeenCalledOnce();

		clickSpy.mockRestore();
	});

	it("removes the anchor from the DOM after click", () => {
		const blob = new Blob(["hello"]);
		vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

		const beforeChildCount = document.body.childElementCount;
		downloadWithAnchor(blob, "test.txt");
		const afterChildCount = document.body.childElementCount;

		expect(afterChildCount).toBe(beforeChildCount);
	});

	it("revokes the object URL after 5 seconds", () => {
		const blob = new Blob(["hello"]);
		vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

		downloadWithAnchor(blob, "test.txt");

		expect(revokeObjectURLSpy).not.toHaveBeenCalled();
		vi.advanceTimersByTime(4999);
		expect(revokeObjectURLSpy).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
	});
});

describe("downloadFromUrl", () => {
	let originalFetch: typeof global.fetch;
	let createObjectURLSpy: ReturnType<typeof vi.fn<typeof URL.createObjectURL>>;
	let revokeObjectURLSpy: ReturnType<typeof vi.fn<typeof URL.revokeObjectURL>>;
	let originalCreate: typeof URL.createObjectURL;
	let originalRevoke: typeof URL.revokeObjectURL;

	beforeEach(() => {
		originalFetch = global.fetch;
		originalCreate = URL.createObjectURL;
		originalRevoke = URL.revokeObjectURL;
		createObjectURLSpy = vi.fn<typeof URL.createObjectURL>(() => "blob:mock-url");
		revokeObjectURLSpy = vi.fn<typeof URL.revokeObjectURL>();
		URL.createObjectURL = createObjectURLSpy;
		URL.revokeObjectURL = revokeObjectURLSpy;
	});

	afterEach(() => {
		global.fetch = originalFetch;
		URL.createObjectURL = originalCreate;
		URL.revokeObjectURL = originalRevoke;
	});

	it("fetches the URL and downloads the resulting blob", async () => {
		const mockBlob = new Blob(["data"], { type: "application/pdf" });
		global.fetch = vi.fn(() =>
			Promise.resolve(new Response(mockBlob, { status: 200 })),
		) as unknown as typeof global.fetch;
		vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

		await downloadFromUrl("https://example.com/file.pdf", "file.pdf");

		expect(global.fetch).toHaveBeenCalledWith("https://example.com/file.pdf");
		expect(createObjectURLSpy).toHaveBeenCalled();
	});

	it("propagates fetch errors", async () => {
		global.fetch = vi.fn(() => Promise.reject(new Error("network down"))) as unknown as typeof global.fetch;
		await expect(downloadFromUrl("https://example.com", "x.pdf")).rejects.toThrow("network down");
	});
});
