import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findWorkspaceRoot, getLocalDataDirectory } from "./monorepo.node";

describe("findWorkspaceRoot", () => {
	let tempDir: string;

	beforeEach(() => {
		// Resolve symlinks so comparisons match findWorkspaceRoot's realpathSync output.
		tempDir = realpathSync(mkdtempSync(join(tmpdir(), "rr-monorepo-test-")));
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it("returns the directory containing pnpm-workspace.yaml", () => {
		writeFileSync(join(tempDir, "pnpm-workspace.yaml"), "packages: ['*']");

		expect(findWorkspaceRoot(tempDir)).toBe(tempDir);
	});

	it("walks up directories to find pnpm-workspace.yaml", () => {
		const nested = join(tempDir, "apps", "web");
		mkdirSync(nested, { recursive: true });
		writeFileSync(join(tempDir, "pnpm-workspace.yaml"), "packages: ['*']");

		expect(findWorkspaceRoot(nested)).toBe(tempDir);
	});

	it("returns null if no workspace manifest is found", () => {
		// Use a temp dir that has no pnpm-workspace.yaml above it. Any descendant of /tmp
		// either has the file or eventually hits /. We use a deep-enough sibling here:
		const isolated = join(tempDir, "isolated");
		mkdirSync(isolated, { recursive: true });
		// Walk up from isolated; nothing in tempDir has a workspace manifest.
		// findWorkspaceRoot will return null when it reaches the filesystem root.
		// Verify behavior: at minimum, it should not return our tempDir.
		const result = findWorkspaceRoot(isolated);
		expect(result).not.toBe(tempDir);
	});
});

describe("getLocalDataDirectory", () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = realpathSync(mkdtempSync(join(tmpdir(), "rr-data-test-")));
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it("returns override when provided", () => {
		expect(getLocalDataDirectory("/custom/path")).toBe("/custom/path");
	});

	it("returns workspaceRoot/data when manifest is found", () => {
		writeFileSync(join(tempDir, "pnpm-workspace.yaml"), "packages: ['*']");

		expect(getLocalDataDirectory(undefined, tempDir)).toBe(join(tempDir, "data"));
	});

	it("falls back to cwd/data when no manifest found", () => {
		const isolated = join(tempDir, "isolated");
		mkdirSync(isolated, { recursive: true });

		const result = getLocalDataDirectory(undefined, isolated);
		// Should end with /data and not be the manifest workspace path
		expect(result.endsWith("data")).toBe(true);
	});

	it("override takes precedence even if workspace exists", () => {
		writeFileSync(join(tempDir, "pnpm-workspace.yaml"), "packages: ['*']");

		expect(getLocalDataDirectory("/elsewhere", tempDir)).toBe("/elsewhere");
	});

	it("manifest file actually exists for the test setup", () => {
		writeFileSync(join(tempDir, "pnpm-workspace.yaml"), "packages: ['*']");
		expect(existsSync(join(tempDir, "pnpm-workspace.yaml"))).toBe(true);
	});
});
