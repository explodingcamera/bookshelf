import app from "./index";

declare const Bun: {
	env: Record<string, string | undefined>;
	serve(options: { port: number; fetch: typeof app.fetch; idleTimeout: number }): { port: number };
};

// biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature requires bracket access.
const port = Number(Bun.env["PORT"] ?? 5174);
const server = Bun.serve({ port, fetch: app.fetch, idleTimeout: 120 });

console.log(`bookshelf-api listening on http://localhost:${server.port}`);
