// @ts-check

const betaPackages = ["drizzle-zod"];
const rcPackages = ["drizzle-orm", "drizzle-kit"];

/** @type {import('npm-check-updates').RunOptions} */
module.exports = {
	upgrade: true,
	workspaces: true,
	install: "always",
	packageManager: "pnpm",
	target: (packageName) => {
		if (betaPackages.includes(packageName)) return "@beta";
		if (rcPackages.includes(packageName)) return "@rc";
		return "latest";
	},
};
