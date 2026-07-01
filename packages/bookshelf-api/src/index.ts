import {
	Bookshelf,
	type BookshelfConfig,
	type BookshelfData,
	type BookshelfTheme,
	DEFAULT_SHELVES,
	renderDocument,
	type Shelf,
} from "@dawdle.space/bookshelf";
import { decodeBookshelfConfig } from "@dawdle.space/bookshelf/config";
import { goodreadsRssSource } from "@dawdle.space/bookshelf/importer/goodreads-rss";
import { Hono } from "hono";
import { cors } from "hono/cors";

const CACHE_TTL_MS = 60 * 60 * 1000;
const DEFAULT_SHELF_IDS = new Set(DEFAULT_SHELVES.map((shelf) => shelf.id));

interface ShelfCacheEntry {
	expiresAt: number;
	shelf?: BookshelfData;
	pending?: Promise<BookshelfData>;
}

const shelfCache = new Map<string, ShelfCacheEntry>();

function themeFromQuery(value: string | undefined): BookshelfTheme | undefined {
	return value === "auto" || value === "light" || value === "dark" ? value : undefined;
}

function stylesheetFromQuery(value: string | undefined): string | undefined {
	if (!value) return undefined;
	try {
		const url = new URL(value);
		return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
	} catch {
		return undefined;
	}
}

function shelvesForConfig(config: BookshelfConfig): readonly Shelf[] {
	const sections =
		config.sections ??
		DEFAULT_SHELVES.map((shelf) => ({
			label: shelf.label,
			filter: { shelf: shelf.id },
		}));
	const ids = new Set<string>();
	const shelves: Shelf[] = [];
	for (const section of sections) {
		const id = section.filter?.shelf;
		if (!id || ids.has(id)) continue;
		ids.add(id);
		shelves.push(DEFAULT_SHELF_IDS.has(id) ? (id as Shelf) : { custom: id });
	}
	return shelves;
}

async function shelfFromConfig(config: BookshelfConfig) {
	if (config.dataSource.type === "static")
		throw new Error("Static dataSource cannot be refreshed by the API");
	const shelves = shelvesForConfig(config);
	const key = JSON.stringify({ dataSource: config.dataSource, shelves });
	const cached = shelfCache.get(key);
	if (cached?.shelf) {
		if (cached.expiresAt <= Date.now() && !cached.pending) {
			void refreshShelf(key, config).catch(() => undefined);
		}
		return cached.shelf;
	}
	if (cached?.pending) return cached.pending;
	return refreshShelf(key, config);
}

async function refreshShelf(key: string, config: BookshelfConfig): Promise<BookshelfData> {
	const bookshelf = new Bookshelf({ ...config, sources: [goodreadsRssSource] });
	const pending = bookshelf.import();
	shelfCache.set(key, { ...shelfCache.get(key), pending, expiresAt: Date.now() + CACHE_TTL_MS });
	try {
		const shelf = await pending;
		shelfCache.set(key, { shelf, expiresAt: Date.now() + CACHE_TTL_MS });
		return shelf;
	} catch (error) {
		const cached = shelfCache.get(key);
		if (cached?.shelf) shelfCache.set(key, { shelf: cached.shelf, expiresAt: cached.expiresAt });
		else shelfCache.delete(key);
		throw error;
	}
}

export const app: Hono = new Hono();

app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true }));

app.get("/bookshelf", async (c) => {
	const encoded = c.req.query("config");
	if (!encoded) return c.json({ error: "Missing config parameter" }, 400);
	try {
		return c.json(await shelfFromConfig(await decodeBookshelfConfig(encoded)));
	} catch (error) {
		return c.json(
			{ error: error instanceof Error ? error.message : "Could not load bookshelf" },
			400,
		);
	}
});

app.get("/embed", async (c) => {
	const encoded = c.req.query("config");
	if (!encoded) return c.text("Missing config parameter", 400);
	try {
		const config = await decodeBookshelfConfig(encoded);
		const shelf = await shelfFromConfig(config);
		const theme = themeFromQuery(c.req.query("theme"));
		const stylesheet = stylesheetFromQuery(c.req.query("stylesheet"));
		return c.html(
			renderDocument(
				shelf,
				{ ...config, theme: theme ?? config.theme },
				{ stylesheetHref: "/styles/default.css", cssHrefs: stylesheet ? [stylesheet] : [] },
			),
		);
	} catch (error) {
		return c.text(error instanceof Error ? error.message : "Could not render bookshelf", 400);
	}
});

export default app;
