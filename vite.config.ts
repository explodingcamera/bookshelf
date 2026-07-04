import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const browserTargets = ["chrome123", "firefox120", "safari17.5"];
const cssTargets = {
	chrome: 123 << 16,
	firefox: 120 << 16,
	safari: (17 << 16) | (5 << 8),
};

export default defineConfig({
	plugins: [react()],
	css: {
		transformer: "lightningcss",
		lightningcss: {
			targets: cssTargets,
		},
	},
	build: {
		target: browserTargets,
		cssTarget: browserTargets,
		cssMinify: "lightningcss",
	},
	server: {
		port: 5173,
		strictPort: true,
		proxy: {
			"/bookshelf": "http://localhost:5174",
			"/embed": "http://localhost:5174",
			"/health": "http://localhost:5174",
		},
	},
});
