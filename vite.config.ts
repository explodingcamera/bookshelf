import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
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
