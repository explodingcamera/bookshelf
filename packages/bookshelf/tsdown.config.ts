import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/cli.ts",
		"src/importer/goodreads-rss.ts",
		"src/covers.ts",
		"src/config.ts",
		"src/validate.ts",
	],
	format: ["esm"],
	dts: true,
	clean: true,
	outDir: "dist",
	unbundle: true,
});
