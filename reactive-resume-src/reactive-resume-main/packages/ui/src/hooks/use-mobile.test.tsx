import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "./use-mobile";

type ChangeListener = (e: { matches: boolean }) => void;

describe("useIsMobile", () => {
	let listeners: ChangeListener[];
	let matches: boolean;
	let originalMatchMedia: typeof window.matchMedia;

	beforeEach(() => {
		listeners = [];
		matches = false;
		originalMatchMedia = window.matchMedia;
		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches,
			media: query,
			onchange: null,
			addEventListener: vi.fn((_event: string, listener: ChangeListener) => {
				listeners.push(listener);
			}),
			removeEventListener: vi.fn((_event: string, listener: ChangeListener) => {
				const idx = listeners.indexOf(listener);
				if (idx >= 0) listeners.splice(idx, 1);
			}),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
	});

	afterEach(() => {
		window.matchMedia = originalMatchMedia;
	});

	it("returns false when matchMedia.matches is false", () => {
		matches = false;
		const { result } = renderHook(() => useIsMobile());
		expect(result.current).toBe(false);
	});

	it("returns true when matchMedia.matches is true", () => {
		matches = true;
		const { result } = renderHook(() => useIsMobile());
		expect(result.current).toBe(true);
	});

	it("uses the documented mobile breakpoint of 768px", () => {
		renderHook(() => useIsMobile());
		expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
	});

	it("updates when the media query changes", () => {
		const { result } = renderHook(() => useIsMobile());
		expect(result.current).toBe(false);

		act(() => {
			for (const listener of listeners) listener({ matches: true });
		});
		expect(result.current).toBe(true);

		act(() => {
			for (const listener of listeners) listener({ matches: false });
		});
		expect(result.current).toBe(false);
	});

	it("removes the change listener on unmount", () => {
		const { unmount } = renderHook(() => useIsMobile());
		expect(listeners).toHaveLength(1);
		unmount();
		expect(listeners).toHaveLength(0);
	});
});
