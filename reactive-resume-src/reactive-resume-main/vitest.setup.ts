import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// React Testing Library auto-cleanup hooks into afterEach as a global, but Vitest
// only exposes `afterEach` globally when `test.globals: true` is set. We register
// the cleanup explicitly so component tests do not leak DOM between runs.
afterEach(() => {
	cleanup();
});

// jsdom polyfills for browser APIs that some libraries (cmdk, base-ui)
// rely on but jsdom does not implement.
if (typeof globalThis.ResizeObserver === "undefined") {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver;
}

if (typeof globalThis.IntersectionObserver === "undefined") {
	globalThis.IntersectionObserver = class IntersectionObserver {
		root = null;
		rootMargin = "";
		thresholds: ReadonlyArray<number> = [];
		observe() {}
		unobserve() {}
		disconnect() {}
		takeRecords() {
			return [];
		}
	} as unknown as typeof IntersectionObserver;
}

// scrollIntoView is used by cmdk and other libs; jsdom does not implement it.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
	Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// matchMedia is used by next-themes and other UI libs; jsdom does not provide it.
if (typeof window !== "undefined" && !window.matchMedia) {
	window.matchMedia = vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	}));
}
