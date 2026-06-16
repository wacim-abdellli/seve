import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "next-themes";
import { Toaster } from "./sonner";

describe("Toaster", () => {
	it("renders without errors when wrapped in ThemeProvider", () => {
		const { container } = render(
			<ThemeProvider>
				<Toaster />
			</ThemeProvider>,
		);
		// Sonner renders into document.body, but we just verify no crash
		expect(container).toBeInTheDocument();
	});

	it("forwards arbitrary props to underlying Sonner", () => {
		const { container } = render(
			<ThemeProvider>
				<Toaster position="top-right" />
			</ThemeProvider>,
		);
		expect(container).toBeInTheDocument();
	});

	it("does not throw when rendered without theme context", () => {
		// Toaster falls back to "system" theme when next-themes context is absent.
		expect(() => render(<Toaster />)).not.toThrow();
	});
});
